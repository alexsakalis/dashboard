-- OAuth credentials are used only by server-side integration code. Keep the
-- integrations metadata readable via RLS, but do not expose token columns
-- through the Supabase Data API roles.
REVOKE SELECT, INSERT, UPDATE ON TABLE public.integrations FROM anon, authenticated;

GRANT SELECT (
  id,
  user_id,
  provider,
  display_name,
  enabled,
  config,
  status,
  last_synced_at,
  last_success_at,
  last_failure_at,
  last_message,
  created_at,
  updated_at
) ON TABLE public.integrations TO authenticated;

GRANT INSERT (
  user_id,
  provider,
  display_name,
  enabled,
  config,
  status,
  last_synced_at,
  last_success_at,
  last_failure_at,
  last_message
) ON TABLE public.integrations TO authenticated;

GRANT UPDATE (
  display_name,
  enabled,
  config,
  status,
  last_synced_at,
  last_success_at,
  last_failure_at,
  last_message,
  updated_at
) ON TABLE public.integrations TO authenticated;
