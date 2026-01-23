import { Name } from "@/network/player/PlayerName";
import { PeerData } from "@growserver/types";
import {
  Peer as OldPeer
} from "growtopia.js";
import { Server } from "./Server";

export class Peer extends OldPeer<PeerData> {
  constructor(public server: Server, public netID: number, public channelID?: number) {
    super(server.server, netID, channelID);
  }


  /**
   * It should be 'data' but it seems it wont overriden, so named into 'player' instead
   */
  public get player() {
    return this.server.data.getPeer(this.netID);
  }


  public get name() {
    return this.player ? new Name(this.player) : "";
  }

}
