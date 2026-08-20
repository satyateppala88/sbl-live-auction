-- Private pre-auction target list per team (captains plan min/max bids per player).
-- Locked to service-role only: reads/writes go through PIN-gated server functions so a
-- team's strategy is never visible to rival captains via the public anon key.
CREATE TABLE IF NOT EXISTS public.captain_targets (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  min_price numeric,
  max_price numeric,
  note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, player_id)
);
GRANT ALL ON public.captain_targets TO service_role;
ALTER TABLE public.captain_targets ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: RLS with no policy = deny all to clients.
