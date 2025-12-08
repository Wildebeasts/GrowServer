import { initDatabase } from "~~/server/utils/db";

export default defineNitroPlugin(async () => {
	await initDatabase();
});
