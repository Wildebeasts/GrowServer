import { config } from "@growserver/config";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin as adminPlugin, captcha, emailOTP, username } from "better-auth/plugins";
import { type Db, MongoClient } from "mongodb";
import mongoose from "mongoose";
import { PlayerHandler } from "./handlers/PlayerHandler";
import { WorldHandler } from "./handlers/WorldHandler";
import {
  AccountModel,
  ApiKeyModel,
  PlayerModel,
  SessionModel,
  UserModel,
  VerificationModel,
  WorldModel,
} from "./shared/schemas/schema";
import { logger } from "@growserver/logger";


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
    Verification: VerificationModel,
    ApiKey:       ApiKeyModel,
  };

  public player: PlayerHandler;
  public world: WorldHandler;
  // public redis: RedisHandler;
  private isConnected: boolean = false;

  constructor(private dbUrl: string, private enableLogging = false) {
    this.connection = new MongoClient(dbUrl);
    this.db = this.connection.db();
    this.auth = betterAuth(
      {
        database: mongodbAdapter(this.db, {
          client:      this.connection,
          transaction: false,
        }),
        emailAndPassword: {
          enabled:    true,
          autoSignIn: true,
        },

        plugins: [
          username(),
          adminPlugin(),
          emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
              // Implement the sendVerificationOTP method to send the OTP to the user's email address
              console.log(`Sending OTP to ${email}: ${otp} (type: ${type})`);
            }
          }),
          captcha({
            provider:  "cloudflare-turnstile", // or google-recaptcha, hcaptcha
            secretKey: process.env.CLOUDFLARE_SECRET_KEY || "1x0000000000000000000000000000000AA"
          }),

        ],

        socialProviders: {
          discord: {
            clientId:     process.env.DISCORD_CLIENT_ID as string,
            clientSecret: process.env.DISCORD_CLIENT_SECRET  as string,
          },
        },

        session: {
          expiresIn: 60 * 60 * 24 * 7, // Expires in 7 days
          updateAge: 60 * 60 * 24 // 1 day (every 1 day the session expiration is updated)
          // cookieCache: {
          //   enabled: true,
          //   maxAge: 5 * 60, // cache duration in seconds
          // },
        },

        experimental: {
          joins: true
        },
        trustedOrigins: [`https://${config.web.loginUrl}`],
        // user: {
        //   additionalFields: {
        //     playerId: {
        //       type: "number",
        //       required: false,
        //       input: false
        //     },
        //     role: {
        //       type: "string",
        //       required: false,
        //       input: false,
        //       defaultValue: "2"
        //     }
        //   }
        // }
      }

    );

    this.player = new PlayerHandler(this.connection, this.db);
    this.world = new WorldHandler(this.connection, this.db);
    // this.redis = new RedisHandler();
  }

  public async connect() {
    if (this.isConnected) return;

    
    try {
      if (this.enableLogging)
        logger.info("[DB] Connecting to mongodb");
      await this.connection.connect();
      await mongoose.connect(this.dbUrl);
      this.isConnected = true;
    } catch (e) {
      if (this.enableLogging)
        logger.error("[DB] Failed to connect mongodb: " + e);
      this.isConnected = false;
    }
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
