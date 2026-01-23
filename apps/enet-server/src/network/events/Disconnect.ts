import { IEvent } from "@/abstracts/IEvent";
import type { Server } from "@/core/Server";
import { Debug, ThrowError } from "@/decorators";
import type { Database } from "@growserver/db";
import logger from "@growserver/logger";

export default class EventDisconnect extends IEvent {
  public name: string = "disconnect";
  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to call Disconnect event")
  public async execute(serverID: number, server: Server, netID: number) {
    logger.info(`[S-${serverID}] Disconnected netID: ${netID}`);

    if (!server.data.deletePeer(netID)) {
      logger.warn("Failed to delete peer cache: ");
      logger.warn({ peer: server.data.getPeer(netID) });
    };

  }
}
