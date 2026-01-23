
import type { Server } from "@/core/Server";
import { Debug, ThrowError } from "@/decorators";
import logger from "@growserver/logger";
import { ExtendBuffer, parseAction } from "@growserver/utils";
import PlayerAuth from "../player/PlayerAuth";
import { Variant } from "growtopia.js";
import { config } from "@growserver/config";
import { customAlphabet } from "nanoid";

export default class Text {
  private playerAuth: PlayerAuth;

  constructor(private server: Server, public buf: ExtendBuffer, public serverID: number, public netID: number, public channelID: number) {
    this.playerAuth = new PlayerAuth(this.server);
  }


  @Debug()
  @ThrowError("Failed to execute text packet")
  public async execute() {
    const text: Record<string, string> = parseAction(this.buf.data);
    const peer = this.server.data.getPeerInstance(this.server, this.netID);
    if (!peer) return;

    if (text.ltoken) {
      const ltoken = text.ltoken;
      const session = await this.playerAuth.validateToken(ltoken);

      if (!session || !session?.user) {
        return peer.send(
          Variant.from(
            "OnConsoleMessage",
            "`4Session Expired`` It seems that this account already expired. try login again",
          ),
        );
      }

      const userId = session.user._id.toString();
      const targetPeerData = this.server.data.peers.find((p) => p.data.userId === userId);
      const isPlayerOnline = !!targetPeerData;
      
      if (isPlayerOnline) {
        const targetPeer = this.server.data.getPeerInstance(this.server, targetPeerData.data.netID);
        if (!targetPeer) return;

        peer.send(
          Variant.from(
            "OnConsoleMessage",
            "`4Already Logged In?`` It seems that this account already logged in by somebody else.",
          ),
        );

        // targetPeer.leaveWorld(); // TODO: not yet
        targetPeer.disconnect();
      }

      const ports = config.web.ports;
      const randPort = ports[Math.floor(Math.random() * ports.length)];

      // TODO: create the player data when its empty or not even exist.
      const player = {} as Record<string, string>;

      peer.send(
        Variant.from("SetHasGrowID", 1, player.name, ltoken), // It will store the token on local machine client & sends back when client sends "/checktoken" endpoint.
        Variant.from(
          "OnSendToServer",
          randPort,
          Math.random() * (1000000 - 10000) + 10000,
          userId, // NOTE: idk if this works with string but yeah lets try
          `${config.web.address}|0|${customAlphabet("0123456789ABCDEF", 32)()}`,
          1,
          player.name,
        ),
      );
    }

    if (text.tankIDName && text.tankIDPass) {
      // TODO: redirected checktoken and it has session token inside of tankIDPass
    }
  }
}
