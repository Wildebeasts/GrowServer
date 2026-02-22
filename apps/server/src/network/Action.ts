import { Peer } from "../core/Peer";
import { Base } from "../core/Base";
import { parseAction } from "@growserver/utils";
import { ActionMap } from "./actions/index";
import logger from "@growserver/logger";

export class IActionPacket {
  public obj: Record<string, string>;

  constructor(
    public base: Base,
    public peer: Peer,
    public chunk: Buffer,
  ) {
    this.obj = parseAction(chunk);
  }

  public async execute() {
    if (!this.obj.action) return;
    logger.debug(`Receive action packet: ${JSON.stringify(this.obj)}`);

    const actionType = this.obj.action;

    try {
      const Class = ActionMap[actionType];

      if (!Class) {
        logger.debug(`Unhandled action: ${actionType}`);
        return;
      }

      const action = new Class(this.base, this.peer);
      await action.execute(this.obj);
    } catch (e) {
      logger.warn(e);
    }
  }
}
