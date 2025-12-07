import { useDatabase } from "~~/server/utils/db";

export default defineEventHandler((event) => {
	const db = useDatabase();
	return db.auth.handler(toWebRequest(event));
});