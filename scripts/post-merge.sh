#!/bin/bash
set -e
npm install
npx drizzle-kit push --force

# Recreate the session table managed by connect-pg-simple (not in Drizzle schema)
psql "$DATABASE_URL" -c "
  CREATE TABLE IF NOT EXISTS session (
    sid varchar NOT NULL COLLATE \"default\",
    sess json NOT NULL,
    expire timestamp(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
  ) WITH (OIDS=FALSE);
  CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
"
