import { IEvent } from "@/abstracts/IEvent";
import type { Server } from "@/core/Server";
import { Debug, ThrowError } from "@/decorators";
import { PacketTypes, TankTypes } from "@growserver/const";
import type { Database } from "@growserver/db";
import logger from "@growserver/logger";
import { ExtendBuffer, parseAction } from "@growserver/utils";
import PlayerAuth from "../player/PlayerAuth";
import { TankPacket } from "growtopia.js";

export default class Tank {

  constructor(private server: Server, public buf: ExtendBuffer, public serverID: number, public netID: number, public channelID: number) {
  }


  @Debug()
  @ThrowError("Failed to execute text packet")
  public async execute() {
    const tank = TankPacket.fromBuffer(this.buf.data);
    const tankType = tank.data?.type as TankTypes;

    console.log({tank});
  }
}
