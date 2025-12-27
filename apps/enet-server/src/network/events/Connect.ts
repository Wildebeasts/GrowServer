import { IEvent } from "@/abstracts/IEvent";
import logger from "@growserver/logger";

export default class EventConnect extends IEvent {
  public name: string = "connect";
  constructor() {
    super();
  }

  public async execute(serverID: number, netID: number) {
    logger.info(`[S-${serverID}] Connected netID: ${netID}`);
  }
}
