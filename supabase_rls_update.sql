-- Temporary RLS Policy Updates for MVP Development
-- This allows write operations for all users until proper authentication is implemented

-- Drop existing restrictive policies and create permissive ones

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles; 
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;

CREATE POLICY "Anyone can insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete profiles" ON profiles FOR DELETE USING (true);

-- HIGHLIGHTS TABLE  
DROP POLICY IF EXISTS "Users can insert their own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can update their own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can delete their own highlights" ON highlights;

CREATE POLICY "Anyone can insert highlights" ON highlights FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update highlights" ON highlights FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete highlights" ON highlights FOR DELETE USING (true);

-- STATS TABLE
DROP POLICY IF EXISTS "Users can manage their own stats" ON stats;

CREATE POLICY "Anyone can manage stats" ON stats FOR ALL USING (true);

-- CHALLENGE_COMPLETIONS TABLE
DROP POLICY IF EXISTS "Completions viewable by owner" ON challenge_completions;
DROP POLICY IF EXISTS "Users can complete challenges" ON challenge_completions;

CREATE POLICY "Anyone can view completions" ON challenge_completions FOR SELECT USING (true);
CREATE POLICY "Anyone can complete challenges" ON challenge_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update completions" ON challenge_completions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete completions" ON challenge_completions FOR DELETE USING (true);

-- LIKES TABLE
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;

CREATE POLICY "Anyone can manage likes" ON likes FOR ALL USING (true);

-- Add missing is_featured column to highlights if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='highlights' AND column_name='is_featured') THEN
        ALTER TABLE highlights ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Success message
INSERT INTO debug_ping (note) VALUES ('RLS policies updated for MVP - write operations now allowed');