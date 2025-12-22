import { Database } from "@growserver/db";
import { DATABASE_URL } from "astro:env/server";

// Singleton instance to reuse the same database connection
let db: Database | null = null;
let connectionPromise: Promise<Database> | null = null;

/**
 * Get or create the database instance
 */
export async function useDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    db = new Database(DATABASE_URL);
    await db.connect();
    return db;
  })();

  return connectionPromise;
}

export const useAuth = async () => (await useDatabase()).auth;
