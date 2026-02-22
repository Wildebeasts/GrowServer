import { type NonEmptyObject } from "type-fest";
import { Base } from "../../core/Base";
import { Peer } from "../../core/Peer";
import { World } from "../../core/World";
import type { TileData } from "@growserver/types";
import { tileFrom } from "../../world/tiles";
import { MagplantTile } from "../../world/tiles/MagplantTile";
import { ROLE } from "@growserver/const";

const MAGPLANT_MAX_STORAGE = 5000;
/** Remote item ID given out by wrenching a main Magplant 5000 */
const REMOTE_ITEM_ID = 5640;

export class MagplantEdit {
  private world: World;
  private pos: number;
  private block: TileData;

  constructor(
    public base: Base,
    public peer: Peer,
    public action: NonEmptyObject<{
      dialog_name: string;
      tilex: string;
      tiley: string;
      buttonClicked?: string;
      magplant_choose_item?: string;
      enable_collection?: string;
    }>,
  ) {
    this.world = this.peer.currentWorld()!;
    this.pos =
      parseInt(this.action.tilex) +
      parseInt(this.action.tiley) * (this.world?.data.width as number);
    this.block = this.world?.data.blocks[this.pos] as TileData;
  }

  private isOwner(): boolean {
    return (
      !this.block.magplant ||
      this.block.magplant?.ownerUserID === this.peer.data.userID ||
      this.peer.data.role === ROLE.DEVELOPER
    );
  }

  public async execute(): Promise<void> {
    if (!this.action.tilex || !this.action.tiley) return;
    if (!this.isOwner()) return;

    // Ensure magplant data exists
    if (!this.block.magplant) {
      this.block.magplant = {
        ownerUserID: this.peer.data.userID,
        targetItemID: 0,
        storedAmount: 0,
        enabled: true,
        buildingMode: false,
      };
    }

    const btn = this.action.buttonClicked ?? "";
    const mp = this.block.magplant;
    const tile = tileFrom(this.base, this.world, this.block) as MagplantTile;

    switch (btn) {
      case "magplant_choose_item": {
        // Item picker result — the selected item ID
        const chosenID = parseInt(this.action.magplant_choose_item ?? "0");
        if (!chosenID || chosenID <= 1) {
          this.peer.sendTextBubble(
            "You can't store that item type in a Magplant!",
            true,
          );
          return;
        }
        const itemInfo = this.base.items.metadata.items.get(
          chosenID.toString(),
        );
        mp.targetItemID = chosenID;
        mp.storedAmount = 0;
        this.peer.sendConsoleMessage(
          "`2Magplant 5000`` is now set to collect `w" +
            (itemInfo?.name ?? "item") +
            "``!",
        );
        break;
      }

      case "magplant_add_items": {
        // Transfer items from player's backpack into the magplant
        if (mp.targetItemID <= 0) return;

        const invItem = this.peer.searchItem(mp.targetItemID);
        if (!invItem || invItem.amount <= 0) {
          this.peer.sendTextBubble("You don't have any of that item!", true);
          return;
        }

        const space = MAGPLANT_MAX_STORAGE - mp.storedAmount;
        if (space <= 0) {
          this.peer.sendTextBubble("The machine is full!", true);
          return;
        }

        const toAdd = Math.min(invItem.amount, space);
        this.peer.removeItemInven(mp.targetItemID, toAdd);
        mp.storedAmount += toAdd;

        const itemName =
          this.base.items.metadata.items.get(mp.targetItemID.toString())
            ?.name ?? "item";
        this.peer.sendConsoleMessage(
          "`2Added " +
            toAdd +
            " " +
            itemName +
            "`` to the machine. (" +
            mp.storedAmount +
            "/" +
            MAGPLANT_MAX_STORAGE +
            ")",
        );
        break;
      }

      case "magplant_retrieve": {
        // Take stored items out of the magplant into the backpack
        if (mp.storedAmount <= 0 || mp.targetItemID <= 0) {
          this.peer.sendTextBubble("Nothing stored!", true);
          return;
        }
        const itemName =
          this.base.items.metadata.items.get(mp.targetItemID.toString())
            ?.name ?? "item";

        let toGive = mp.storedAmount;
        let given = 0;
        while (toGive > 0) {
          const chunk = Math.min(toGive, 200);
          if (!this.peer.canAddItemToInv(mp.targetItemID, chunk)) break;
          this.peer.addItemInven(mp.targetItemID, chunk);
          given += chunk;
          toGive -= chunk;
        }
        mp.storedAmount -= given;
        if (given > 0) {
          this.peer.sendConsoleMessage(
            "`2Took " +
              given +
              " " +
              itemName +
              "``" +
              (mp.storedAmount > 0 ? " (" + mp.storedAmount + " left)" : "") +
              ".",
          );
        } else {
          this.peer.sendTextBubble("Your backpack is full!", true);
        }
        break;
      }

      case "magplant_change_item": {
        // Drop any remaining stored items, then clear the target
        if (mp.storedAmount > 0 && mp.targetItemID > 0) {
          let toDrop = mp.storedAmount;
          while (toDrop > 0) {
            const chunk = Math.min(toDrop, 200);
            this.world.drop(
              this.peer,
              this.block.x * 32,
              this.block.y * 32,
              mp.targetItemID,
              chunk,
              { noSimilar: false },
            );
            toDrop -= chunk;
          }
        }
        mp.targetItemID = 0;
        mp.storedAmount = 0;
        mp.buildingMode = false;
        this.peer.sendConsoleMessage(
          "`2Magplant 5000`` cleared. You can now choose a new item.",
        );
        break;
      }

      case "magplant_get_remote": {
        if (!this.peer.canAddItemToInv(REMOTE_ITEM_ID)) {
          this.peer.sendTextBubble(
            "Your backpack is full! Make room first.",
            true,
          );
          return;
        }
        this.peer.addItemInven(REMOTE_ITEM_ID, 1);

        // Link this remote to this specific magplant
        this.peer.data.magplantLink = {
          world: this.world.worldName,
          tileIndex: this.pos,
        };
        this.peer.saveToCache();

        this.peer.sendConsoleMessage(
          "`2You received 1 Magplant 5000 Remote``!",
        );
        break;
      }

      default: {
        // "Update" button or close — update enable_collection checkbox
        if (this.action.enable_collection !== undefined) {
          mp.enabled = this.action.enable_collection === "1";
        }
        break;
      }
    }

    this.world.every((p) => tile.tileUpdate(p));
    await this.world.saveToCache();
    await this.world.saveToDatabase();
  }
}
