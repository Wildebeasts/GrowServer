import { type NonEmptyObject } from "type-fest";
import type { Base } from "../../core/Base";
import type { Peer } from "../../core/Peer";
import type { World } from "../../core/World";
import type { TileData } from "@growserver/types";
import { tileFrom } from "../../world/tiles";
import { MagplantTile } from "../../world/tiles/MagplantTile";

export class MagplantEdit {
  private world: World;
  private pos: number;
  private block: TileData;

  constructor(
    public base: Base,
    public peer: Peer,
    public action: NonEmptyObject<{
      dialog_name: string;
      choose_item: string;
      change_item: string;
      enable_collection: string;
      buttonClicked: string;
      add_item: string;
      tilex: string;
      tiley: string;
    }>
  ) {
    this.world = this.peer.currentWorld()!;
    this.pos =
      parseInt(this.action.tilex) +
      parseInt(this.action.tiley) * (this.world?.data.width as number);
    this.block = this.world?.data.blocks[this.pos] as TileData;
  }

  public async execute(): Promise<void> {
    console.log("Magplant action:", this.action);
    const mag = this.block.itemSucker;

    if (this.action.choose_item) {
      this.block.itemSucker = {
        itemAmount: 0,
        itemID: parseInt(this.action.choose_item),
        collection: true,
        building: false,
        itemLimit: 5000
      };
    } else if (this.action.change_item && mag) {
      mag.itemID = parseInt(this.action.change_item);
    }
    
    // Refresh mag instance in case it was created above
    const currentMag = this.block.itemSucker;
    const peerItem = this.peer.data.inventory.items.find((v) => v.id === currentMag?.itemID);
    const ItemName = this.base.items.metadata.items.get(currentMag?.itemID?.toString() ?? "");

    if (this.action.buttonClicked === "add_item" && currentMag) {
      if (!peerItem || peerItem.amount <= 0) return;

      const space = 5000 - currentMag.itemAmount;
      if (space <= 0) {
        this.peer.sendTextBubble(`MAGPLANT 5000 is full!`, true);
        return;
      }
      
      const amountToAdd = Math.min(peerItem.amount, space);
      if (amountToAdd <= 0) return;

      currentMag.itemAmount += amountToAdd;
      
      // Update inventory (automatically handles modifyInventory visually)
      this.peer.removeItemInven(peerItem.id, amountToAdd);

      this.peer.sendTextBubble(
        `Added ${amountToAdd} of ${ItemName?.name ?? "Unknown Item"} into MAGPLANT 5000.`,
        true
      );
    } else if (this.action.buttonClicked === "retrieve_item" && currentMag) {
      if (currentMag.itemAmount <= 0) return;
      
      const maxStack = 200;
      const currentAmount = peerItem?.amount ?? 0;
      const magAmount = currentMag.itemAmount;
      const spaceLeft = maxStack - currentAmount;

      if (spaceLeft <= 0) {
        this.peer.sendTextBubble(`Your backpack is full!`, true);
        return;
      }

      const amountToTake = Math.min(magAmount, spaceLeft);
      if (amountToTake <= 0) return;

      currentMag.itemAmount -= amountToTake;
      
      // Add to inventory (automatically handles modifyInventory visually)
      this.peer.addItemInven(currentMag.itemID, amountToTake);

      const itemName = ItemName?.name ?? "Unknown Item";

      this.peer.sendTextBubble(
        `Retrieved ${amountToTake} of ${itemName} from MAGPLANT 5000.`,
        true
      );

      if (currentMag.itemAmount <= 0) {
        currentMag.itemAmount = 0;
      }
    } else if (this.action.buttonClicked === "get_remote" && currentMag) {
      const checkpeeritem = this.peer.data.inventory.items.find((v) => v.id === 5640);
      if (checkpeeritem?.amount && checkpeeritem.amount >= 1) return;

      this.peer.addItemInven(5640, 1);
      console.log("added");
    } 
    
    if (this.action.enable_collection === "1" && currentMag) {
      currentMag.collection = true;
    } else if (this.action.enable_collection === "0" && currentMag) {
      currentMag.collection = false;
    }

      
    
    
    const magplantTile = tileFrom(this.base, this.world, this.block) as MagplantTile;
    this.world.every((p) => magplantTile.tileUpdate(p));
  }
}
