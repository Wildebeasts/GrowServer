export interface PeerData {
  channelID: number;
  x?: number;
  y?: number;
  world: string;
  inventory: Inventory;
  rotatedLeft: boolean;
  name: string;
  displayName: string;
  netID: number;
  country: string;
  platformID?: string;
  userID: number;
  role: string;
  gems: number;
  clothing: Clothing;
  exp: number;
  level: number;
  lastCheckpoint?: CheckPoint;
  lastVisitedWorlds?: string[];
  state: PeerState;
  heartMonitors: Map<string, Array<number>>;
  loggedIn?: boolean;
  /** Link to the Magplant 5000 this player's remote is tied to */
  magplantLink?: {
    /** World name where the linked magplant is placed */
    world: string;
    /** Block index (x + y * width) of the linked magplant */
    tileIndex: number;
  };
}

export interface PeerState {
  mod: number;
  canWalkInBlocks: boolean;
  modsEffect: number;
  lava: LavaState;
  isGhost: boolean;
}

export interface LavaState {
  damage: number;
  resetStateAt: number;
}

export interface Inventory {
  max: number;
  items: InventoryItems[];
}

export interface InventoryItems {
  id: number;
  amount: number;
}

export interface CheckPoint {
  x: number;
  y: number;
}

export interface Clothing {
  [key: string]: number;
  shirt: number;
  pants: number;
  feet: number;
  face: number;
  hand: number;
  back: number;
  hair: number;
  mask: number;
  necklace: number;
  ances: number;
}
