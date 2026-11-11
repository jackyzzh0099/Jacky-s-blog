#!/bin/sh
# Deployment diagnostics — everything goes to stderr so it shows in the deploy log.
echo "== deploy check ==" >&2
echo "os: $(head -1 /etc/os-release 2>/dev/null)" >&2
echo "node: $(node -v 2>&1) / npm: $(npm -v 2>&1)" >&2
echo "PORT=${PORT:-unset} pwd=$(pwd)" >&2
echo "bsq version: $(node -e 'console.log(require("better-sqlite3/package.json").version)' 2>&1)" >&2

echo "-- A: better-sqlite3 in memory --" >&2
node -e 'const D=require("better-sqlite3");const db=new D(":memory:");db.exec("create table t(a)");console.error("mem:",JSON.stringify(db.prepare("select 1 as x").get()))' >&2
echo "A exit: $?" >&2

echo "-- B: better-sqlite3 file open --" >&2
node -e 'const D=require("better-sqlite3");new D("storage/jacky.db");console.error("file open ok")' >&2
echo "B exit: $?" >&2

echo "-- C: node:sqlite in memory --" >&2
node --experimental-sqlite -e 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync(":memory:");db.exec("create table t(a)");db.prepare("insert into t values (?)").run(7);console.error("node:sqlite:",JSON.stringify(db.prepare("select a from t").get()))' >&2
echo "C exit: $?" >&2

echo "-- D: node:sqlite on the real file --" >&2
node --experimental-sqlite -e 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync("storage/jacky.db",{readOnly:true});console.error("posts:",JSON.stringify(db.prepare("select count(*) as n from posts").get()))' >&2
echo "D exit: $?" >&2

exec node_modules/.bin/next start -H 0.0.0.0 1>&2
