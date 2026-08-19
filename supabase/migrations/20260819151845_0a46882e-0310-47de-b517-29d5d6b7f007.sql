ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS captain2_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS captain2_photo_url text;