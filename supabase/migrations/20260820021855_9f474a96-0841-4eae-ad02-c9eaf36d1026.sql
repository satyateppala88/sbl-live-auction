DROP POLICY IF EXISTS "player-photos public read" ON storage.objects;
CREATE POLICY "player-photos public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'player-photos');

-- Writes are server-side only: the service role (supabaseAdmin) uploads photos
-- from authenticated server functions and bypasses RLS, so no anon/authenticated
-- write policy exists. These explicit service_role policies document intent.
DROP POLICY IF EXISTS "player-photos service-role insert" ON storage.objects;
CREATE POLICY "player-photos service-role insert"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'player-photos');

DROP POLICY IF EXISTS "player-photos service-role update" ON storage.objects;
CREATE POLICY "player-photos service-role update"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'player-photos')
WITH CHECK (bucket_id = 'player-photos');

DROP POLICY IF EXISTS "player-photos service-role delete" ON storage.objects;
CREATE POLICY "player-photos service-role delete"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'player-photos');