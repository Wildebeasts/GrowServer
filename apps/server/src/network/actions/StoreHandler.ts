import { type NonEmptyObject } from "type-fest";
import { Base } from "../../core/Base";
import { Peer } from "../../core/Peer";
import { StoreBuy } from "./StoreBuy";
import { Variant } from "growtopia.js";

export class StoreHandler {
  constructor(
    public base: Base,
    public peer: Peer,
  ) {}

  public async execute(
    _action: NonEmptyObject<Record<string, string>>,
  ): Promise<void> {
    const storeBuy = new StoreBuy(this.base, this.peer);
    const dialog = storeBuy.createMainDialog();

    const tokenCount =
      this.peer.data.inventory.items.find((i) => i.id === 1486)?.amount ?? 0;

    this.peer.send(
      Variant.from("OnSetVouchers", tokenCount),
      Variant.from("OnStoreRequest", dialog),
    );
  }
}
