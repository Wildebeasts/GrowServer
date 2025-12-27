import { IEvent } from "@/abstracts/IEvent";
import { Debug, ThrowError } from "@/decorators";
import logger from "@growserver/logger";

export default class EventConnect extends IEvent {
  public name: string = "connect";
  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to call Connect event")
  public async execute(serverID: number, netID: number) {
    logger.info(`[S-${serverID}] Connected netID: ${netID}`);
  }
}
