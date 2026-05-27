
-- 1. Orders: guest checkout support
ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS reference_id text UNIQUE;

-- Replace insert policy to allow guests
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND user_id IS NULL AND guest_email IS NOT NULL)
  );

-- Allow order_items insert for guest orders too
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items for their order"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
          OR (auth.uid() IS NULL AND o.user_id IS NULL)
        )
    )
  );

-- 2. Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coupons publicly readable"
  ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, user_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews publicly readable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users insert own reviews" ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
