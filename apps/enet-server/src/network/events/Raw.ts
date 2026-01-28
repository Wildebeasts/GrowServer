import { IEvent } from "@/abstracts/IEvent";
import type { Server } from "@/core/Server";
import { Debug, ThrowError } from "@/decorators";
import { config } from "@growserver/config";
import { PacketTypes } from "@growserver/const";
import type { Database } from "@growserver/db";
import logger from "@growserver/logger";
import { ExtendBuffer, parseAction } from "@growserver/utils";
import Text from "../packets/Text";
import Action from "../packets/Action";
import Tank from "../packets/Tank";

export default class EventRaw extends IEvent {
  public name: string = "raw";
  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to call Raw event")
  public async execute(serverID: number, server: Server, netID: number, channelID: number, data: Buffer) {
    logger.debug(`[S-${serverID}] client sending data:\n${data.toString("hex").match(/../g)?.join(" ")}`);

    const buf = new ExtendBuffer(0);
    buf.data = data;

    const type = buf.readU32();

    switch (type) {
      case PacketTypes.TEXT: {
        new Text(server, buf, serverID, netID, channelID).execute();
        break;
      }
      case PacketTypes.ACTION: {
        new Action(server, buf, serverID, netID, channelID).execute();
        break;
      }
      case PacketTypes.TANK: {
        new Tank(server, buf, serverID, netID, channelID).execute();
        break;
      }
    }
  }

  @Debug()
  @ThrowError("Failed to validating ltoken")
  public async validateToken(token: string, database: Database) {
    const sessionData = await database.models.Session.findOne({ token })
      .populate({
        path:     'userId',
        model:    'User',
        populate: {
          path:  'playerId',
          model: 'Player'
        }
      });
    
    if (!sessionData) {
      return null;
    }
    
    if (new Date(sessionData.expiresAt) < new Date()) {
      return null;
    }
    
    const user = sessionData.userId as Record<string, string>;
    const player = user?.playerId || null;
    
    return { session: sessionData, user, player };
  }
}
