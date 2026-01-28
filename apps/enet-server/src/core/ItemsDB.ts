import { ITEMS_DAT_FETCH_URL, PlatformID } from "@growserver/const";
import logger from "@growserver/logger";
import type { CDNContent, ItemsData, ItemsInfo } from "@growserver/types";
import { Collection, downloadItemsDat, fetchJSON, RTTEX } from "@growserver/utils";
import { readFile } from "fs/promises";
import { join } from "path";
import { ItemsDat, type ItemsDatMeta } from "grow-items";

class ItemsDB {
  public cdn = { version: "", uri: "0000/0000", itemsDatName: "" };
  public data: {
    wiki: ItemsInfo[];
    windows: ItemsData;
    darwin: ItemsData;
  } = {
    wiki:    [],
    windows: {
      content:  Buffer.alloc(0),
      hash:     0,
      metadata: {} as ItemsDatMeta,
    },
    darwin: {
      content:  Buffer.alloc(0),
      hash:     0,
      metadata: {} as ItemsDatMeta,
    }
  };

  private path = join(__dirname, "..", "..", ".cache", "growtopia", "dat");
  private initialized = false;

  constructor() {}

  public async init() {
    if (this.initialized) return;

    this.cdn = await this.getLatestCDN();
    await downloadItemsDat(this.cdn.itemsDatName);
    await this.parse();
    await this.parse(PlatformID.OSX);

    // TODO: wiki down here


    this.initialized = true;
  }


  private async parse(platform: PlatformID = PlatformID.GT_WINDOWS) {
    if (platform === PlatformID.OSX) {
      // TODO: lets focus on windows for now
      const content = await this.getItemsDat();
      const itemsDat = new ItemsDat(Array.from(content));

      await itemsDat.decode();

      this.data.darwin = {
        content,
        hash:     RTTEX.hash(content),
        metadata: itemsDat.meta,
      };

      logger.info(`[ItemsDB] MacOS items data hash: ${this.data.darwin.hash}`);
      logger.info("[ItemsDB] Successfully parsing macos items data");
    } else {
      const content = await this.getItemsDat();
      const itemsDat = new ItemsDat(Array.from(content));

      await itemsDat.decode();

      this.data.windows = {
        content,
        hash:     RTTEX.hash(content),
        metadata: itemsDat.meta,
      };

      logger.info(`[ItemsDB] Windows items data hash: ${this.data.windows.hash}`);
      logger.info("[ItemsDB] Successfully parsing windows items data");

    }
  }

  private async getItemsDat() {
    return await readFile(join(this.path, this.cdn.itemsDatName)) as Buffer;
  }

  private async getLatestCDN() {
    try {
      const cdnData = (await fetchJSON(
        "https://mari-project.jad.li/api/v1/growtopia/cache/latest",
      )) as CDNContent;
      const itemsDat = (await fetchJSON(ITEMS_DAT_FETCH_URL)) as {
        content: string;
      };

      const data: CDNContent = {
        version:      cdnData.version,
        uri:          cdnData.uri,
        itemsDatName: itemsDat.content,
      };

      return data;
    } catch (e) {
      logger.error(`[ItemsDB] Failed to get latest CDN: ${e}`);
      return { version: "", uri: "", itemsDatName: "" };
    }
  }
}

const items = new ItemsDB();

export { ItemsDB, items };