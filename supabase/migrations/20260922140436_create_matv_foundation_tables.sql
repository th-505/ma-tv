/*
# Create MA-TV Foundation Tables (Single-tenant, no auth)

1. Purpose
- Store playback progress so users can resume watching across sessions.
- Track watch history for "Continue Watching" and completed content.
- Store user favorites / "My List".
- Cache provider mappings (positive and negative) to avoid redundant searches.
- Cache provider performance profiles for local adaptive ranking.

2. New Tables
- `playback_progress` — current playback position per content item
  - `content_id` (integer, TMDB ID, part of PK)
  - `media_type` (text, movie or series)
  - `position` (integer, seconds)
  - `duration` (integer, seconds)
  - `completed` (boolean, default false)
  - `provider_id` (text, nullable)
  - `source_id` (text, nullable)
  - `season_number` (integer, nullable, for series)
  - `episode_number` (integer, nullable, for series)
  - `updated_at` (timestamptz)

- `watch_history` — completed viewing events
  - `id` (uuid PK)
  - `content_id` (integer, TMDB ID)
  - `media_type` (text)
  - `title` (text)
  - `poster_path` (text, nullable)
  - `watched_at` (timestamptz)
  - `season_number` (integer, nullable)
  - `episode_number` (integer, nullable)

- `favorites` — user's "My List"
  - `content_id` (integer, TMDB ID, part of PK)
  - `media_type` (text, part of PK)
  - `title` (text)
  - `poster_path` (text, nullable)
  - `added_at` (timestamptz)

- `provider_mappings` — positive mapping cache
  - `id` (uuid PK)
  - `provider_id` (text)
  - `tmdb_id` (integer)
  - `content_type` (text)
  - `provider_item_id` (text)
  - `provider_url_key` (text, nullable)
  - `matched_title` (text)
  - `matched_year` (integer, nullable)
  - `confidence` (real)
  - `method` (text)
  - `verified_at` (timestamptz)
  - `expires_at` (timestamptz)
  - unique on (provider_id, tmdb_id, content_type)

- `negative_mappings` — negative mapping cache to avoid repeated fruitless searches
  - `id` (uuid PK)
  - `provider_id` (text)
  - `tmdb_id` (integer)
  - `content_type` (text)
  - `reason` (text)
  - `recorded_at` (timestamptz)
  - `expires_at` (timestamptz)
  - unique on (provider_id, tmdb_id, content_type)

- `provider_performance` — local adaptive learning profiles
  - `provider_id` (text, PK)
  - `success_rate_ema` (real)
  - `startup_latency_ema` (real)
  - `buffering_rate_ema` (real)
  - `quality_success` (real)
  - `subtitle_success` (real)
  - `content_class` (text)
  - `device_class` (text)
  - `network_class` (text)
  - `last_updated` (timestamptz)

3. Security
- RLS enabled on all tables.
- Policies allow anon + authenticated CRUD (single-tenant, no sign-in per spec section 100).
- All data is local to this app instance, no multi-user isolation needed.

4. Indexes
- `playback_progress` on `updated_at` DESC for Continue Watching queries.
- `watch_history` on `watched_at` DESC for history listing.
- `provider_mappings` on `tmdb_id` for lookup.
- `negative_mappings` on `tmdb_id` for lookup.
*/

-- Playback Progress
CREATE TABLE IF NOT EXISTS playback_progress (
  content_id integer NOT NULL,
  media_type text NOT NULL DEFAULT 'movie',
  position integer NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  provider_id text,
  source_id text,
  season_number integer,
  episode_number integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, media_type, season_number, episode_number)
);

ALTER TABLE playback_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_progress" ON playback_progress;
CREATE POLICY "anon_select_progress" ON playback_progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_progress" ON playback_progress;
CREATE POLICY "anon_insert_progress" ON playback_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_progress" ON playback_progress;
CREATE POLICY "anon_update_progress" ON playback_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_progress" ON playback_progress;
CREATE POLICY "anon_delete_progress" ON playback_progress FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_progress_updated ON playback_progress (updated_at DESC);

-- Watch History
CREATE TABLE IF NOT EXISTS watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id integer NOT NULL,
  media_type text NOT NULL DEFAULT 'movie',
  title text NOT NULL,
  poster_path text,
  watched_at timestamptz NOT NULL DEFAULT now(),
  season_number integer,
  episode_number integer
);

ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_history" ON watch_history;
CREATE POLICY "anon_select_history" ON watch_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_history" ON watch_history;
CREATE POLICY "anon_insert_history" ON watch_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_history" ON watch_history;
CREATE POLICY "anon_delete_history" ON watch_history FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_history_watched ON watch_history (watched_at DESC);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  content_id integer NOT NULL,
  media_type text NOT NULL,
  title text NOT NULL,
  poster_path text,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, media_type)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_favorites" ON favorites;
CREATE POLICY "anon_select_favorites" ON favorites FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_favorites" ON favorites;
CREATE POLICY "anon_insert_favorites" ON favorites FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_favorites" ON favorites;
CREATE POLICY "anon_delete_favorites" ON favorites FOR DELETE
  TO anon, authenticated USING (true);

-- Provider Mappings (positive cache)
CREATE TABLE IF NOT EXISTS provider_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL,
  tmdb_id integer NOT NULL,
  content_type text NOT NULL,
  provider_item_id text NOT NULL,
  provider_url_key text,
  matched_title text NOT NULL,
  matched_year integer,
  confidence real NOT NULL,
  method text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE (provider_id, tmdb_id, content_type)
);

ALTER TABLE provider_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_mappings" ON provider_mappings;
CREATE POLICY "anon_select_mappings" ON provider_mappings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_mappings" ON provider_mappings;
CREATE POLICY "anon_insert_mappings" ON provider_mappings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_mappings" ON provider_mappings;
CREATE POLICY "anon_update_mappings" ON provider_mappings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_mappings" ON provider_mappings;
CREATE POLICY "anon_delete_mappings" ON provider_mappings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_mappings_tmdb ON provider_mappings (tmdb_id);

-- Negative Mappings
CREATE TABLE IF NOT EXISTS negative_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL,
  tmdb_id integer NOT NULL,
  content_type text NOT NULL,
  reason text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE (provider_id, tmdb_id, content_type)
);

ALTER TABLE negative_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_neg_mappings" ON negative_mappings;
CREATE POLICY "anon_select_neg_mappings" ON negative_mappings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_neg_mappings" ON negative_mappings;
CREATE POLICY "anon_insert_neg_mappings" ON negative_mappings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_neg_mappings" ON negative_mappings;
CREATE POLICY "anon_delete_neg_mappings" ON negative_mappings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_neg_mappings_tmdb ON negative_mappings (tmdb_id);

-- Provider Performance (local adaptive learning)
CREATE TABLE IF NOT EXISTS provider_performance (
  provider_id text PRIMARY KEY,
  success_rate_ema real NOT NULL DEFAULT 0.8,
  startup_latency_ema real NOT NULL DEFAULT 1000,
  buffering_rate_ema real NOT NULL DEFAULT 1.0,
  quality_success real NOT NULL DEFAULT 0.75,
  subtitle_success real NOT NULL DEFAULT 0.7,
  content_class text NOT NULL DEFAULT 'movie',
  device_class text NOT NULL DEFAULT 'web',
  network_class text NOT NULL DEFAULT 'wifi',
  last_updated timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE provider_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_perf" ON provider_performance;
CREATE POLICY "anon_select_perf" ON provider_performance FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_perf" ON provider_performance;
CREATE POLICY "anon_insert_perf" ON provider_performance FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_perf" ON provider_performance;
CREATE POLICY "anon_update_perf" ON provider_performance FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_perf" ON provider_performance;
CREATE POLICY "anon_delete_perf" ON provider_performance FOR DELETE
  TO anon, authenticated USING (true);