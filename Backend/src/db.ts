import { Database } from "bun:sqlite";
import { join } from "path";
 
const DB_PATH = join("db.sqlite3");

export const db = new Database(DB_PATH);
 
// Enable WAL mode for better concurrent read performance
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");