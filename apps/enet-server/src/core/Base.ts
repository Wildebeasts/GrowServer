import logger from "@growserver/logger";
import { Server } from "./Server";
import { Database } from "@growserver/db";

export class Base {
  public servers: Server[];
  public database: Database;

  constructor() {
    this.database = new Database();
    this.servers = [
      new Server(this.database, "0.0.0.0", 17091),
      new Server(this.database, "0.0.0.0", 17092),
    ];
  }

  public init() {

    this.servers.forEach((s) => {
      s.server.listen();
      logger.info(`ENet Server with port ${s.port} running`);
    });
  }
}