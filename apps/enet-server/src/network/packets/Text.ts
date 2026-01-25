
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

      const username = session.user.username;

      if (!username) {
        return peer.send(
          Variant.from(
            "OnConsoleMessage",
            "`4Failed to create player data`` Username already taken, please try again later.",
          ),
        );
      }
      // Get or create player data
      const player = await this.server.database.player.getOrCreatePlayer(userId, {
        displayName: username,
        name:        username,
      });

      if (!player) {
        return peer.send(
          Variant.from(
            "OnConsoleMessage",
            "`4Failed to create player data`` Please try again later.",
          ),
        );
      }

      peer.send(
        Variant.from("SetHasGrowID", 1, player.name, ltoken), // It will store the token on local machine client & sends back when client sends "/checktoken" endpoint.
        Variant.from(
          "OnSendToServer",
          randPort,
          Math.random() * (1000000 - 10000) + 10000,
          player.uid,
          `${config.web.address}|0|${customAlphabet("0123456789ABCDEF", 32)()}`,
          1,
          player.name,
        ),
      );
    }

    // TODO: 
    // 1. We're making OnSuperMain packet sending
    // 2. Make a items dat building that seperate items.dat between others platform
    // 3. then uh, I forgot. I'll check that after all todo's are complete

    if (text.tankIDName && text.tankIDPass) {
      // TODO: redirected checktoken and it has session token inside of tankIDPass
    }
  }
}
