import type { APIRoute } from "astro";
import { useDatabase } from "../../lib/database";

/**
 * GET /api/example
 * Example API route demonstrating different ways to access the database
 */
export const GET: APIRoute = async () => {
  try {
    const db = await useDatabase();

    // Access database in multiple ways:
    
    // 1. Using handlers
    const playerCount = await db.models.Player.countDocuments();
    const worldCount = await db.models.World.countDocuments();
    
    // 2. Direct MongoDB access
    const collections = await db.db.listCollections().toArray();
    
    // 3. Using auth
    const authInfo = {
      availableMethods: ["email", "discord"],
      sessionExpiry: "7 days",
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          database: {
            connected: true,
            playerCount,
            worldCount,
            collections: collections.map(c => c.name),
          },
          auth: authInfo,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
