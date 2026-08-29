-- Lock down banned_devices: no public reads of the ban list (device ids, names, reasons).
-- Ban checks happen server-side (sendChatServer / checkBanned) with the service role.
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'banned_devices'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.banned_devices', p.policyname);
  END LOOP;
END $$;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.banned_devices FROM anon, authenticated;
GRANT ALL ON public.banned_devices TO service_role;