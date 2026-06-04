-- Composite index for books list query (is_published=true ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_books_published_created
  ON public.books (is_published, created_at DESC)
  WHERE is_published = true;

-- Index for book detail lookups by id is already implicit (primary key)
-- Index for orders by user_id (dashboard query)
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created
  ON public.orders (user_id, created_at DESC);