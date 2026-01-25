import { IEvent } from "@/abstracts/IEvent";
import type { Server } from "@/core/Server";
import { Debug, ThrowError } from "@/decorators";
import { PacketTypes } from "@growserver/const";
import type { Database } from "@growserver/db";
import logger from "@growserver/logger";
import { ExtendBuffer, parseAction } from "@growserver/utils";
import PlayerAuth from "../player/PlayerAuth";

export default class Action {
  private playerAuth: PlayerAuth;

  constructor(private server: Server, public buf: ExtendBuffer, public serverID: number, public netID: number, public channelID: number) {
    this.playerAuth = new PlayerAuth(this.server);
  }


  @Debug()
  @ThrowError("Failed to execute text packet")
  public async execute() {
    const text: Record<string, string> = parseAction(this.buf.data);

    const ltoken = text.ltoken;

    if (ltoken) {
      const session = await this.playerAuth.validateToken(ltoken);
      logger.info({session, ltoken});
    }
  }
}
