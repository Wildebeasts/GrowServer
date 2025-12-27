import { IEvent } from "@/abstracts/IEvent";
import logger from "@growserver/logger";

export default class EventDisconnect extends IEvent {
  public name: string = "disconnect";
  constructor() {
    super();
  }

  public async execute(serverID: number, netID: number) {
    logger.info(`[S-${serverID}] Disconnected netID: ${netID}`);
  }
}
