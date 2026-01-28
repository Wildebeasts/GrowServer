import { useDatabase } from "@/lib/database";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const refreshToken = (await request.formData()).get("refreshToken");

    if (!refreshToken || typeof refreshToken !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: "refreshToken is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const db = await useDatabase();

    const sessionData = await db.models.Session.findOne({ token: refreshToken })
      .populate({
        path:     'userId',
        model:    'User',
        populate: {
          path:  'playerId',
          model: 'Player'
        }
      });



    if (!sessionData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired session",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (new Date(sessionData.expiresAt) < new Date()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Session has expired",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Account Validated.",
        token: refreshToken,
        url: "",
        accountType: "growtopia",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/html"
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
}