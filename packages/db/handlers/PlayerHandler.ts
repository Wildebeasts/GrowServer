import mongoose from "mongoose";
import { PlayerModel, UserModel, CounterModel, PlayerDocument } from "../shared/schemas/schema";
import { type Db, type MongoClient } from "mongodb";

export class PlayerHandler {
  constructor(public connection: MongoClient, public db: Db) {}

  /**
   * Get the next auto-incrementing UID for players
   */
  private async getNextUID(): Promise<number> {
    const counter = await CounterModel.findByIdAndUpdate(
      "playerId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return counter.seq;
  }

  /**
   * Create a player for an existing user
   */
  public async createPlayerFromUser(userId: string, options?: {
    displayName?: string;
    inventoryMax?: number;
  }) {
    const { displayName, inventoryMax = 16 } = options || {};

    // Get the user
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error(`User with ID "${userId}" not found`);
    }

    // Check if player already exists
    const existingPlayer = await PlayerModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (existingPlayer) {
      throw new Error(`Player for user ID "${userId}" already exists`);
    }

    // Get next UID
    const uid = await this.getNextUID();

    // Create player
    const player = await PlayerModel.create({
      name:        user.username || user.name.toLowerCase().replace(/\s+/g, ""),
      displayName: displayName || user.name,
      role:        user.role || "user",
      userId:      new mongoose.Types.ObjectId(userId),
      uid:         uid,
      clothing:    {
        shirt:    0,
        pants:    0,
        feet:     0,
        face:     0,
        hand:     0,
        back:     0,
        hair:     0,
        mask:     0,
        necklace: 0,
        ances:    0,
      },
      inventory: {
        max:   inventoryMax,
        items: [],
      },
    }) as PlayerDocument;

    // Update user with playerId
    await UserModel.findByIdAndUpdate(userId, { playerId: player._id });

    return player;
  }

  /**
   * Get or create a player for a user
   * If the player doesn't exist, it will be created automatically
   */
  public async getOrCreatePlayer(userId: string, options?: {
    name?: string;
    displayName?: string;
    inventoryMax?: number;
  }) {
    // Check if player already exists
    const player = await PlayerModel.findOne({ userId: new mongoose.Types.ObjectId(userId) }) as PlayerDocument;
    
    if (player) {
      return player;
    }

    // Create player if it doesn't exist
    return await this.createPlayerFromUser(userId, options);
  }

  /**
   * Get a player by user ID
   */
  public async getByUserId(userId: string) {
    const player = await PlayerModel.findOne({ userId: new mongoose.Types.ObjectId(userId) }).populate("userId");
    return player;
  }

  /**
   * Get a player by username
   */
  public async get(username: string) {
    const player = await PlayerModel.findOne({ name: username.toLowerCase() }).populate("userId");
    return player;
  }

  /**
   * Get a player by ID
   */
  public async getById(playerId: string) {
    const player = await PlayerModel.findById(playerId).populate("userId");
    return player;
  }

  /**
   * Check if a player exists by user ID
   */
  public async existsByUserId(userId: string) {
    const player = await PlayerModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    return !!player;
  }

  /**
   * Check if a player exists
   */
  public async exists(username: string) {
    const player = await PlayerModel.findOne({ name: username.toLowerCase() });
    return !!player;
  }

  /**
   * Update player data
   */
  public async update(username: string, data: {
    displayName?: string;
    role?: string;
    clothing?: {
      shirt?: number;
      pants?: number;
      feet?: number;
      face?: number;
      hand?: number;
      back?: number;
      hair?: number;
      mask?: number;
      necklace?: number;
      ances?: number;
    };
    inventory?: {
      max?: number;
      items?: Array<{ id: number; amount: number }>;
    };
  }) {
    const updateData: Record<string, unknown> = {};

    if (data.displayName) updateData.displayName = data.displayName;
    if (data.role) updateData.role = data.role;

    if (data.clothing) {
      updateData.clothing = data.clothing;
    }

    if (data.inventory) {
      updateData.inventory = data.inventory;
    }

    const player = await PlayerModel.findOneAndUpdate(
      { name: username.toLowerCase() },
      updateData,
      { new: true }
    );

    if (!player) {
      throw new Error(`Player with username "${username}" not found`);
    }

    return player;
  }

  /**
   * Get all players
   */
  public async getAll(limit?: number, skip?: number) {
    let query = PlayerModel.find().populate("userId");

    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);

    return await query.exec();
  }

  /**
   * Count total players
   */
  public async count() {
    return await PlayerModel.countDocuments();
  }

  /**
   * Add item to player inventory
   */
  public async addItem(username: string, itemId: number, amount: number) {
    const player = await PlayerModel.findOne({ name: username.toLowerCase() });
    if (!player) {
      throw new Error(`Player with username "${username}" not found`);
    }

    if (!player.inventory || !player.inventory.items) {
      throw new Error(`Player inventory not initialized`);
    }

    const existingItem = player.inventory.items.find((item) => item.id === itemId);
    if (existingItem) {
      existingItem.amount += amount;
    } else {
      player.inventory.items.push({ id: itemId, amount });
    }

    await player.save();
    return player;
  }

  /**
   * Remove item from player inventory
   */
  public async removeItem(username: string, itemId: number, amount: number) {
    const player = await PlayerModel.findOne({ name: username.toLowerCase() });
    if (!player) {
      throw new Error(`Player with username "${username}" not found`);
    }

    if (!player.inventory || !player.inventory.items) {
      throw new Error(`Player inventory not initialized`);
    }

    const existingItem = player.inventory.items.find((item) => item.id === itemId);
    if (!existingItem) {
      throw new Error(`Item with id ${itemId} not found in inventory`);
    }

    existingItem.amount -= amount;
    if (existingItem.amount <= 0) {
      const itemIndex = player.inventory.items.findIndex((item) => item.id === itemId);
      if (itemIndex !== -1) {
        player.inventory.items.splice(itemIndex, 1);
      }
    }

    await player.save();
    return player;
  }

  /**
   * Update player clothing
   */
  public async updateClothing(username: string, clothing: {
    shirt?: number;
    pants?: number;
    feet?: number;
    face?: number;
    hand?: number;
    back?: number;
    hair?: number;
    mask?: number;
    necklace?: number;
    ances?: number;
  }) {
    const player = await PlayerModel.findOneAndUpdate(
      { name: username.toLowerCase() },
      { $set: { clothing } },
      { new: true }
    );

    if (!player) {
      throw new Error(`Player with username "${username}" not found`);
    }

    return player;
  }
}
