import { IEvent } from "@/abstracts/IEvent";
import logger from "@growserver/logger";

export default class EventReady extends IEvent {
  public name: string = "ready";
  constructor() {
    super();
  }

  public async execute(serverID: number, port: number) {
    logger.info(`[S-${serverID}] Ready with port ${port}`);
  }
}
