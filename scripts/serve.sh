#!/bin/sh
# Production start wrapper for hosted environments.
#
# Many sandboxes mount the uploaded project read-only. SQLite needs to write its
# WAL files and sessions, so the database and uploads are copied into a writable
# runtime directory on first boot. The shipped database already contains the
# seeded content, so the site is never empty.
set -e

RUNTIME_DIR="${RUNTIME_DIR:-/tmp/jacky-runtime}"
DB_SOURCE="${DATABASE_PATH:-./storage/jacky.db}"
UPLOAD_SOURCE="${STORAGE_DIR:-./storage/uploads}"

echo "[serve] project dir writable test:" >&2
if ( : > .write-test ) 2>/dev/null; then
  echo "[serve] project dir is writable" >&2
  rm -f .write-test
else
  echo "[serve] project dir is READ-ONLY — using ${RUNTIME_DIR}" >&2
fi

mkdir -p "${RUNTIME_DIR}/storage/uploads"

if [ ! -f "${RUNTIME_DIR}/storage/jacky.db" ]; then
  if [ -f "${DB_SOURCE}" ]; then
    cp "${DB_SOURCE}" "${RUNTIME_DIR}/storage/jacky.db" && echo "[serve] database copied" >&2
  else
    echo "[serve] no source database found; a fresh one will be created" >&2
  fi
  if [ -d "${UPLOAD_SOURCE}" ]; then
    cp -R "${UPLOAD_SOURCE}/." "${RUNTIME_DIR}/storage/uploads/" 2>/dev/null || true
  fi
fi

export DATABASE_PATH="${RUNTIME_DIR}/storage/jacky.db"
export STORAGE_DIR="${RUNTIME_DIR}/storage/uploads"
export NODE_OPTIONS="${NODE_OPTIONS:-} --experimental-sqlite"
export NEXT_TELEMETRY_DISABLED=1

echo "[serve] db=${DATABASE_PATH}" >&2
echo "[serve] uploads=${STORAGE_DIR}" >&2
echo "[serve] starting on port ${PORT:-3000}" >&2

exec node node_modules/next/dist/bin/next start -H 0.0.0.0
