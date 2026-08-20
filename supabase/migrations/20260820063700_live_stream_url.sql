-- Live camera feed: organizer pastes a YouTube Live URL that embeds on /watch.
-- Column already added directly via ALTER TABLE; this file is for history.
-- Safe to re-run (idempotent).

ALTER TABLE public.auction_state
  ADD COLUMN IF NOT EXISTS live_stream_url text;
