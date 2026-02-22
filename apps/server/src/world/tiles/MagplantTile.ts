import { Variant } from "growtopia.js";
import type { Base } from "../../core/Base";
import { Peer } from "../../core/Peer";
import type { World } from "../../core/World";
import type { TileData } from "@growserver/types";
import { LockPermission, ROLE } from "@growserver/const";
import { ExtendBuffer, DialogBuilder } from "@growserver/utils";
import { Tile } from "../Tile";
import { ItemDefinition } from "grow-items";

/** Max items a single Magplant 5000 can store */
const MAGPLANT_MAX_STORAGE = 5000;

/** Remote variant item IDs */
const MAGPLANT_REMOTE_IDS = new Set([5640, 5641]);

export class MagplantTile extends Tile {
  constructor(
    public base: Base,
    public world: World,
    public data: TileData,
  ) {
    super(base, world, data);
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private isRemote(): boolean {
    return MAGPLANT_REMOTE_IDS.has(this.data.fg);
  }

  private isOwner(peer: Peer): boolean {
    return (
      // If magplant data hasn't been initialised yet, treat as unclaimed
      // so the first person to wrench it (who has lock access) can claim it.
      !this.data.magplant ||
      this.data.magplant.ownerUserID === peer.data.userID ||
      peer.data.role === ROLE.DEVELOPER
    );
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────

  public async onPlaceForeground(
    peer: Peer,
    itemMeta: ItemDefinition,
  ): Promise<boolean> {
    if (!(await super.onPlaceForeground(peer, itemMeta))) return false;

    this.data.magplant = {
      ownerUserID: peer.data.userID,
      targetItemID: 0,
      storedAmount: 0,
      enabled: true,
      buildingMode: false,
    };

    // Track this tile's position in the world's persistent magplant index.
    const idx = this.data.x + this.data.y * this.world.data.width;
    if (!this.world.data.magplantTileIndices) {
      this.world.data.magplantTileIndices = [idx];
    } else if (!this.world.data.magplantTileIndices.includes(idx)) {
      this.world.data.magplantTileIndices.push(idx);
    }

    peer.sendConsoleMessage(
      "`2Magplant 5000`` placed! Wrench it to configure which item it should collect.",
    );
    return true;
  }

  public async onDestroy(peer: Peer): Promise<void> {
    // Snapshot stored items then clear BEFORE dropping so the drop loop
    // cannot re-intercept them into this (now-being-destroyed) magplant.
    const storedID = this.data.magplant?.targetItemID ?? 0;
    const storedAmount = this.data.magplant?.storedAmount ?? 0;
    this.data.magplant = undefined;

    // Remove from the world's persistent magplant index.
    const idx = this.data.x + this.data.y * this.world.data.width;
    if (this.world.data.magplantTileIndices) {
      const pos = this.world.data.magplantTileIndices.indexOf(idx);
      if (pos !== -1) this.world.data.magplantTileIndices.splice(pos, 1);
    }

    await super.onDestroy(peer);

    // Drop any stored items back to the ground.
    if (storedID > 0 && storedAmount > 0) {
      let toDrop = storedAmount;
      while (toDrop > 0) {
        const chunk = Math.min(toDrop, 200);
        this.world.drop(
          peer,
          this.data.x * 32,
          this.data.y * 32,
          storedID,
          chunk,
          { noSimilar: false },
        );
        toDrop -= chunk;
      }
    }
  }

  // ── interaction ────────────────────────────────────────────────────────────

  public async onPunch(peer: Peer): Promise<boolean> {
    if (
      !(await this.world.hasTilePermission(
        peer.data.userID,
        this.data,
        LockPermission.BREAK,
      ))
    ) {
      this.sendLockSound(peer);
      return false;
    }

    if (!this.isOwner(peer)) {
      peer.sendTextBubble("Only the owner of this Magplant can use it!", true);
      this.sendLockSound(peer);
      return false;
    }

    const mp = this.data.magplant;
    if (!mp || mp.targetItemID <= 0) {
      // No item configured — fall through to normal punch (break)
      return super.onPunch(peer);
    }

    // Toggle building mode
    mp.buildingMode = !mp.buildingMode;
    const itemName =
      this.base.items.metadata.items.get(mp.targetItemID.toString())?.name ??
      "item";

    if (mp.buildingMode) {
      peer.sendConsoleMessage(
        "`2Building mode: `$ACTIVE``. Use the MAGPLANT 5000 Remote to build `w" +
          itemName +
          "`` directly from the MAGPLANT 5000's storage.",
      );
    } else {
      peer.sendConsoleMessage("`2Building mode: `4DISABLED``.");
    }

    this.world.every((p) => this.tileUpdate(p));
    return true;
  }

  public async onWrench(peer: Peer): Promise<boolean> {
    // World must be locked for the Magplant to operate
    const worldOwner = this.world.getOwnerUID();
    if (!worldOwner) {
      peer.sendTextBubble(
        "The Magplant 5000 only works in `$World Locked`` worlds!",
        false,
      );
      return false;
    }

    if (!this.isOwner(peer)) {
      peer.sendTextBubble(
        "Only the owner of this Magplant can configure it!",
        true,
      );
      this.sendLockSound(peer);
      return false;
    }

    // Ensure magplant data exists (may be missing on blocks placed before
    // this code was deployed, or loaded from an older DB snapshot).
    if (!this.data.magplant) {
      this.data.magplant = {
        ownerUserID: peer.data.userID,
        targetItemID: 0,
        storedAmount: 0,
        enabled: true,
        buildingMode: false,
      };
    }
    // Migrate older magplant data that may lack newer fields.
    if (this.data.magplant.enabled === undefined)
      this.data.magplant.enabled = true;
    if (this.data.magplant.buildingMode === undefined)
      this.data.magplant.buildingMode = false;

    const mp = this.data.magplant;
    const itemMeta = this.base.items.metadata.items.get(
      this.data.fg.toString(),
    )!;

    const dialog = new DialogBuilder()
      .defaultColor("`o")
      .addLabelWithIcon("`wMAGPLANT 5000``", itemMeta.id as number, "big")
      .embed("tilex", this.data.x)
      .embed("tiley", this.data.y);

    if (mp.targetItemID <= 0) {
      // ── State 1: No item configured ──────────────────────────────────
      dialog.addTextBox("`6The machine is empty.``");
      dialog.addItemPicker(
        "magplant_choose_item",
        "Choose Item",
        "Choose Item",
      );
      dialog.endDialog("magplant_edit", "Close", "");
    } else {
      // ── State 2 & 3: Item configured ─────────────────────────────────
      const stored = this.base.items.metadata.items.get(
        mp.targetItemID.toString(),
      );
      const itemName = stored?.name ?? "Unknown";

      if (mp.storedAmount > 0) {
        dialog.addTextBox(
          "The machine contains `w" +
            mp.storedAmount +
            "`` `2" +
            itemName +
            "``",
        );
        dialog.addButton("magplant_add_items", "Add Items to the machine");
        dialog.addButton("magplant_retrieve", "Retrieve Items");
      } else {
        dialog.addLabelWithIcon(
          "`2" + itemName + "``",
          mp.targetItemID,
          "small",
        );
        dialog.addTextBox("`6The machine is currently empty!``");
        dialog.addButton("magplant_add_items", "Add Items to the machine");
      }

      dialog.addButton("magplant_change_item", "Change Item");

      // Building mode status
      if (mp.buildingMode) {
        dialog.addTextBox(
          "Building mode: `2ACTIVE``\nUse the MAGPLANT 5000 Remote to build `2" +
            itemName +
            "`` directly from the MAGPLANT 5000's storage.",
        );
      } else {
        dialog.addTextBox(
          "Building mode: `4DISABLED``\nPunch to activate building mode.",
        );
      }

      if (!this.isRemote()) {
        dialog.addButton("magplant_get_remote", "`2Get Remote``");
      }

      dialog.addCheckbox(
        "enable_collection",
        "Enable Collection.",
        mp.enabled ? "SELECTED" : "NOT_SELECTED",
      );

      dialog.endDialog("magplant_edit", "Close", "Update");
    }

    peer.send(Variant.from("OnDialogRequest", dialog.str()));
    return true;
  }

  /**
   * When a player places an item on the magplant:
   * - If no target item is configured, set it.
   * - If it matches the target, add it to storage.
   * - Otherwise, reject.
   */
  public async onItemPlace(peer: Peer, item: ItemDefinition): Promise<boolean> {
    if (!this.isOwner(peer)) {
      peer.sendTextBubble("Only the owner can configure this Magplant!", true);
      return false;
    }

    const mp = this.data.magplant;
    if (!mp) return false;

    if (item.id! <= 1) {
      peer.sendTextBubble(
        "You can't store that item type in a Magplant!",
        true,
      );
      return false;
    }

    // No target set yet — configure it
    if (mp.targetItemID <= 0) {
      mp.targetItemID = item.id!;
      const itemName = item.name ?? "item";
      peer.sendConsoleMessage(
        "`2Magplant 5000`` is now set to collect `w" + itemName + "``!",
      );
      this.world.every((p) => this.tileUpdate(p));
      return true;
    }

    // Different item than the configured target
    if (mp.targetItemID !== item.id) {
      peer.sendTextBubble(
        "Change the item first before setting a new one!",
        true,
      );
      return false;
    }

    // Same item — add to storage
    const space = MAGPLANT_MAX_STORAGE - mp.storedAmount;
    if (space <= 0) {
      peer.sendTextBubble("The machine is full!", true);
      return false;
    }

    // Add 1 item from placement
    mp.storedAmount += 1;
    peer.removeItemInven(item.id!, 1);

    const itemName = item.name ?? "item";
    peer.sendConsoleMessage(
      "`2Added 1 " +
        itemName +
        "`` to the machine. (" +
        mp.storedAmount +
        "/" +
        MAGPLANT_MAX_STORAGE +
        ")",
    );
    this.world.every((p) => this.tileUpdate(p));
    return true;
  }

  /**
   * Called by World.drop (with tree:true) to give this magplant a chance to
   * intercept a matching item drop before it hits the ground.
   * Returns the number of items actually consumed (0 if none).
   */
  public tryCollect(itemID: number, amount: number): number {
    const mp = this.data.magplant;
    if (!mp || !mp.enabled || mp.targetItemID !== itemID) return 0;
    if (mp.storedAmount >= MAGPLANT_MAX_STORAGE) return 0;

    const canCollect = Math.min(amount, MAGPLANT_MAX_STORAGE - mp.storedAmount);
    mp.storedAmount += canCollect;
    return canCollect;
  }

  // ── serialization ──────────────────────────────────────────────────────────

  // Magplant data is stored server-side only.
  // Do NOT write any extra bytes here — the client only expects extra tile data
  // when TileFlags.TILEEXTRA is set.  Writing extra bytes without that flag
  // shifts every subsequent tile in the world packet, corrupting collision data
  // and causing players to fall through all tiles after the magplant.
  public async serialize(_dataBuffer: ExtendBuffer): Promise<void> {}
}
