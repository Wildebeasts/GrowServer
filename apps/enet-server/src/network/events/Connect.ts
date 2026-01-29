import { IEvent } from "@/abstracts/IEvent";
import { Peer } from "@/core/Peer";
import type { Server } from "@/core/Server";
import { Debug, ThrowError } from "@/decorators";
import type { Database } from "@growserver/db";
import logger from "@growserver/logger";
import { TextPacket } from "growtopia.js";

export default class EventConnect extends IEvent {
  public name: string = "connect";
  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to call Connect event")
  public async execute(serverID: number, server: Server, netID: number) {
    logger.info(`[S-${serverID}] Connected netID: ${netID}`);

    // Initialize empty peer data
    server.data.setPeer(netID, {
      channelID: 0,
      world:     "",
      inventory: {
        max:   0,
        items: []
      },
      rotatedLeft: false,
      name:        "",
      displayName: "",
      netID,
      country:     "",
      userId:      "",
      uid:         0,
      role:        "",
      gems:        0,
      clothing:    {
        shirt:    0,
        pants:    0,
        feet:     0,
        face:     0,
        hand:     0,
        back:     0,
        hair:     0,
        mask:     0,
        necklace: 0,
        ances:    0
      },
      exp:   0,
      level: 0,
      state: {
        mod:             0,
        canWalkInBlocks: false,
        modsEffect:      0,
        lava:            {
          damage:       0,
          resetStateAt: 0
        },
        isGhost: false
      }
    });
    

    const peer = server.data.getPeerInstance(server, netID);

    if (!peer) return;

    this.sendHelloPacket(peer);
  }

  @Debug()
  @ThrowError("Failed to send HelloPacket to client")
  private async sendHelloPacket(peer: Peer) {
    return peer.send(TextPacket.from(0x1));
  }
}
