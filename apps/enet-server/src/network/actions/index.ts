import { type NonEmptyObject, type Class } from "type-fest";
import { RefreshItemData } from "./RefreshItemData";


export const ActionMap: Record<
  string,
  Class<{
    execute: (action: NonEmptyObject<Record<string, string>>) => Promise<void>;
  }>
> = {
  ["refresh_item_data"]: RefreshItemData,
};
