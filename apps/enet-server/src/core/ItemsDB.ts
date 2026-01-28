import { ITEMS_DAT_FETCH_URL, PlatformID } from "@growserver/const";
import logger from "@growserver/logger";
import type { CDNContent, ItemsData, ItemsInfo } from "@growserver/types";
import { Collection, downloadItemsDat, fetchJSON, RTTEX } from "@growserver/utils";
import { readFile } from "fs/promises";
import { join } from "path";
import { ItemsDat, type ItemsDatMeta } from "grow-items";

// Use global to persist data across hot reloads
declare global {
   
  var __itemsDB__: {
    cdn: CDNContent;
    data: Collection<string, ItemsData>;
    wiki: ItemsInfo[];
    initialized: boolean;
  } | undefined;
}

class ItemsDB {
  public cdn = { version: "", uri: "0000/0000", itemsDatName: "" };
  public data = new Collection<string, ItemsData>();
  public wiki: ItemsInfo[] = [];

  private path = join(__dirname, "..", "..", ".cache", "growtopia", "dat");
  private initialized = false;

  constructor() {
    // Restore data from global if it exists
    if (global.__itemsDB__) {
      this.cdn = global.__itemsDB__.cdn;
      this.data = global.__itemsDB__.data;
      this.wiki = global.__itemsDB__.wiki;
      this.initialized = global.__itemsDB__.initialized;
      logger.info("[ItemsDB] Restored from global cache");
    }
  }

  public async init() {
    if (this.initialized) {
      logger.info("[ItemsDB] Already initialized, skipping...");
      return;
    }

    logger.info("[ItemsDB] Starting initialization...");
    this.cdn = await this.getLatestCDN();
    await downloadItemsDat(this.cdn.itemsDatName);
    await this.parse();
    await this.parse(PlatformID.OSX);

    // TODO: wiki down here

    this.initialized = true;
    
    // Store in global to persist across hot reloads
    global.__itemsDB__ = {
      cdn:         this.cdn,
      data:        this.data,
      wiki:        this.wiki,
      initialized: this.initialized,
    };
    
    logger.info("[ItemsDB] Initialization complete!");
  }


  private async parse(platform: PlatformID = PlatformID.GT_WINDOWS) {
    if (platform === PlatformID.OSX) {
      const content = await this.getItemsDat();
      const itemsDat = new ItemsDat(Array.from(content));

      await itemsDat.decode();

      const darwinData: ItemsData = {
        content,
        hash:     RTTEX.hash(content),
        metadata: itemsDat.meta,
      };

      this.data.set("darwin", darwinData);

      // Update global cache
      if (global.__itemsDB__) {
        global.__itemsDB__.data = this.data;
      }

      logger.info(`[ItemsDB] MacOS items data hash: ${darwinData.hash}`);
      logger.info("[ItemsDB] Successfully parsing macos items data");
    } else {
      const content = await this.getItemsDat();
      const itemsDat = new ItemsDat(Array.from(content));

      await itemsDat.decode();

      const windowsData: ItemsData = {
        content,
        hash:     RTTEX.hash(content),
        metadata: itemsDat.meta,
      };

      this.data.set("windows", windowsData);

      // Update global cache
      if (global.__itemsDB__) {
        global.__itemsDB__.data = this.data;
      }

      logger.info(`[ItemsDB] Windows items data hash: ${windowsData.hash}`);
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