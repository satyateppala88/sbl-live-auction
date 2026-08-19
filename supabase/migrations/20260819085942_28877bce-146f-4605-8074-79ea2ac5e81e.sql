ALTER TABLE public.players ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS captain_photo_url text;