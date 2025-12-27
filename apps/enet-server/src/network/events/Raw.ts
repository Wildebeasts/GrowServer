import { IEvent } from "@/abstracts/IEvent";
import { Debug, ThrowError } from "@/decorators";
import logger from "@growserver/logger";

export default class EventRaw extends IEvent {
  public name: string = "raw";
  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to call Raw event")
  public async execute(serverID: number, netID: number, channelID: number, data: Buffer) {
    logger.info(`[S-${serverID}] client sending data:\n${data.toString("hex").match(/../g)?.join(" ")}`);
  }
}
