import type { Base } from "../../core/Base";
import type { Peer } from "../../core/Peer";
import type { World } from "../../core/World";
import type { TileData } from "@growserver/types";
import { ExtendBuffer, DialogBuilder } from "@growserver/utils";
import { Tile } from "../Tile";
import { BlockFlags, LockPermission, TileExtraTypes, TileFlags } from "@growserver/const";
import type { ItemDefinition } from "grow-items";
import { Variant } from "growtopia.js";
import { tileFrom } from ".";

export class MagplantTile extends Tile {
  public extraType = TileExtraTypes.MAGPLANT;
  constructor(
    public base: Base,
    public world: World,
    public data: TileData,
  ) {
    super(base, world, data);
  }
  public async onPlaceForeground(peer: Peer, itemMeta: ItemDefinition): Promise<boolean> {
    if (!await super.onPlaceForeground(peer, itemMeta)) return false;

    this.data.itemSucker = {
      itemAmount:       0,
      itemID: 0,
      collection: true,
      building: false,
      //flags: 0x2,
      itemLimit: 5000
    }
    
    if (!this.world.data.magplantTileIndices) {
      this.world.data.magplantTileIndices = [];
    }
    const idx = (this.data.x ?? 0) + (this.data.y ?? 0) * this.world.data.width;
    if (!this.world.data.magplantTileIndices.includes(idx)) {
      this.world.data.magplantTileIndices.push(idx);
    }
    return true;
  }

  public async onWrench(peer: Peer): Promise<boolean> {
      const itemMeta = this.base.items.metadata.items.get(this.data.fg.toString())!;
      if (await this.world.hasTilePermission(peer.data.userID, this.data, LockPermission.BUILD && (itemMeta.flags! & BlockFlags.WRENCHABLE))) {
        if (!this.data.itemSucker?.itemID){
            const dialog = new DialogBuilder()
            .defaultColor()
            .addLabelWithIcon(
              `\`w${itemMeta.name}\`\``,
              itemMeta.id as number,
              "big"
            )
            
            .addSpacer("small")
            .addLabel("`6The machine is empty")
            .addItemPicker("choose_item", "Choose an item", `Choose an item to put in the ${itemMeta.name}`)
            .embed("tilex", this.data.x!)
            .embed("tiley", this.data.y!) // i dont think this is included in the official one, but not very sure on it too.
            .endDialog("magplant_edit", "Cancel", "OK")
            .str();
    
          peer.send(Variant.from("OnDialogRequest", dialog));
        }else{
          const itemSucker = this.data.itemSucker
          const item = this.base.items.metadata.items.get(itemSucker.itemID.toString());
          const dialog = new DialogBuilder()
            .defaultColor()
            .addLabelWithIcon(
              `\`w${itemMeta.name}\`\``,
              itemMeta.id as number,
              "big"
            )
            
            .addSpacer("small")
            .addLabel(`\`2${item?.name ?? "Unknown Item"}`)
            .addLabel(itemSucker.itemAmount == 0 ? "`6The machine is currently empty!" : `The machine contains ${itemSucker.itemAmount} \`2${item?.name ?? "Unknown Item"}`) 
            if(itemSucker.itemAmount < 5000) dialog.addButton("add_item", "Add items to the machine");
            if(itemSucker.itemAmount >= 1) dialog.addButton("retrieve_item", "Retrieve Items");
            if(itemSucker.itemAmount == 0) dialog.addItemPicker("change_item", "Change Item", "Change an item")
            dialog.addLabel(`Building mode: ${!itemSucker.building ? "`5DISABLED" : "`#ACTIVE"}`)
            itemSucker.building ? dialog.addLabel(`Use the ${itemMeta.name} Remote to build \`2${item?.name ?? "Unknown Item"} \`\`directly from the ${itemMeta.name}'s storage.`) : dialog.addLabel("Punch to activate building mode.");
            dialog.addButton("get_remote", "Get Remote")
            .addCheckbox("enable_collection", "Enable Collection.", itemSucker.collection == true ? "selected" : "not_selected")
            .embed("tilex", this.data.x!)
            .embed("tiley", this.data.y!) // i dont think this is included in the official one, but not very sure on it too.
            .endDialog("magplant_edit", "Cancel", "OK")
            .str();
    
          peer.send(Variant.from("OnDialogRequest", dialog.str()));
        }
        
        return true;
      }
      return false;
    }

  public async onPunch(peer: Peer): Promise<boolean> {
    const itemMeta = this.base.items.metadata.items.get(this.data.fg.toString())!;
    if (await this.world.hasTilePermission(peer.data.userID, this.data, LockPermission.BREAK)) {
      // default punch behaviour, but with an exception
      if (!this.data.itemSucker?.itemID){
        peer.sendTextBubble(`Cannot activate the ${itemMeta.name}, you need to set the item first.`, true)
      }else if(this.data.itemSucker.building == false){
        this.data.itemSucker.building = true;
      }else {
        this.data.itemSucker.building = false;
      }
    }

    const magplantTile = tileFrom(this.base, this.world, this.data) as MagplantTile;
    this.world.every((p) => magplantTile.tileUpdate(p));
    return super.onPunch(peer);
  }

  public async onDestroy(peer: Peer): Promise<void> {
    await super.onDestroy(peer);
    this.world.every((p) => this.tileUpdate(p));
    this.data.itemSucker = undefined;

    if (this.world.data.magplantTileIndices) {
      const idx = (this.data.x ?? 0) + (this.data.y ?? 0) * this.world.data.width;
      this.world.data.magplantTileIndices = this.world.data.magplantTileIndices.filter((i) => i !== idx);
    }
  }

  public async serialize(dataBuffer: ExtendBuffer): Promise<void> {
    await super.serialize(dataBuffer);
    dataBuffer.grow(15);
    dataBuffer.writeU8(this.extraType);
    dataBuffer.writeU32(this.data.itemSucker?.itemID || 0);
    dataBuffer.writeI32(this.data.itemSucker?.itemAmount ?? 0);
    dataBuffer.writeU8(this.data.itemSucker?.collection ? 1 : 0);
    dataBuffer.writeU8(this.data.itemSucker?.building ? 1 : 0);
    //dataBuffer.writeU16(this.data.itemSucker?.flags || 0x0)
    dataBuffer.writeI32(this.data.itemSucker?.itemLimit || 5000);
    return;
  }
}
