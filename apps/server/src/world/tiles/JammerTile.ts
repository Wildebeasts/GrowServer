import type { Base } from "../../core/Base";
import { Peer } from "../../core/Peer";
import type { World } from "../../core/World";
import type { TileData, Jammer } from "@growserver/types";
import { ItemDefinition } from "grow-items";
import { Tile } from "../Tile";
import { LockPermission, TileFlags } from "@growserver/const";

/** Maps item ID → jammer type */
const JAMMER_IDS: Record<number, Jammer["type"]> = {
  226: "signal",
  1276: "punch",
  1278: "zombie",
};

/** Console messages sent to the toggler on enable/disable */
const JAMMER_MSG: Record<Jammer["type"], [string, string]> = {
  signal: [
    "Signal jammer enabled. This world is now `4hidden`` from the universe.",
    "Signal jammer disabled.  This world is `2visible`` to the universe.",
  ],
  punch: [
    "`2No-Punch zone`` enabled. Players cannot punch each other here.",
    "`2No-Punch zone`` disabled.",
  ],
  zombie: [
    "`2Zombie-free zone`` enabled. Players are immune to zombie infection here.",
    "`2Zombie-free zone`` disabled.",
  ],
};

export class JammerTile extends Tile {
  constructor(
    public base: Base,
    public world: World,
    public data: TileData,
  ) {
    super(base, world, data);
  }

  private jammerType(): Jammer["type"] | null {
    return JAMMER_IDS[this.data.fg] ?? null;
  }

  private getOrCreateJammerEntry(type: Jammer["type"]): Jammer {
    if (!this.world.data.jammers) this.world.data.jammers = [];
    let entry = this.world.data.jammers.find((j) => j.type === type);
    if (!entry) {
      entry = { type, enabled: false };
      this.world.data.jammers.push(entry);
    }
    return entry;
  }

  private removeJammerEntry(type: Jammer["type"]): void {
    if (!this.world.data.jammers) return;
    this.world.data.jammers = this.world.data.jammers.filter(
      (j) => j.type !== type,
    );
  }

  public async onPlaceForeground(
    peer: Peer,
    itemMeta: ItemDefinition,
  ): Promise<boolean> {
    const type = this.jammerType();
    if (type) {
      this.getOrCreateJammerEntry(type);
      this.data.flags &= ~TileFlags.OPEN;
    }
    return super.onPlaceForeground(peer, itemMeta);
  }

  public async onPunch(peer: Peer): Promise<boolean> {
    const type = this.jammerType();
    if (!type) return super.onPunch(peer);

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

    this.data.flags ^= TileFlags.OPEN;
    const isEnabled = !!(this.data.flags & TileFlags.OPEN);

    const entry = this.getOrCreateJammerEntry(type);
    entry.enabled = isEnabled;

    // Send updated tile state to all peers in the world
    this.world.every((p) => this.tileUpdate(p));

    // Only the toggler gets the console message (matches GT behavior)
    const [enableMsg, disableMsg] = JAMMER_MSG[type];
    peer.sendConsoleMessage(isEnabled ? enableMsg : disableMsg);

    return true;
  }

  public async onDestroy(peer: Peer): Promise<void> {
    const type = this.jammerType();
    if (type) {
      const entry = this.world.data.jammers?.find((j) => j.type === type);
      if (entry) entry.enabled = false;
      this.removeJammerEntry(type);
    }
    await super.onDestroy(peer);
  }
}
