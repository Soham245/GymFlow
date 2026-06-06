import { createDb, type Database } from "@gymflow/db";
import { env } from "./env.js";

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) {
    _db = createDb(env.DATABASE_URL);
  }
  return _db;
}
