import { TextPacket, Variant } from "growtopia.js";
import { Base } from "../core/Base";
import { Peer } from "../core/Peer";
import {
  parseAction,
  getCurrentTimeInSeconds,
  RTTEX,
  formatToDisplayName,
} from "@growserver/utils";
import { PacketTypes } from "@growserver/const";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { type JsonObject } from "type-fest";
import { customAlphabet } from "nanoid";
import { readFileSync } from "fs";
import { join } from "path";
import logger from "@growserver/logger";

export class ITextPacket {
  public obj: Record<string, string | number>;

  constructor(
    public base: Base,
    public peer: Peer,
    public chunk: Buffer,
  ) {
    this.obj = parseAction(chunk);
  }

  public async execute() {
    if (this.obj.action) return;

    await this.checkVersion();

    // Log ALL fields for both login paths to find what differs
    logger.info(`[TEXT-ALL] ${JSON.stringify(this.obj)}`);

    if (this.obj.ltoken) await this.validateLtoken();

    if (this.obj.user && this.obj.token) {
      await this.validateRefreshToken();
    }
  }

  private async checkVersion() {
    if (
      this.obj.game_version &&
      this.obj.game_version !== this.base.cdn.version &&
      !this.base.config.server.bypassVersionCheck
    )
      return this.peer.send(
        TextPacket.from(
          PacketTypes.ACTION,
          "action|log",
          `msg|\`4UPDATE REQUIRED!\`\` : The \`$V${this.base.cdn.version}\`\` update is now available for your device.  Go get it!  You'll need to install it before you can play online.`,
        ),
        TextPacket.from(
          PacketTypes.ACTION,
          "action|set_url",
          `url|https://ubistatic-a.akamaihd.net/${this.base.cdn.uri}/GrowtopiaInstaller.exe`,
          "label|Download Latest Version",
        ),
      );
  }

  private async invalidInfoResponse() {
    this.peer.send(
      Variant.from(
        "OnConsoleMessage",
        "`4Failed`` logging in to that account. Please make sure you've provided the correct info.",
      ),
    );
    this.peer.send(
      TextPacket.from(
        PacketTypes.ACTION,
        "action|set_url",
        "url||http://127.0.0.1/recover",
        "label|`$Recover your Password``",
      ),
    );
    this.peer.disconnect();
  }

  private async sendSuperMain() {
    // Check if platformID is "2" (macOS) and calculate appropriate items.dat hash
    const isMacOS = this.obj.platformID === "2";
    let itemsHash: string;

    if (isMacOS) {
      // Load and hash macOS items.dat at runtime
      const datDir = join(process.cwd(), ".cache", "growtopia", "dat");
      const macosItemsDatName = this.base.cdn.itemsDatName.replace(
        ".dat",
        "-osx.dat",
      );
      const macosItemsDat = readFileSync(join(datDir, macosItemsDatName));
      itemsHash = `${RTTEX.hash(macosItemsDat)}`;
    } else {
      itemsHash = this.base.items.rawHash;
    }

    logger.info(
      `[SUPERMAIN] Sending hash=${itemsHash} cdnUrl=${this.base.config.web.cdnUrl} itemsDatName=${this.base.cdn.itemsDatName}`,
    );

    return this.peer.send(
      Variant.from(
        "OnSuperMainStartAcceptLogonHrdxs47254722215a",
        parseInt(itemsHash),
        this.base.config.web.cdnUrl, // https://github.com/StileDevs/growserver-cache
        "growtopia/",
        "cc.cz.madkite.freedom org.aqua.gg idv.aqua.bulldog com.cih.gamecih2 com.cih.gamecih com.cih.game_cih cn.maocai.gamekiller com.gmd.speedtime org.dax.attack com.x0.strai.frep com.x0.strai.free org.cheatengine.cegui org.sbtools.gamehack com.skgames.traffikrider org.sbtoods.gamehaca com.skype.ralder org.cheatengine.cegui.xx.multi1458919170111 com.prohiro.macro me.autotouch.autotouch com.cygery.repetitouch.free com.cygery.repetitouch.pro com.proziro.zacro com.slash.gamebuster",
        `proto=225|choosemusic=audio/mp3/about_theme.mp3|active_holiday=6|wing_week_day=0|ubi_week_day=0|server_tick=${getCurrentTimeInSeconds()}|clash_active=0|drop_lavacheck_faster=1|isPayingUser=1|usingStoreNavigation=1|enableInventoryTab=1|bigBackpack=1|`,
        0, // player_tribute.dat hash,
      ),
    );
  }

  private async validateLtoken() {
    const ltoken = this.obj.ltoken as string;

    try {
      const data = jwt.verify(
        ltoken,
        process.env.JWT_SECRET as string,
      ) as JsonObject;

      const growId = data.growId as string;
      const password = data.password as string;

      const player = await this.base.database.players.get(growId.toLowerCase());
      if (!player) throw new Error("Player not found");

      const isValid = await bcrypt.compare(password, player.password);
      if (!isValid) throw new Error("Password are invalid");

      const targetPeerId = this.base.cache.peers.find(
        (v) => v.userID === player.id,
      );
      if (targetPeerId) {
        const targetPeer = new Peer(this.base, targetPeerId.netID);
        this.peer.send(
          Variant.from(
            "OnConsoleMessage",
            "`4Already Logged In?`` It seems that this account already logged in by somebody else.",
          ),
        );

        targetPeer.leaveWorld();
        targetPeer.disconnect();
      }

      const conf = this.base.config.web;
      const ports = conf.ports as number[];
      const randPort = ports[Math.floor(Math.random() * ports.length)];
      const randomToken = Math.floor(Math.random() * (1000000 - 10000) + 10000);
      this.base.cache.pendingPasswords.set(player.id, password);
      logger.info(
        `[LTOKEN] Stored pendingPassword for playerID=${player.id} name="${player.name}" token=${randomToken}`,
      );

      this.peer.send(
        Variant.from("SetHasGrowID", 1, player.name, password),
        Variant.from("OnOverrideGDPRFromServer", 18, 1, 0, 1),
        Variant.from("SetHasGottenChatAccess", 1),
        Variant.from("OnSetAccountAge", 9999),
        Variant.from(
          "OnSendToServer",
          randPort,
          randomToken,
          player.id,
          `${conf.address}|0|${customAlphabet("0123456789ABCDEF", 32)()}`,
          1,
          player.name,
        ),
      );
    } catch (e) {
      logger.error(e);
      return await this.invalidInfoResponse();
    }
  }

  private async validateRefreshToken() {
    try {
      const userID = this.obj.user as string;
      const tokenStr = this.obj.token as string;

      // For quick login, the token is the JWT from checktoken response
      // Try to extract the plaintext password from it
      let plainPassword: string | undefined;
      try {
        const decoded = jwt.verify(
          tokenStr,
          process.env.JWT_SECRET as string,
        ) as JsonObject;
        if (decoded.password) {
          plainPassword = decoded.password as string;
          logger.info(
            `[GROWID] Extracted plaintext password from JWT token for quick login`,
          );
        }
      } catch {
        // Token is not a JWT (it's a random numeric token from OnSendToServer redirect)
        // Fall back to pendingPasswords cache set by validateLtoken
      }

      const player = await this.base.database.players.getByUID(
        parseInt(userID),
      );
      if (!player) throw new Error(`Player not found for userID=${userID}`);

      const targetPeerId = this.base.cache.peers.find(
        (v) => v.userID === player.id,
      );
      if (targetPeerId) {
        const targetPeer = new Peer(this.base, targetPeerId.netID);
        this.peer.send(
          Variant.from(
            "OnConsoleMessage",
            "`4Already Logged In?`` It seems that this account already logged in by somebody else.",
          ),
        );

        targetPeer.leaveWorld();
        targetPeer.disconnect();
      }

      // Send GDPR override BEFORE SuperMain — matches Gurotopia's tankIDName order
      this.peer.send(Variant.from("OnOverrideGDPRFromServer", 18, 1, 0, 1));

      await this.sendSuperMain();

      // Priority: 1) JWT-decoded plaintext, 2) pendingPasswords from validateLtoken redirect, 3) bcrypt hash fallback
      const pendingPw = this.base.cache.pendingPasswords.get(player.id);
      const resolvedPassword = plainPassword ?? pendingPw ?? player.password;
      const pwSource = plainPassword ? "jwt" : pendingPw ? "pending" : "hash";
      this.base.cache.pendingPasswords.delete(player.id);

      const playerAge = parseInt(this.obj.player_age as string) || 0;
      const effectiveAge = 9999;

      // OnOverrideGDPRFromServer was already sent before SuperMain (matches Gurotopia order)
      this.peer.send(
        Variant.from("SetHasGrowID", 1, player.name, resolvedPassword),
        Variant.from("SetHasGottenChatAccess", 1),
        Variant.from("OnSetAccountAge", effectiveAge),
      );
      logger.info(
        `[GROWID] SetHasGrowID(1, "${player.name}") source=${pwSource} isHash=${resolvedPassword.startsWith("$2")} playerAge=${playerAge} effectiveAge=${effectiveAge} for userID=${userID}`,
      );

      const defaultInventory = {
        max: 32,
        items: [
          {
            id: 18, // Fist
            amount: 1,
          },
          {
            id: 32, // Wrench
            amount: 1,
          },
        ],
      };

      const defaultClothing = {
        hair: 0,
        shirt: 0,
        pants: 0,
        feet: 0,
        face: 0,
        hand: 0,
        back: 0,
        mask: 0,
        necklace: 0,
        ances: 0,
      };

      this.peer.data.name = player.name;
      this.peer.data.role = player.role;
      this.peer.data.displayName = formatToDisplayName(
        player.display_name,
        player.role,
      );
      this.peer.data.rotatedLeft = false;
      this.peer.data.country = this.obj.country as string;
      this.peer.data.platformID = this.obj.platformID as string;
      this.peer.data.userID = player.id;
      this.peer.data.inventory = player.inventory?.length
        ? JSON.parse(player.inventory.toString())
        : defaultInventory;
      this.peer.data.clothing = player.clothing?.length
        ? JSON.parse(player.clothing.toString())
        : defaultClothing;
      this.peer.data.gems = player.gems ? player.gems : 0;
      this.peer.data.world = "EXIT";
      this.peer.data.level = player.level ? player.level : 0;
      this.peer.data.exp = player.exp ? player.exp : 0;
      this.peer.data.lastVisitedWorlds = player.last_visited_worlds
        ? JSON.parse(player.last_visited_worlds.toString())
        : [];
      this.peer.data.heartMonitors = new Map<string, Array<number>>(
        Object.entries(JSON.parse(player.heart_monitors.toString())),
      );

      this.peer.data.state = {
        mod: 0,
        canWalkInBlocks: false,
        modsEffect: 0,
        isGhost: false,
        lava: {
          damage: 0,
          resetStateAt: 0,
        },
      };

      // Load Gems
      this.peer.setGems(this.peer.data.gems);

      this.peer.saveToCache();
      this.peer.saveToDatabase();
    } catch (e) {
      logger.error(e);
      return await this.invalidInfoResponse();
    }
  }
}
