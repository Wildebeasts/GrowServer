import type { APIRoute } from "astro";
import { useDatabase } from "../../../lib/database";

/**
 * GET /api/worlds
 * Example: Fetch all worlds from the database
 */
export const GET: APIRoute = async () => {
  try {
    const db = await useDatabase();
    
    // Using the world handler
    const worlds = await db.world.getAll();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: worlds,
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

/**
 * POST /api/worlds
 * Example: Create a new world
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const db = await useDatabase();
    const body = await request.json();
    
    // Example: Use the database models directly
    const newWorld = await db.models.World.create(body);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: newWorld,
      }),
      {
        status: 201,
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
