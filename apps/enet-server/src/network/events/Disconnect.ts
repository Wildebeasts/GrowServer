import { IEvent } from "@/abstracts/IEvent";
import { Debug, ThrowError } from "@/decorators";
import logger from "@growserver/logger";

export default class EventDisconnect extends IEvent {
  public name: string = "disconnect";
  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to call Disconnect event")
  public async execute(serverID: number, netID: number) {
    logger.info(`[S-${serverID}] Disconnected netID: ${netID}`);
  }
}
