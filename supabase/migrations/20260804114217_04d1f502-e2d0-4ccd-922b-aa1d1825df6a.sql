ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'food';
CREATE INDEX IF NOT EXISTS recipes_user_fav_idx ON public.recipes (user_id, favorite);