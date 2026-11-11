import fs from "node:fs";
import path from "node:path";
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from "node:sqlite";

import { SCHEMA_SQL } from "./schema";

/**
 * SQLite access layer built on Node's built-in `node:sqlite` driver.
 *
 * Using the runtime's own binding (rather than a compiled addon) keeps the
 * project portable: it runs on a plain `node` binary, inside restricted
 * sandboxes, and on machines without a C++ toolchain. Requires Node 22.5+ and
 * the `--experimental-sqlite` flag (passed through NODE_OPTIONS at start).
 */

type SqlValue = SQLInputValue;
type NamedParams = Record<string, SQLInputValue>;

type GlobalCache = {
  db?: DatabaseSync;
  statements?: Map<string, StatementSync>;
};

const globalForDb = globalThis as unknown as { __jackyDb?: GlobalCache };
const cache: GlobalCache = (globalForDb.__jackyDb ??= {});

export function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH ?? "./storage/jacky.db";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

function connect(): DatabaseSync {
  const file = resolveDatabasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA_SQL);

  cache.statements ??= new Map();
  return db;
}

/** Lazily initialised, hot-reload safe database handle. */
export function getDb(): DatabaseSync {
  cache.db ??= connect();
  return cache.db;
}

function prepare(sql: string): StatementSync {
  cache.statements ??= new Map();
  let statement = cache.statements.get(sql);
  if (!statement) {
    statement = getDb().prepare(sql);
    // The query layer uses a bounded set of statements; cap the cache anyway.
    if (cache.statements.size > 200) cache.statements.clear();
    cache.statements.set(sql, statement);
  }
  return statement;
}

export type SqlParams = unknown[] | Record<string, unknown>;

const isNamed = (params?: SqlParams): params is Record<string, unknown> =>
  Boolean(params) && !Array.isArray(params);

/** Runs a statement returning rows. Accepts positional or named parameters. */
export function all<T>(sql: string, params?: SqlParams): T[] {
  const statement = prepare(sql);
  const rows = isNamed(params)
    ? statement.all(params as NamedParams)
    : params
      ? statement.all(...(params as SqlValue[]))
      : statement.all();
  // node:sqlite returns null-prototype objects; React refuses to serialise
  // those across the server/client boundary, so normalise to plain objects.
  return rows.map((row) => ({ ...row })) as T[];
}

/** Runs a statement returning the first row. */
export function one<T>(sql: string, params?: SqlParams): T | undefined {
  const statement = prepare(sql);
  const row = isNamed(params)
    ? statement.get(params as NamedParams)
    : params
      ? statement.get(...(params as SqlValue[]))
      : statement.get();
  return row ? ({ ...row } as T) : undefined;
}

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

/** Runs a write statement. */
export function run(sql: string, params?: SqlParams): RunResult {
  const statement = prepare(sql);
  const result = isNamed(params)
    ? statement.run(params as NamedParams)
    : params
      ? statement.run(...(params as SqlValue[]))
      : statement.run();

  return {
    changes: Number(result.changes ?? 0),
    lastInsertRowid: result.lastInsertRowid ?? 0,
  };
}

/** Executes a set of writes atomically. */
export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* SQLite may have rolled back already */
    }
    throw error;
  }
}

/** Closes the handle — used by scripts before deleting the database file. */
export function closeDb(): void {
  try {
    cache.db?.close();
  } catch {
    /* already closed */
  }
  cache.db = undefined;
  cache.statements?.clear();
}
