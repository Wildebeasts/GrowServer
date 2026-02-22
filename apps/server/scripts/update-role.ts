import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { players } from "../../../packages/db/shared/schemas/Player";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

config({ path: "../../.env" });

const ROLES: Record<string, string> = {
  "1": "DEVELOPER",
  "2": "BASIC",
  "3": "SUPPORTER",
};

const username = process.argv[2];
const roleValue = process.argv[3] || "1"; // Default to DEVELOPER

if (!username) {
  console.error("Please provide a username");
  console.info("Usage: pnpm tsx scripts/update-role.ts <username> [role]");
  console.info("Roles: 1=DEVELOPER, 2=BASIC, 3=SUPPORTER");
  process.exit(1);
}

if (!ROLES[roleValue]) {
  console.error(`Invalid role: ${roleValue}`);
  console.info("Roles: 1=DEVELOPER, 2=BASIC, 3=SUPPORTER");
  process.exit(1);
}

async function updateRole() {
  const connection = postgres(process.env.DATABASE_URL!);
  const db = drizzle(connection, { logger: false });

  try {
    // Also reset display_name to plain name (strips any saved color codes)
    const result = await db
      .update(players)
      .set({ role: roleValue, display_name: username })
      .where(eq(players.name, username.toLowerCase()))
      .returning({ id: players.id, name: players.name });

    if (!result.length) {
      console.error(`User "${username}" not found.`);
      process.exit(1);
    }

    console.log(
      `Role updated to ${ROLES[roleValue]} (${roleValue}) for user: ${username}`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Failed to update role:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

updateRole();
