import { Variant, TankPacket } from "growtopia.js";
import { TankTypes } from "@growserver/const";
import { NonEmptyObject } from "type-fest";
import { deflateSync } from "zlib";
import { readFileSync } from "fs";
import { join } from "path";
import { Server } from "@/core/Server";
import { Peer } from "@/core/Peer";

export class RefreshItemData {
  constructor(
    private server: Server,
    private peer: Peer,
  ) {}

  public async execute(
    _action: NonEmptyObject<Record<string, string>>,
  ): Promise<void> {



    this.peer.send(
      Variant.from(
        "OnConsoleMessage",
        `One moment. Updating item data...`,
      ),
      TankPacket.from({
        type: TankTypes.SEND_ITEM_DATABASE_DATA,
        info: itemsContent.length,
        data: () => deflateSync(itemsContent),
      }),
    );
  }
}
