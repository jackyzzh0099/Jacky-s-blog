/**
 * Creates the SQLite schema. Safe to run repeatedly.
 * `npm run db:init`
 */
import { getDb, resolveDatabasePath } from "../src/lib/db/client";

const file = resolveDatabasePath();
const db = getDb();

// Touch the file so the path is materialised even if the schema already exists.
db.prepare("SELECT 1").get();
console.log(`✓ schema ready → ${file}`);
