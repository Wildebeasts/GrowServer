import { Command } from "../Command";
import { Base } from "../../core/Base";
import { Peer } from "../../core/Peer";
import { ROLE } from "@growserver/const";
import { Variant } from "growtopia.js";
import { parseUserTarget } from "@growserver/utils";
import { eq } from "drizzle-orm";
import { players, Players } from "@growserver/db";

export default class AddGrowtokens extends Command {
  constructor(
    public base: Base,
    public peer: Peer,
    public text: string,
    public args: string[],
  ) {
    super(base, peer, text, args);
    this.opt = {
      command: ["addgrowtokens"],
      description:
        "Add growtokens to a user. Use /username for exact name or #id for user ID.",
      cooldown: 5,
      ratelimit: 1,
      category: "`oBasic",
      usage: "/addgrowtokens <target> <amount>",
      example: ["/addgrowtokens /testuser1 100", "/addgrowtokens #172 100"],
      permission: [ROLE.DEVELOPER],
    };
  }

  public async execute(): Promise<void> {
    if (this.args.length < 2) {
      this.peer.send(
        Variant.from(
          "OnConsoleMessage",
          "`4Usage: /addgrowtokens <target> <amount>`o\n" +
            "Target can be:\n" +
            "  `/username` - Find user by exact username\n" +
            "  `#id` - Find user by user ID\n" +
            "Example: `/addgrowtokens /testuser1 100` or `/addgrowtokens #172 100`",
        ),
      );
      return;
    }

    const targetArg = this.args[0];
    const amount = parseInt(this.args[1]);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      this.peer.send(
        Variant.from(
          "OnConsoleMessage",
          "`4Invalid amount. Please provide a positive number.``",
        ),
      );
      return;
    }

    // Parse user target
    const parsedTarget = parseUserTarget(targetArg);
    if (!parsedTarget) {
      this.peer.send(
        Variant.from(
          "OnConsoleMessage",
          "`4Invalid target format. Use `/username` or `#id`.``",
        ),
      );
      return;
    }

    let targetPeer: Peer | undefined;
    let targetData: Players | undefined;

    // Find the target user
    if (parsedTarget.type === "name") {
      // Check if user is online in cache
      const targetPeerData = this.base.cache.peers.find(
        (p) =>
          p.name.toLowerCase() === (parsedTarget.value as string).toLowerCase(),
      );

      if (targetPeerData) {
        targetPeer = new Peer(this.base, targetPeerData.netID);
      } else {
        // If not online, check database
        targetData = await this.base.database.players.get(
          parsedTarget.value as string,
        );
        if (!targetData) {
          this.peer.send(
            Variant.from(
              "OnConsoleMessage",
              "`4User with name `o" + parsedTarget.value + "`4 not found.``",
            ),
          );
          return;
        }
      }
    } else if (parsedTarget.type === "id") {
      // Check if user is online in cache by ID
      const targetPeerData = this.base.cache.peers.find(
        (p) => p.userID === parsedTarget.value,
      );

      if (targetPeerData) {
        targetPeer = new Peer(this.base, targetPeerData.netID);
      } else {
        // If not online, check database by ID
        targetData = await this.base.database.players.getByUID(
          parsedTarget.value as number,
        );
        if (!targetData) {
          this.peer.send(
            Variant.from(
              "OnConsoleMessage",
              "`4User with ID `o" + parsedTarget.value + "`4 not found.``",
            ),
          );
          return;
        }
      }
    }

    // Add growtokens to the target user
    if (targetPeer) {
      // User is online
      targetPeer.addItemInven(1486, amount);
      targetPeer.inventory(); // Sends inventory update packet to the client
      
      const newTokens = targetPeer.data.inventory.items.find(i => i.id === 1486)?.amount || 0;

      // Update cache and db
      await targetPeer.saveToCache();
      await targetPeer.saveToDatabase();

      this.peer.send(
        Variant.from(
          "OnConsoleMessage",
          "`2Successfully added `o" +
            amount +
            "`2 growtokens to `o" +
            targetPeer.data.name +
            "`2.``\n" +
            "`oTotal Tokens: " +
            newTokens +
            "``",
        ),
      );

      targetPeer.send(
        Variant.from(
          "OnConsoleMessage",
          "`2You have received `o" +
            amount +
            "`2 growtokens from an administrator! Check your inventory!``",
        ),
      );
    } else if (targetData) {
      // User is offline - update database directly
      let inv = targetData.inventory ? JSON.parse(targetData.inventory as string) : { max: 32, items: [] };
      let tokenItem = inv.items.find((i: any) => i.id === 1486);
      
      if (tokenItem) {
        tokenItem.amount += amount;
      } else {
        inv.items.push({ id: 1486, amount });
      }

      // Update inventory in database
      await this.base.database.db
        .update(players)
        .set({ inventory: JSON.stringify(inv) })
        // @ts-ignore
        .where(eq(players.id, targetData.id));

      this.peer.send(
        Variant.from(
          "OnConsoleMessage",
          "`2Successfully added `o" +
            amount +
            "`2 growtokens to `o" +
            targetData.name +
            "`2 (offline).``\n" +
            "`oThey will see them in their inventory when they log in.``",
        ),
      );
    }
  }
}
