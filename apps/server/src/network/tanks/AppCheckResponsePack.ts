import { TankPacket, Variant } from "growtopia.js";
import { Base } from "../../core/Base";
import { Peer } from "../../core/Peer";
import { World } from "../../core/World";
import logger from "@growserver/logger";

export class AppCheckResponsePack {
  constructor(
    public base: Base,
    public peer: Peer,
    public tank: TankPacket,
    public world: World,
  ) {}

  public async execute() {
    if (this.tank.data?.type !== 24) {
      logger.warn("Invalid APP_CHECK_RESPONSE packet received.");
      return;
    }

    if (!this.peer.isValid()) {
      logger.warn("Peer is invalid during app check. Disconnecting...");
      this.peer.disconnect();
      return;
    }

    // Only send SuperMain once — if already sent, ignore further APP_CHECK_RESPONSE
    if (this.peer.data.loggedIn) {
      logger.info(
        `[APP_CHECK] Peer ${this.peer.data.netID} already processed, ignoring duplicate`,
      );
      return;
    }
    this.peer.data.loggedIn = true;
    this.peer.saveToCache(); // persist so duplicate APP_CHECK_RESPONSE packets are blocked

    logger.info(`[APP_CHECK] Peer ${this.peer.data.netID} passed`);

    // Send SetHasGottenChatAccess here to ensure the client enables chat UI
    // after the app check completes on the game server connection.
    this.peer.send(Variant.from("SetHasGottenChatAccess", 1));
  }
}
