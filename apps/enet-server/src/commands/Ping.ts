import { ICommand } from "@/abstracts/ICommand";
import { Debug, ThrowError } from "@/decorators";
import type { CommandOptions } from "@growserver/types";

export default class Ping extends ICommand {
  public opt: CommandOptions = {
    name:        "ping",
    description: "Ping pong",
    cooldown:    5,
    ratelimit:   1,
    category:    "Basic",
    usage:       "/ping",
    example:     ["/ping"],
    permission:  [],
  };

  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to ping execute command")
  public async execute(text: string, args: string[]): Promise<void> {
    console.log("works");
  }
}
