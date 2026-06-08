-- Run this in your Supabase SQL Editor to disable RLS
-- This allows our Next.js backend (authenticated via Clerk) to safely manage the database

ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;

-- If you have the api_keys table still hanging around and it was blocking anything:
-- ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
