import type { CommandOptions } from "@growserver/types";

export abstract class ICommand {
  public opt: CommandOptions = {
    name:        "",
    description: "",
    cooldown:    1,
    ratelimit:   1,
    category:    "",
    usage:       "",
    example:     [],
    permission:  [],
  };

  constructor() {}

  abstract execute(text: string, args: string[]): Promise<void>;
}
