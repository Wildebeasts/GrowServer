import type { Class } from "type-fest";
import { ActionTypes, TankTypes } from "@growserver/const";
import { DoorTile } from "./DoorTile";
import { NormalTile } from "./NormalTile";
import { SignTile } from "./SignTile";
import { Tile } from "../Tile";
import type { World } from "../../core/World";
import type { TileData } from "@growserver/types";
import { LockTile } from "./LockTile";
import type { Base } from "../../core/Base";
import { HeartMonitorTile } from "./HeartMonitorTile";
import { DisplayBlockTile } from "./DisplayBlockTile";
import { SwitcheROO } from "./SwitcheROO";
import { WeatherTile } from "./WeatherTile";
import { DiceTile } from "./DiceTile";
import { SeedTile } from "./SeedTile";
import { JammerTile } from "./JammerTile";
import { MagplantTile } from "./MagplantTile";
import { ExtendBuffer } from "@growserver/utils";
import { TankPacket } from "growtopia.js";

const TileMap: Record<number, Class<Tile>> = {
  [ActionTypes.DOOR]: DoorTile,
  [ActionTypes.MAIN_DOOR]: DoorTile,
  [ActionTypes.PORTAL]: DoorTile,
  [ActionTypes.SIGN]: SignTile,
  [ActionTypes.LOCK]: LockTile,
  [ActionTypes.HEART_MONITOR]: HeartMonitorTile,
  [ActionTypes.DISPLAY_BLOCK]: DisplayBlockTile,
  [ActionTypes.SWITCHEROO]: SwitcheROO,
  [ActionTypes.WEATHER_MACHINE]: WeatherTile,
  [ActionTypes.DICE]: DiceTile,
  [ActionTypes.BACKGROUND]: NormalTile,
  [ActionTypes.FOREGROUND]: NormalTile,
  [ActionTypes.SEED]: SeedTile,
  [ActionTypes.JAMMER]: JammerTile,
};

// constructs a new Tile subclass based on the ActionType.
// if itemType is not specified, it will get the item type from data.fg.
//  otherwise, it will use the provided itemType. (Only usesd to bootstrap itemType)
/** Item IDs that are always handled by MagplantTile regardless of items.dat type.
 *  Only the placed block (5638) — NOT the seed (5639), which must go through SeedTile. */
const MAGPLANT_ITEM_IDS = new Set([5638]);

const tileFrom = (
  base: Base,
  world: World,
  data: TileData,
  itemType?: ActionTypes,
) => {
  if (MAGPLANT_ITEM_IDS.has(data.fg)) {
    return new MagplantTile(base, world, data);
  }
  const itemMeta = base.items.metadata.items.get(data.fg.toString());
  const type =
    itemType ?? (itemMeta?.type as ActionTypes) ?? ActionTypes.FOREGROUND;
  const TileClass = TileMap[type] ?? NormalTile;
  return new TileClass(base, world, data);
};

//TOOD: Move this to appropriate place.
async function tileUpdateMultiple(world: World, tiles: Tile[]): Promise<void> {
  const finalBuffer = new ExtendBuffer(0);

  for (const tile of tiles) {
    const tileBuffer = await tile.parse();

    finalBuffer.grow(tileBuffer.data.byteLength + 8);
    finalBuffer.writeU32(tile.data.x);
    finalBuffer.writeU32(tile.data.y);

    tileBuffer.data.copy(finalBuffer.data, finalBuffer.mempos);

    finalBuffer.mempos += tileBuffer.data.byteLength;
  }

  finalBuffer.grow(4);
  finalBuffer.writeU32(0xffffffff);

  world.every((p) =>
    p.send(
      new TankPacket({
        type: TankTypes.SEND_TILE_UPDATE_DATA_MULTIPLE,
        data: () => finalBuffer.data,
      }),
    ),
  );
}

// const tileParse = async (
//   actionType: number,
//   base: Base,
//   world: World,
//   block: TileData
// ) => {
//   try {
//     let Class = TileMap[actionType];

//     if (!Class) Class = NormalTile;

//     const tile = new Class(base, world, block);
//     await tile.init();
//     const val = await tile.parse();
//     return val;
//   } catch (e) {
//     consola.warn(e);

//     const Class = NormalTile;

//     const tile = new Class(base, world, block);
//     await tile.init();
//     const val = await tile.parse();
//     return val;
//   }
// };

export { TileMap, tileFrom, tileUpdateMultiple /*, tileParse*/ };
