-- fixfind.cc — Repair & Compatibility DB
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS parts_db (
  id BIGSERIAL PRIMARY KEY,
  brand            TEXT        NOT NULL,
  model            TEXT        NOT NULL,
  error_code       TEXT,
  solution         TEXT,
  solution_ko      TEXT,
  part_name        TEXT,
  affiliate_url    TEXT,
  affiliate_price  NUMERIC(10,2),
  affiliate_image  TEXT,
  source           TEXT        DEFAULT 'aliexpress',
  slug             TEXT        NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add solution_ko to existing tables (safe to re-run)
ALTER TABLE parts_db ADD COLUMN IF NOT EXISTS solution_ko TEXT;

CREATE INDEX IF NOT EXISTS idx_partsdb_brand_model ON parts_db(brand, model);
CREATE INDEX IF NOT EXISTS idx_partsdb_updated_at  ON parts_db(updated_at DESC);

CREATE TABLE IF NOT EXISTS sync_runs (
  id BIGSERIAL PRIMARY KEY,
  ran_at         TIMESTAMPTZ DEFAULT NOW(),
  entries_count  INT,
  upserted_count INT,
  errors         JSONB,
  ok             BOOLEAN
);

-- === Row Level Security ===
ALTER TABLE parts_db   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_runs  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read parts_db" ON parts_db;
CREATE POLICY "anon read parts_db"
  ON parts_db FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "service write parts_db" ON parts_db;
CREATE POLICY "service write parts_db"
  ON parts_db FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service write sync_runs" ON sync_runs;
CREATE POLICY "service write sync_runs"
  ON sync_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Explicit denials for anon writes (defense-in-depth)
DROP POLICY IF EXISTS "anon no insert parts_db" ON parts_db;
DROP POLICY IF EXISTS "anon no update parts_db" ON parts_db;
DROP POLICY IF EXISTS "anon no delete parts_db" ON parts_db;
