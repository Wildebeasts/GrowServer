import { Base } from "@/core/Base";
import logger from "@growserver/logger";
import { config } from "dotenv";

const envOut = config({
  path: "../../.env"
});

if (envOut) 
  logger.info("[INIT] Loaded env");
else 
  logger.error("[INIT] Failed to load env");


logger.info("[INIT] Starting GrowServer");
const base = new Base();

base.init();
