import { IEvent } from "@/abstracts/IEvent";
import type { Server } from "@/core/Server";
import { Debug, ThrowError } from "@/decorators";
import type { Database } from "@growserver/db";
import logger from "@growserver/logger";

export default class EventReady extends IEvent {
  public name: string = "ready";
  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to call Ready event")
  public async execute(serverID: number, server: Server) {
    logger.info(`[S-${serverID}] Ready with port ${server.port}`);
  }
}
