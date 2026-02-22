import { type NonEmptyObject } from "type-fest";
import { Base } from "../../core/Base";
import { Peer } from "../../core/Peer";
import { CommandMap, CommandsAliasMap } from "../../command/cmds/index";
import { Variant } from "growtopia.js";
import logger from "@growserver/logger";

export class Say {
  constructor(
    public base: Base,
    public peer: Peer,
  ) {}

  public async execute(
    action: NonEmptyObject<Record<string, string>>,
  ): Promise<void> {
    const text = (action.text ?? "").trim();
    if (!text || text.replace(/`.|`/g, "").length < 1) return;

    // Handle commands
    if (text.startsWith("/")) {
      const args = text.slice(1).split(" ");
      const commandName = args.shift()?.toLowerCase() || "";

      // Echo the command back to the sender
      this.peer.send(Variant.from("OnConsoleMessage", `\`6${text}`));

      let Class = CommandMap[commandName];
      let originalCmd = commandName;

      if (!Class && CommandsAliasMap[commandName]) {
        originalCmd = CommandsAliasMap[commandName];
        Class = CommandMap[originalCmd];
      }

      if (!Class) {
        this.peer.send(
          Variant.from(
            "OnConsoleMessage",
            "`4Unknown command. `oEnter /? for a list of valid commands.",
          ),
        );
        return;
      }

      const cmd = new Class(this.base, this.peer, text, args);

      // Check permission
      if (!cmd.opt.permission.some((perm) => perm === this.peer.data?.role)) {
        this.peer.send(
          Variant.from(
            "OnConsoleMessage",
            "You don't have permission to use this command.",
          ),
        );
        return;
      }

      // Cooldown logic
      const cooldownSeconds = cmd.opt.cooldown || 1;
      const maxUses = cmd.opt.ratelimit || 1;
      const cooldownKey = `${originalCmd}-netID-${this.peer.data?.netID}`;
      const cooldownInfo = this.base.cache.cooldown.get(cooldownKey);
      const now = Date.now();

      if (!cooldownInfo) {
        this.base.cache.cooldown.set(cooldownKey, { limit: 1, time: now });
        setTimeout(() => {
          this.base.cache.cooldown.delete(cooldownKey);
        }, cooldownSeconds * 1000);
      } else {
        if (cooldownInfo.limit >= maxUses) {
          const timeLeftSec = (
            Math.max(0, cooldownInfo.time + cooldownSeconds * 1000 - now) / 1000
          ).toFixed(1);
          this.peer.send(
            Variant.from(
              "OnConsoleMessage",
              `\`6${this.peer.data?.displayName}\`0 you're being ratelimited, please wait \`9${timeLeftSec}s\`0`,
            ),
          );
          return;
        }
        cooldownInfo.limit += 1;
      }

      try {
        await cmd.execute();
      } catch (e) {
        logger.warn(`Command error [${commandName}]: ${String(e)}`);
      }
      return;
    }

    // Regular chat message — broadcast to everyone in the world
    const world = this.peer.currentWorld();
    if (!world) return;

    const netID = this.peer.data?.netID ?? 0;
    const name = this.peer.data?.displayName ?? "?";

    await world.every((p) => {
      p.send(
        Variant.from("OnTalkBubble", netID, action.text, 0),
        Variant.from(
          "OnConsoleMessage",
          `CP:0_PL:0_OID:_CT:[W]_ <\`w${name}\`\`> ${action.text}`,
        ),
      );
    });
  }
}
