import { Database } from "@growserver/db";

let db: Database;

export const useDatabase = () => {
	if (!db) {
		throw new Error("Database not initialized. Make sure the database plugin has loaded.");
	}
	return db;
};

export const initDatabase = async () => {
	if (!db) {
		db = new Database();
		await db.setup();
	}
	return db;
};
