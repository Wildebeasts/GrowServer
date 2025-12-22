import { useAuth } from "../../../lib/database";
import type { APIRoute } from "astro";

export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
  // If you want to use rate limiting, make sure to set the 'x-forwarded-for' header to the request headers from the context
  // ctx.request.headers.set("x-forwarded-for", ctx.clientAddress);
  const auth = await useAuth();
  return auth.handler(ctx.request);
};
