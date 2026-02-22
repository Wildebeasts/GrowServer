import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config, frontend } from "@growserver/config";
import { createServer } from "https";
import {
  downloadMkcert,
  downloadWebsite,
  setupMkcert,
  setupWebsite,
} from "@growserver/utils";
import logger from "@growserver/logger";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFileSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Database } from "@growserver/db";

async function init() {
  const app = new Hono();
  const buns = process.versions.bun ? await import("hono/bun") : undefined;
  const db = new Database();

  await downloadMkcert();
  await downloadWebsite();

  await setupMkcert();
  await setupWebsite();

  app.use("*", async (ctx, next) => {
    const method = ctx.req.method;
    const path = ctx.req.path;
    logger.info(`[${method}] ${path}`);
    await next();
  });

  app.use(
    "/*",
    process.env.RUNTIME_ENV === "bun" && process.versions.bun
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        buns?.serveStatic({ root: config.webFrontend.root })!
      : serveStatic({
          root: config.webFrontend.root,
        }),
  );

  // This HTML page auto-redirects to /player/growid/login/validate via window.location.href.
  // The Growtopia client intercepts that JS-triggered navigation (same as the manual login SPA does),
  // which is what causes it to read aat=9999 and unlock chat.
  // Pointing checktoken's url directly at the JSON endpoint does NOT trigger the interception.
  // When checktoken returns status:"error", the Growtopia client opens loginUrl
  // in its embedded WebView. We intercept that with a token param and serve an
  // HTML page that silently POSTs to /player/login/validate, gets the token back,
  // then does window.location.href to /player/growid/login/validate?token=...
  // The client intercepts THAT navigation to set aat and enable chat.
  app.get("/player/growid/autologin-page", async (ctx) => {
    const token = ctx.req.query("token");
    logger.info(`[AUTOLOGIN-PAGE] token=${token ? "present" : "missing"}`);
    if (!token) return ctx.body("No token", 400);

    let growId: string, password: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        growId: string;
        password: string;
      };
      growId = decoded.growId;
      password = decoded.password;
    } catch {
      return ctx.body("Invalid token", 401);
    }

    // This page auto-POSTs credentials, gets a fresh token, then navigates to
    // /player/growid/login/validate — the URL the client WebView intercepts.
    return ctx.html(`<!DOCTYPE html><html><head><meta charset="utf-8">
<script>
(async function() {
  try {
    var r = await fetch("/player/login/validate", {
      method: "POST",
      headers: {"Content-Type": "application/json", "Accept": "application/json"},
      body: JSON.stringify({data: {growId: ${JSON.stringify(growId)}, password: ${JSON.stringify(password)}}})
    });
    var d = await r.json();
    if (d.token) {
      window.location.href = "/player/growid/login/validate?token=" + encodeURIComponent(d.token);
    }
  } catch(e) {}
})();
</script>
</head><body></body></html>`);
  });

  app.get("/player/growid/autologin", (ctx) => {
    const token = ctx.req.query("token");
    logger.info(`[AUTOLOGIN] token=${token ? "present" : "missing"}`);
    if (!token) return ctx.body("No token", 400);
    const validatePath = `/player/growid/login/validate?token=${encodeURIComponent(token)}`;
    return ctx.html(
      `<!DOCTYPE html><html><head><meta charset="utf-8">` +
        `<meta http-equiv="refresh" content="0;url=${validatePath}">` +
        `<script>window.location.href="${validatePath}";</script>` +
        `</head><body>Redirecting...</body></html>`,
    );
  });

  app.get("/player/growid/login/validate", (ctx) => {
    try {
      const query = ctx.req.query();
      const token = query.token;
      logger.info(`[VALIDATE-GET] token=${token ? "present" : "missing"}`);
      if (!token) throw new Error("No token provided");

      return ctx.html(
        JSON.stringify({
          status: "success",
          message: "Account Validated.",
          token,
          url: "",
          accountType: "growtopia",
          accountAge: 9999,
          aat: 9999,
        }),
      );
    } catch (e) {
      return ctx.body(`Unauthorized: ${e}`, 401);
    }
  });

  app.post("/player/login/validate", async (ctx) => {
    let user;
    try {
      const body = await ctx.req.json();
      const growId = body.data?.growId;
      const password = body.data?.password;

      if (!growId || !password) return ctx.body("Unauthorized", 401);

      try {
        user = await db.players.get(growId.toLowerCase());
      } catch (e) {
        logger.error(`[LOGIN] Database error: ${e}`);
        return ctx.body("Internal server error", 500);
      }

      if (!user) return ctx.body("User not found", 401);

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return ctx.body("Password invalid", 401);

      const token = jwt.sign(
        { growId, password },
        process.env.JWT_SECRET as string,
      );

      return ctx.html(
        JSON.stringify({
          status: "success",
          message: "Account Validated.",
          token,
          url: "",
          accountType: "growtopia",
          accountAge: 9999,
          aat: 9999,
        }),
      );
    } catch (e) {
      logger.error(`[LOGIN] Unexpected error: ${e}`);
      return ctx.body(`Unauthorized: ${e}`, 401);
    }
  });

  app.post("/player/growid/checktoken", (ctx) => {
    const valKey = ctx.req.query("valKey") ?? "";
    return ctx.redirect(
      `/player/growid/validate/checktoken?valKey=${valKey}`,
      307,
    );
  });

  app.post("/player/growid/validate/checktoken", async (ctx) => {
    try {
      const formData = (await ctx.req.formData()) as FormData;
      const refreshToken = formData.get("refreshToken") as string;

      if (!refreshToken) throw new Error("Unauthorized");

      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET as string,
      ) as { growId: string; password: string };

      logger.info(`[CHECKTOKEN] success for growId=${decoded.growId}`);
      return ctx.html(
        JSON.stringify({
          status: "success",
          message: "Account Validated.",
          token: refreshToken,
          url: "",
          accountType: "growtopia",
          accountAge: 9999,
          aat: 9999,
        }),
      );
    } catch (e) {
      logger.error(`Error checking token: ${e}`);
      return ctx.body("Unauthorized", 401);
    }
  });

  app.post("/player/signup", async (ctx) => {
    try {
      const body = await ctx.req.json();
      const growId = body.data?.growId;
      const password = body.data?.password;
      const confirmPassword = body.data?.confirmPassword;

      if (!growId || !password || !confirmPassword)
        return ctx.body("Unauthorized", 401);

      // Check if password and confirm password match
      if (password !== confirmPassword)
        return ctx.body("Password and Confirm Password does not match", 401);

      let existingUser;
      try {
        existingUser = await db.players.get(growId.toLowerCase());
      } catch (e) {
        logger.error(`[SIGNUP] Database error: ${e}`);
        return ctx.body("Internal server error", 500);
      }

      if (existingUser) return ctx.body("User already exists", 401);

      // Save player to database
      try {
        await db.players.set(growId, password);
      } catch (e) {
        logger.error(`[SIGNUP] Failed to create user: ${e}`);
        return ctx.body("Internal server error", 500);
      }

      // Login user:
      const token = jwt.sign(
        { growId, password },
        process.env.JWT_SECRET as string,
      );

      if (!token) return ctx.body("Unauthorized", 401);

      jwt.verify(token, process.env.JWT_SECRET as string);

      return ctx.html(
        JSON.stringify({
          status: "success",
          message: "Account Validated.",
          token,
          url: "",
          accountType: "growtopia",
          accountAge: 9999,
          aat: 9999,
        }),
      );
    } catch (e) {
      logger.error(`[SIGNUP] Unexpected error: ${e}`);
      return ctx.body("Unauthorized", 401);
    }
  });

  app.post("/player/login/dashboard", (ctx) => {
    const html = readFileSync(
      join(__dirname, "..", ".cache", "website", "index.html"),
      "utf-8",
    );
    return ctx.html(html);
  });

  const fe = frontend();

  if (process.env.RUNTIME_ENV === "node") {
    serve(
      {
        fetch: app.fetch,
        createServer,
        serverOptions: {
          key: fe.tls.key,
          cert: fe.tls.cert,
        },
        port: config.webFrontend.port,
      },
      (info) => {
        logger.info(`Node Login Page Server is running on port ${info.port}`);
      },
    );
  } else if (process.env.RUNTIME_ENV === "bun") {
    logger.info(`Bun Login Page Server is running on port ${config.web.port}`);
    Bun.serve({
      fetch: app.fetch,
      port: config.webFrontend.port,
      tls: {
        key: fe.tls.key,
        cert: fe.tls.cert,
      },
    });
  }
}

init();
