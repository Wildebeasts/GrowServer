import type { APIRoute } from "astro";
import { authVanilla } from "@/lib/auth-client";
import { z } from "zod";

export const prerender = false;

/**
 * Note: This endpoint is no longer needed as better-auth handles authentication automatically.
 * The client now uses authVue.signIn.username() which calls better-auth's built-in endpoints.
 * 
 * Better-auth automatically creates these endpoints:
 * - POST /api/auth/sign-in/username - for username/password login
 * - POST /api/auth/sign-out - for logout
 * - GET /api/auth/session - to get current session
 * 
 * If you need custom logic after login, consider using better-auth hooks or middleware.
 * This endpoint is kept for reference but can be removed.
 */

const loginSchema = z.object({
  growId: z
    .string()
    .min(5, { message: "GrowID must be at least 5 characters." })
    .max(20, { message: "GrowID are too long." })
    .refine((v) => !/[!@#$%^&*(),.?":{}|<> ]/.test(v), {
      message: "GrowID are containing special characters.",
    }),
  password: z.string().min(5, {
    message: "Password must contains at least 5 characters long.",
  }),
});

export const POST: APIRoute = async ({ request }) => {
  return new Response(
    JSON.stringify({
      success: false,
      message: "This endpoint is deprecated. Please use better-auth's built-in authentication endpoints. The client should call authVue.signIn.username() instead.",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
