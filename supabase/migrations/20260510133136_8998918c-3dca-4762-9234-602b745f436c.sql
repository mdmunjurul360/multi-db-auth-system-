DROP POLICY IF EXISTS "Anyone can submit an admin request" ON public.admin_requests;
CREATE POLICY "Anyone can submit an admin request"
ON public.admin_requests
FOR INSERT
WITH CHECK (email IS NOT NULL AND length(trim(email)) > 3);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_admin_request_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_admin_request_approval() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO postgres;