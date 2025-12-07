import { initDatabase } from "~~/server/utils/db";

// TODO: next i'll continue working on website -jad
export default defineNitroPlugin(async () => {
	await initDatabase();
});
