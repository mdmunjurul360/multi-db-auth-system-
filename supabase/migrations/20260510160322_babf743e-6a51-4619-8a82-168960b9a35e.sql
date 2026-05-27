ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS pages integer,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS old_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS what_you_will_learn text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS table_of_contents jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preview_chapters jsonb DEFAULT '[]'::jsonb;