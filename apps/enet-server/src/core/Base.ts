import { Database } from "@growserver/db";
import { CommandManager } from "./CommandManager";
import { EventManager } from "./EventManager";
import { Server } from "./Server";
import { items } from "./ItemsDB";

export class Base {
  public servers: Server[];
  public database: Database;
  public manager = {
    commands: new CommandManager(),
    events:   new EventManager()
  };


  constructor() {
    this.database = new Database(process.env.DATABASE_URL!, true);
    this.servers = [
      new Server(this.database, "0.0.0.0", 17091),
      // new Server(this.database, "0.0.0.0", 17092), // Lets focus on single server for now
    ];
  }

  public async init() {
    await items.init();
    await this.database.setup();
    
    await this.manager.commands.init();
    await this.manager.events.init();

    for (const [i, s] of this.servers.entries()) {
      s.server.on("connect", (netID) => this.manager.events.data.get("connect")?.execute(i, s, netID));
      s.server.on("ready", () => this.manager.events.data.get("ready")?.execute(i, s));
      s.server.on("raw", (netID, channelID, data) => this.manager.events.data.get("raw")?.execute(i, s, netID, channelID, data));
      s.server.on("disconnect", (netID) => this.manager.events.data.get("disconnect")?.execute(i, s, netID));

      s.server.listen();
    }
  }
}
