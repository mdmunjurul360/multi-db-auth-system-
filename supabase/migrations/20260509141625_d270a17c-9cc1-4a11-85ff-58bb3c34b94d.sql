
-- Admin signup requests
CREATE TABLE public.admin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an admin request" ON public.admin_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Requester or super admin can view" ON public.admin_requests
  FOR SELECT USING (
    auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Super admin updates requests" ON public.admin_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

-- Wishlist
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activity" ON public.activity_logs
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Users insert own activity" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger: when admin_request is approved, grant admin role to that user
CREATE OR REPLACE FUNCTION public.handle_admin_request_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    NEW.reviewed_at := now();
  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    NEW.reviewed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_admin_request_approval() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_admin_request_status_change
  BEFORE UPDATE ON public.admin_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_request_approval();
