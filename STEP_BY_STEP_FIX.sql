-- Baby Goats Database Schema - STEP BY STEP FIX
-- Run this in separate steps to ensure everything works

-- STEP 1: Add missing columns to profiles table (RUN THIS FIRST)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_parent_approved BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hero_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hero_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jersey_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- STEP 2: Add constraints (only after columns exist)
-- Run this as a separate SQL query after Step 1 completes
DO $$ 
BEGIN
    -- Add email validation constraint (allows NULL emails)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_email') THEN
        ALTER TABLE profiles ADD CONSTRAINT valid_email 
        CHECK (parent_email IS NULL OR parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
    END IF;
    
    -- Add graduation year constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_grad_year') THEN
        ALTER TABLE profiles ADD CONSTRAINT valid_grad_year 
        CHECK (grad_year IS NULL OR grad_year BETWEEN EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(YEAR FROM CURRENT_DATE) + 10);
    END IF;
    
    -- Add full name constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_full_name') THEN
        ALTER TABLE profiles ADD CONSTRAINT valid_full_name 
        CHECK (LENGTH(TRIM(full_name)) > 0);
    END IF;
END $$;

-- STEP 3: Enable RLS and add policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- STEP 4: Create remaining tables
CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
  video_url TEXT NOT NULL CHECK (video_url ~* '^https?://.*'),
  description TEXT,
  likes_count INT DEFAULT 0 CHECK (likes_count >= 0),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stat_name TEXT NOT NULL CHECK (LENGTH(TRIM(stat_name)) > 0),
  value NUMERIC NOT NULL,
  unit TEXT,
  category TEXT CHECK (category IN ('physical','performance','academic')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
  description TEXT NOT NULL CHECK (LENGTH(TRIM(description)) > 0),
  category TEXT CHECK (category IN ('resilient','relentless','fearless')) NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')) DEFAULT 'easy',
  points INT DEFAULT 10 CHECK (points > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  highlight_id UUID REFERENCES highlights(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, highlight_id)
);

-- STEP 5: Add RLS policies for all tables
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Highlights are viewable by everyone" ON highlights;
CREATE POLICY "Highlights are viewable by everyone" ON highlights FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own highlights" ON highlights;
CREATE POLICY "Users can insert their own highlights" ON highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own highlights" ON highlights;
CREATE POLICY "Users can update their own highlights" ON highlights FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own highlights" ON highlights;
CREATE POLICY "Users can delete their own highlights" ON highlights FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stats are viewable by everyone" ON stats;
CREATE POLICY "Stats are viewable by everyone" ON stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own stats" ON stats;
CREATE POLICY "Users can manage their own stats" ON stats FOR ALL USING (auth.uid() = user_id);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON challenges;
CREATE POLICY "Challenges are viewable by everyone" ON challenges FOR SELECT USING (true);

ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Completions viewable by owner" ON challenge_completions;
CREATE POLICY "Completions viewable by owner" ON challenge_completions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can complete challenges" ON challenge_completions;
CREATE POLICY "Users can complete challenges" ON challenge_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
CREATE POLICY "Users can manage their own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- STEP 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_stats_user_id ON stats(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_id ON challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge_id ON challenge_completions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_highlight_id ON likes(highlight_id);
CREATE INDEX IF NOT EXISTS idx_profiles_sport ON profiles(sport);
CREATE INDEX IF NOT EXISTS idx_profiles_grad_year ON profiles(grad_year);
CREATE INDEX IF NOT EXISTS idx_highlights_is_featured ON highlights(is_featured);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active);

-- STEP 7: Create unique index for challenge completions
DROP INDEX IF EXISTS idx_unique_challenge_per_day;
CREATE UNIQUE INDEX idx_unique_challenge_per_day 
ON challenge_completions (user_id, challenge_id, DATE(completed_at));

-- STEP 8: Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_highlight_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE highlights 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.highlight_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE highlights 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.highlight_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- STEP 9: Create triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_likes_count_trigger ON likes;
CREATE TRIGGER update_likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW 
    EXECUTE FUNCTION update_highlight_likes_count();