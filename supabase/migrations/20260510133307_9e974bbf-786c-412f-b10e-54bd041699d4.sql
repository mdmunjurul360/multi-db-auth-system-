CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.has_role(_user_id, _role)
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

ALTER POLICY "Users insert own activity" ON public.activity_logs
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users view own activity" ON public.activity_logs
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Requester or super admin can view" ON public.admin_requests
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Super admin updates requests" ON public.admin_requests
USING (private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Admins manage books" ON public.books
USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Books are publicly viewable" ON public.books
USING (is_published = true OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Admins manage coupons" ON public.coupons
USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Order items follow order access" ON public.order_items
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id
    AND (o.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'))
));

ALTER POLICY "Admins update orders" ON public.orders
USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Users view own orders" ON public.orders
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Profiles viewable by owner or admins" ON public.profiles
USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Users delete own reviews" ON public.reviews
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Super admin manages roles" ON public.user_roles
USING (private.has_role(auth.uid(), 'super_admin'))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Users view own roles" ON public.user_roles
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Admins create notifications" ON public.notifications
WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Users view own notifications" ON public.notifications
USING (user_id IS NULL OR user_id = auth.uid() OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

ALTER POLICY "Users update own notifications" ON public.notifications
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());