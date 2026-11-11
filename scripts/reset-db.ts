/**
 * Destroys the local database and rebuilds it from `content/seed`.
 * `npm run db:reset` — uploads are left untouched.
 */
import fs from "node:fs";

import { closeDb, resolveDatabasePath } from "../src/lib/db/client";

closeDb();
const file = resolveDatabasePath();

for (const suffix of ["", "-wal", "-shm"]) {
  const target = `${file}${suffix}`;
  if (fs.existsSync(target)) {
    fs.rmSync(target);
    console.log(`✗ removed ${target}`);
  }
}

console.log("· database cleared. Run `npm run db:seed` to rebuild.");
