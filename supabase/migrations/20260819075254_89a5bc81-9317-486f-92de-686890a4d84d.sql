
CREATE TYPE public.player_category AS ENUM ('male','female','kid');
CREATE TYPE public.player_status AS ENUM ('available','on_auction','sold','unsold','in_unsold_pool');

CREATE TABLE public.tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  base_price numeric NOT NULL DEFAULT 5,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tiers TO anon, authenticated;
GRANT ALL ON public.tiers TO service_role;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiers public read" ON public.tiers FOR SELECT USING (true);

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  captain_name text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#e11d48',
  starting_budget numeric NOT NULL DEFAULT 100,
  remaining_budget numeric NOT NULL DEFAULT 100,
  max_roster_size int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams public read" ON public.teams FOR SELECT USING (true);

CREATE TABLE public.team_secrets (
  team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  pin text NOT NULL
);
GRANT ALL ON public.team_secrets TO service_role;
ALTER TABLE public.team_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category public.player_category NOT NULL DEFAULT 'male',
  tier_id uuid REFERENCES public.tiers(id) ON DELETE SET NULL,
  base_price numeric NOT NULL DEFAULT 2,
  original_base_price numeric NOT NULL DEFAULT 2,
  status public.player_status NOT NULL DEFAULT 'available',
  sold_to_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  sold_price numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players public read" ON public.players FOR SELECT USING (true);

CREATE TABLE public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bids TO anon, authenticated;
GRANT ALL ON public.bids TO service_role;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bids public read" ON public.bids FOR SELECT USING (true);

CREATE TABLE public.auction_state (
  id int PRIMARY KEY DEFAULT 1,
  current_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  bidding_open boolean NOT NULL DEFAULT false,
  bid_increment numeric NOT NULL DEFAULT 1,
  round_type text NOT NULL DEFAULT 'main',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auction_state_singleton CHECK (id = 1)
);
GRANT SELECT ON public.auction_state TO anon, authenticated;
GRANT ALL ON public.auction_state TO service_role;
ALTER TABLE public.auction_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auction state public read" ON public.auction_state FOR SELECT USING (true);
INSERT INTO public.auction_state (id) VALUES (1);

CREATE TABLE public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL
);
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.app_config (key, value) VALUES ('admin_passcode', 'sbl2026');

INSERT INTO public.tiers (label, base_price, sort_order) VALUES
  ('Icon', 15, 1),
  ('Challenger', 8, 2),
  ('Game Changer', 2, 3);

ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tiers;
ALTER TABLE public.teams REPLICA IDENTITY FULL;
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.auction_state REPLICA IDENTITY FULL;
