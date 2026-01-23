import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const userSchema = new Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, required: true, default: false },
  image:         { type: String },
  createdAt:     { type: Date, required: true, default: Date.now },
  updatedAt:     { type: Date, required: true, default: Date.now },
  username:      { type: String, unique: true, sparse: true },
  role:          { type: String, enum: ["admin", "user"] },
  banned:        { type: Boolean },
  banReason:     { type: String },
  banExpires:    { type: Date },
  playerId:      { type: Schema.Types.ObjectId, ref: "Player" },
}, { timestamps: true, collection: "user" });

const sessionSchema = new Schema({
  userId:    { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  token:     { type: String, required: true, unique: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "session" });

const accountSchema = new Schema({
  userId:                { type: String, required: true, index: true },
  accountId:             { type: String, required: true },
  providerId:            { type: String, required: true },
  accessToken:           { type: String },
  refreshToken:          { type: String },
  idToken:               { type: String },
  accessTokenExpiresAt:  { type: Date },
  refreshTokenExpiresAt: { type: Date },
  scope:                 { type: String },
  password:              { type: String },
  createdAt:             { type: Date, required: true, default: Date.now },
  updatedAt:             { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "account" });

accountSchema.index({ providerId: 1, accountId: 1 }, { unique: true });

const verificationSchema = new Schema({
  identifier: { type: String, required: true, index: true },
  value:      { type: String, required: true },
  expiresAt:  { type: Date, required: true, index: true },
  createdAt:  { type: Date, required: true, default: Date.now },
  updatedAt:  { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "verification" });

const apiKeySchema = new Schema({
  userId:    { type: String, required: true, index: true },
  name:      { type: String, required: true },
  key:       { type: String, required: true, unique: true },
  expiresAt: { type: Date },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "apikey" });

const playerSchema = new Schema({
  name: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
    index:     true,
  },
  displayName: { type: String, required: true },
  role:        { type: String, required: true },
  userId:      { type: Schema.Types.ObjectId, ref: "User" },
  clothing:    {
    shirt:    { type: Number, required: true, default: 0 },
    pants:    { type: Number, required: true, default: 0 },
    feet:     { type: Number, required: true, default: 0 },
    face:     { type: Number, required: true, default: 0 },
    hand:     { type: Number, required: true, default: 0 },
    back:     { type: Number, required: true, default: 0 },
    hair:     { type: Number, required: true, default: 0 },
    mask:     { type: Number, required: true, default: 0 },
    necklace: { type: Number, required: true, default: 0 },
    ances:    { type: Number, required: true, default: 0 },
  },
  inventory: {
    max:   { type: Number, required: true, default: 16 },
    items: [{
      id:     { type: Number, required: true, default: 0 },
      amount: { type: Number, required: true, default: 0 },
    }],
  }
}, {
  timestamps: true,
  collection: "player"
});

const worldSchema = new Schema({
  name: {
    type:      String,
    required:  true,
    uppercase: true,
    unique:    true,
    index:     true
  },
  width:  { type: Number, required: true,  default: 100 },
  height: { type: Number, required: true, default: 60 },
  owner:  {
    userId:    { type: Schema.Types.ObjectId, ref: "Player" },
    worldLock: {
      x: { type: Number },
      y: { type: Number }
    }
  },
  tilesData: {
    type:     Buffer,
    required: true,
    default:  Buffer.alloc(0)
  },
  extras: [{
    _id:  false,
    id:   { type: Number, required: true },
    x:    { type: Number, required: true },
    y:    { type: Number, required: true },
    data: { type: Schema.Types.Mixed }
  }],
  droppedItems: [{
    _id:       false,
    uid:       { type: Number, required: true },
    id:        { type: Number, required: true },
    amount:    { type: Number, default: 1 },
    x:         { type: Number, required: true },
    y:         { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  droppedUidCounter: { type: Number, default: 1 },
  weather:           {
    id:       { type: Number, default: 41 },
    heatWave: {
      r: { type: Number, required: true, default: 0, min: 0, max: 255 },
      g: { type: Number, required: true, default: 0, min: 0, max: 255 },
      b: { type: Number, required: true, default: 0, min: 0, max: 255 },
    }
  }
}, {
  timestamps: true,
  collection: "world"
});

// GrowServer Schema
export const PlayerModel = models.Player || model("Player", playerSchema);
export const WorldModel = models.World || model("World", worldSchema);

// better-auth Schema
export const UserModel = models.User || model("User", userSchema);
export const SessionModel = models.Session || model("Session", sessionSchema);
export const AccountModel = models.Account || model("Account", accountSchema);
export const VerificationModel = models.Verification || model("Verification", verificationSchema);
export const ApiKeyModel = models.ApiKey || model("ApiKey", apiKeySchema);

// Type exports using InferSchemaType
export type User = mongoose.InferSchemaType<typeof userSchema>;
export type Session = mongoose.InferSchemaType<typeof sessionSchema>;
export type Account = mongoose.InferSchemaType<typeof accountSchema>;
export type Verification = mongoose.InferSchemaType<typeof verificationSchema>;
export type ApiKey = mongoose.InferSchemaType<typeof apiKeySchema>;
export type Player = mongoose.InferSchemaType<typeof playerSchema>;
export type World = mongoose.InferSchemaType<typeof worldSchema>;

// Document types with _id and mongoose methods
export type UserDocument = mongoose.HydratedDocument<User>;
export type SessionDocument = mongoose.HydratedDocument<Session>;
export type AccountDocument = mongoose.HydratedDocument<Account>;
export type VerificationDocument = mongoose.HydratedDocument<Verification>;
export type ApiKeyDocument = mongoose.HydratedDocument<ApiKey>;
export type PlayerDocument = mongoose.HydratedDocument<Player>;
export type WorldDocument = mongoose.HydratedDocument<World>;
