import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { setupSeeds } from "./scripts/seeds";
import { authConfig } from "./auth";
import { type Db, MongoClient } from "mongodb";
import mongoose from "mongoose";
import { 
  PlayerModel, 
  WorldModel, 
  UserModel, 
  SessionModel, 
  AccountModel, 
  VerificationModel 
} from "./shared/schemas/schema";
import { PlayerHandler } from "./handlers/PlayerHandler";
import { WorldHandler } from "./handlers/WorldHandler";
import { RedisHandler } from "./handlers/RedisHandler";

export class Database {
  public connection: MongoClient;
  public db: Db;
  public auth;
  public models = {
    Player:       PlayerModel,
    World:        WorldModel,
    User:         UserModel,
    Session:      SessionModel,
    Account:      AccountModel,
    Verification: VerificationModel
  };

  public player: PlayerHandler;
  public world: WorldHandler;
  // public redis: RedisHandler;
  private dbUrl: string;
  private isConnected: boolean = false;

  constructor(dbUrl: string) {
    this.dbUrl = dbUrl;
    this.connection = new MongoClient(dbUrl);
    this.db = this.connection.db();
    this.auth = betterAuth(Object.assign({
      database: mongodbAdapter(this.db, {
        client:      this.connection,
        transaction: false
      }),
    }, authConfig));

    this.player = new PlayerHandler(this.connection, this.db);
    this.world = new WorldHandler(this.connection, this.db);
    // this.redis = new RedisHandler();
  }

  public async connect() {
    if (this.isConnected) return;
    
    await this.connection.connect();
    await mongoose.connect(this.dbUrl);
    this.isConnected = true;
  }

  public async setup() {
    await this.connect();
    // await this.redis.connect();
    // await setupSeeds();
  }

  public async close() {
    // await this.redis.disconnect();
    if (this.isConnected) {
      await mongoose.disconnect();
      await this.connection.close();
      this.isConnected = false;
    }
  }
}
