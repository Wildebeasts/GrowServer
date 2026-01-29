import dayjs from "dayjs";
import { ServerState } from "@growserver/const";
import { Collection, ExtendBuffer } from "@growserver/utils";
import { Client } from "growtopia.js";
import { CooldownOptions, PeerData, WorldData } from "@growserver/types";
import { Debug, ThrowError } from "@/decorators";
import { Database } from "@growserver/db";
import logger from "@growserver/logger";
import { Peer } from "./Peer";

interface CacheEntry<T> {
  data: T;
  lastAccessed: number;
  createdAt: number;
}


export class Server {
  public server: Client;
  public stats: ServerStats;
  public data: ServerData;

  constructor(public database: Database, public ip: string, public port: number, public usingNewServerPacket = true) {
    this.server = new Client({
      enet: {
        ip:                 this.ip,
        port:               this.port,
        useNewServerPacket: this.usingNewServerPacket,
      },
    });
    this.data = new ServerData(this.database);
    this.stats = new ServerStats();
  }

  @Debug()
  @ThrowError("Failed to shutdown server")
  public shutdown() {
    this.stats.setState(ServerState.STOPPING);

    this.server.host.flush();
    this.stats.updateShutdownNow();

    this.stats.setState(ServerState.STOPPED);
  }
}


export class ServerStats {
  public uptime: number;
  public state: ServerState;
  public lastShutdown?: number;

  constructor() {
    this.uptime = this.getCurrentUnix();
    this.state = ServerState.STOPPED;
  }

  public setState(s: ServerState) {
    this.state = s;
  }

  @Debug()
  public updateShutdownNow() {
    this.lastShutdown = this.getCurrentUnix();
  }

  private getCurrentUnix() {
    return dayjs(new Date()).unix();
  }
}

export class ServerData { 
  public peers: Collection<number, CacheEntry<PeerData>>;
  public worlds: Collection<string, CacheEntry<WorldData>>;
  public cooldown: Collection<string, CooldownOptions>;

  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private readonly MAX_CACHE_SIZE = 1000;

  // We put this database on constructor since we want only 1 connection established
  constructor(public database: Database) {
    this.peers = new Collection();
    this.worlds = new Collection();
    this.cooldown = new Collection();
  }

  /**
   * Get a peer from cache by netID
   */
  @Debug()
  public getPeer(netID: number): PeerData | undefined {
    const entry = this.peers.get(netID);
    
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.peers.delete(netID);
      return undefined;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  /**
   * Get a peer instance by netID & server instance
   */
  @Debug()
  public getPeerInstance(server: Server, netID: number): Peer | undefined {
    const data = this.getPeer(netID);

    if (data)
      return new Peer(server, netID);
    else return undefined;
  }

  /**
   * Get a peer from cache, or load from database if not found
   */
  @Debug()
  @ThrowError("Failed to get or load peer")
  public async getOrLoadPeer(name: string): Promise<PeerData | undefined> {
    // First, try to find in cache by iterating through cached peers
    for (const [netID, entry] of this.peers) {
      if (entry.data.name === name && !this.isExpired(entry)) {
        entry.lastAccessed = Date.now();
        logger.debug(`Peer ${name} found in cache (netID: ${netID})`);
        return entry.data;
      }
    }

    // Not in cache, load from database
    logger.debug(`Peer ${name} not in cache, loading from database`);
    const peerData = await this.database.player.get(name);

    if (peerData && peerData.netID !== undefined) {
      this.setPeer(peerData.netID, peerData);
      logger.debug(`Peer ${name} loaded from database and cached`);
    }

    return peerData;
  }

  /**
   * Set a peer in cache
   */
  @Debug()
  public setPeer(netID: number, data: PeerData): void {
    // Enforce max size by evicting least recently used
    if (this.peers.size >= this.MAX_CACHE_SIZE && !this.peers.has(netID)) {
      this.evictLRUPeer();
    }

    const entry: CacheEntry<PeerData> = {
      data,
      lastAccessed: Date.now(),
      createdAt:    Date.now(),
    };

    this.peers.set(netID, entry);
  }

  /**
   * Modify specific properties of a cached peer
   */
  @Debug()
  public modifyPeer(netID: number, modifications: Partial<PeerData>): boolean {
    const entry = this.peers.get(netID);
    
    if (!entry) {
      logger.warn(`Cannot modify peer ${netID}: not found in cache`);
      return false;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.peers.delete(netID);
      logger.warn(`Cannot modify peer ${netID}: entry expired`);
      return false;
    }

    // Update properties
    entry.data = { ...entry.data, ...modifications };
    entry.lastAccessed = Date.now();
    
    logger.debug(`Modified peer ${netID} properties`);
    return true;
  }

  /**
   * Delete a peer from cache
   */
  @Debug()
  public deletePeer(netID: number): boolean {
    return this.peers.delete(netID);
  }

  /**
   * Get a world from cache by name
   */
  @Debug()
  public getWorld(worldName: string): WorldData | undefined {
    const entry = this.worlds.get(worldName);
    
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.worlds.delete(worldName);
      return undefined;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  /**
   * Get a world from cache, or load from database if not found
   */
  @Debug()
  @ThrowError("Failed to get or load world")
  public async getOrLoadWorld(worldName: string): Promise<WorldData | undefined> {
    const entry = this.worlds.get(worldName);

    // Check if world exists in cache and is not expired
    if (entry && !this.isExpired(entry)) {
      entry.lastAccessed = Date.now();
      logger.debug(`World ${worldName} found in cache`);
      return entry.data;
    }

    // Not in cache or expired, load from database
    logger.debug(`World ${worldName} not in cache, loading from database`);
    const worldData = await this.database.world.get(worldName);

    if (worldData) {
      this.setWorld(worldName, worldData);
      logger.debug(`World ${worldName} loaded from database and cached`);
    }

    return worldData;
  }

  /**
   * Set a world in cache
   */
  @Debug()
  public setWorld(worldName: string, data: WorldData): void {
    // Enforce max size by evicting least recently used
    if (this.worlds.size >= this.MAX_CACHE_SIZE && !this.worlds.has(worldName)) {
      this.evictLRUWorld();
    }

    const entry: CacheEntry<WorldData> = {
      data,
      lastAccessed: Date.now(),
      createdAt:    Date.now(),
    };

    this.worlds.set(worldName, entry);
  }

  /**
   * Modify specific properties of a cached world
   */
  @Debug()
  public modifyWorld(worldName: string, modifications: Partial<WorldData>): boolean {
    const entry = this.worlds.get(worldName);
    
    if (!entry) {
      logger.warn(`Cannot modify world ${worldName}: not found in cache`);
      return false;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.worlds.delete(worldName);
      logger.warn(`Cannot modify world ${worldName}: entry expired`);
      return false;
    }

    // Update properties
    entry.data = { ...entry.data, ...modifications };
    entry.lastAccessed = Date.now();
    
    logger.debug(`Modified world ${worldName} properties`);
    return true;
  }

  /**
   * Delete a world from cache
   */
  @Debug()
  public deleteWorld(worldName: string): boolean {
    return this.worlds.delete(worldName);
  }

  /**
   * Get all peers from cache (non-expired)
   */
  @Debug()
  public getAllPeers(): Collection<number, PeerData> {
    const peers = new Collection<number, PeerData>();
    this.peers.forEach((entry, netID) => {
      if (!this.isExpired(entry)) {
        peers.set(netID, entry.data);
      }
    });
    return peers;
  }

  /**
   * Get all worlds from cache (non-expired)
   */
  @Debug()
  public getAllWorlds(): Collection<string, WorldData> {
    const worlds = new Collection<string, WorldData>();
    this.worlds.forEach((entry, worldName) => {
      if (!this.isExpired(entry)) {
        worlds.set(worldName, entry.data);
      }
    });
    return worlds;
  }

  /**
   * Clear all caches
   */
  @Debug()
  public clearAll(): void {
    this.peers.clear();
    this.worlds.clear();
    this.cooldown.clear();
    logger.info("All server data caches cleared");
  }

  /**
   * Check if a cache entry has expired
   */
  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.createdAt > this.CACHE_TTL;
  }

  /**
   * Evict the least recently used peer from cache
   */
  @Debug()
  private evictLRUPeer(): void {
    let oldestKey: number | undefined;
    let oldestTime = Infinity;

    this.peers.forEach((entry, netID) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = netID;
      }
    });

    if (oldestKey !== undefined) {
      this.peers.delete(oldestKey);
      logger.debug(`Evicted peer ${oldestKey} from cache (LRU)`);
    }
  }

  /**
   * Evict the least recently used world from cache
   */
  @Debug()
  private evictLRUWorld(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    this.worlds.forEach((entry, worldName) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = worldName;
      }
    });

    if (oldestKey !== undefined) {
      this.worlds.delete(oldestKey);
      logger.debug(`Evicted world ${oldestKey} from cache (LRU)`);
    }
  }

  /**
   * Clean up expired entries from caches
   */
  @Debug()
  public cleanup(): void {
    let peerExpired = 0;
    let worldExpired = 0;

    // Cleanup peers
    this.peers.forEach((entry, netID) => {
      if (this.isExpired(entry)) {
        this.peers.delete(netID);
        peerExpired++;
      }
    });

    // Cleanup worlds
    this.worlds.forEach((entry, worldName) => {
      if (this.isExpired(entry)) {
        this.worlds.delete(worldName);
        worldExpired++;
      }
    });

    if (peerExpired > 0 || worldExpired > 0) {
      logger.info(`Cache cleanup: ${peerExpired} peers, ${worldExpired} worlds expired`);
    }
  }

  /**
   * Get cache statistics
   */
  @Debug()
  public getCacheStats() {
    return {
      peers: {
        size:    this.peers.size,
        maxSize: this.MAX_CACHE_SIZE,
      },
      worlds: {
        size:    this.worlds.size,
        maxSize: this.MAX_CACHE_SIZE,
      },
      cooldowns: {
        size: this.cooldown.size,
      },
    };
  }
}