import { IEvent } from "@/abstracts/IEvent";
import { Debug, ThrowError } from "@/decorators";
import logger from "@growserver/logger";

export default class EventReady extends IEvent {
  public name: string = "ready";
  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to call Ready event")
  public async execute(serverID: number, port: number) {
    logger.info(`[S-${serverID}] Ready with port ${port}`);
  }
}
