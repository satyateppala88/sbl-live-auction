ALTER TABLE public.auction_state
  ADD COLUMN IF NOT EXISTS block_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS block_seconds integer NOT NULL DEFAULT 120;

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  message text NOT NULL,
  device_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat public read" ON public.chat_messages;
CREATE POLICY "chat public read" ON public.chat_messages FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages (created_at DESC);

CREATE TABLE IF NOT EXISTS public.auction_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  amount numeric,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.auction_log TO anon, authenticated;
GRANT ALL ON public.auction_log TO service_role;

ALTER TABLE public.auction_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auction log public read" ON public.auction_log;
CREATE POLICY "auction log public read" ON public.auction_log FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS auction_log_created_at_idx ON public.auction_log (created_at DESC);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_log;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;