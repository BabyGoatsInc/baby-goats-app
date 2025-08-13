-- Baby Goats Database Schema - COMPLETE MIGRATION FIX
-- Handles missing columns and existing tables properly

-- 1. First, ensure all required columns exist in profiles table
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'parent_email') THEN
        ALTER TABLE profiles ADD COLUMN parent_email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_parent_approved') THEN
        ALTER TABLE profiles ADD COLUMN is_parent_approved BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'hero_name') THEN
        ALTER TABLE profiles ADD COLUMN hero_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'hero_reason') THEN
        ALTER TABLE profiles ADD COLUMN hero_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'team_name') THEN
        ALTER TABLE profiles ADD COLUMN team_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'jersey_number') THEN
        ALTER TABLE profiles ADD COLUMN jersey_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Now add constraints safely (after ensuring columns exist)
DO $$ 
BEGIN
    -- Add email validation constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_email') THEN
        ALTER TABLE profiles ADD CONSTRAINT valid_email 
        CHECK (parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
    END IF;
    
    -- Add graduation year constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_grad_year') THEN
        ALTER TABLE profiles ADD CONSTRAINT valid_grad_year 
        CHECK (grad_year BETWEEN EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(YEAR FROM CURRENT_DATE) + 10);
    END IF;
    
    -- Add full name constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_full_name') THEN
        ALTER TABLE profiles ADD CONSTRAINT valid_full_name 
        CHECK (LENGTH(TRIM(full_name)) > 0);
    END IF;
    
    -- Add age constraint if missing
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_age_check') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_age_check 
        CHECK (age >= 8 AND age <= 18);
    END IF;
    
    -- Add sport constraint if missing
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_sport_check') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_sport_check 
        CHECK (sport IN ('basketball','football','soccer','baseball','tennis','track','gymnastics','swimming','volleyball','wrestling','other'));
    END IF;
END $$;

-- 3. RLS Policies for profiles (safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- 4. Create highlights table (if not exists)
CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  likes_count INT DEFAULT 0 CHECK (likes_count >= 0),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add highlights constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_title') THEN
        ALTER TABLE highlights ADD CONSTRAINT valid_title 
        CHECK (LENGTH(TRIM(title)) > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_video_url') THEN
        ALTER TABLE highlights ADD CONSTRAINT valid_video_url 
        CHECK (video_url ~* '^https?://.*');
    END IF;
END $$;

-- RLS Policies for highlights
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Highlights are viewable by everyone" ON highlights;
CREATE POLICY "Highlights are viewable by everyone" ON highlights FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own highlights" ON highlights;
CREATE POLICY "Users can insert their own highlights" ON highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own highlights" ON highlights;
CREATE POLICY "Users can update their own highlights" ON highlights FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own highlights" ON highlights;
CREATE POLICY "Users can delete their own highlights" ON highlights FOR DELETE USING (auth.uid() = user_id);

-- 5. Create stats table
CREATE TABLE IF NOT EXISTS stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stat_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  category TEXT CHECK (category IN ('physical','performance','academic')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add stats constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_stat_name') THEN
        ALTER TABLE stats ADD CONSTRAINT valid_stat_name 
        CHECK (LENGTH(TRIM(stat_name)) > 0);
    END IF;
END $$;

-- RLS Policies for stats
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stats are viewable by everyone" ON stats;
CREATE POLICY "Stats are viewable by everyone" ON stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own stats" ON stats;
CREATE POLICY "Users can manage their own stats" ON stats FOR ALL USING (auth.uid() = user_id);

-- 6. Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('resilient','relentless','fearless')) NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')) DEFAULT 'easy',
  points INT DEFAULT 10 CHECK (points > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add challenges constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_challenge_title') THEN
        ALTER TABLE challenges ADD CONSTRAINT valid_challenge_title 
        CHECK (LENGTH(TRIM(title)) > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_challenge_description') THEN
        ALTER TABLE challenges ADD CONSTRAINT valid_challenge_description 
        CHECK (LENGTH(TRIM(description)) > 0);
    END IF;
END $$;

-- RLS Policies for challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON challenges;
CREATE POLICY "Challenges are viewable by everyone" ON challenges FOR SELECT USING (true);

-- 7. Create challenge completions table
CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Create unique index (safe)
DROP INDEX IF EXISTS idx_unique_challenge_per_day;
CREATE UNIQUE INDEX idx_unique_challenge_per_day 
ON challenge_completions (user_id, challenge_id, DATE(completed_at));

-- RLS Policies for challenge_completions
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Completions viewable by owner" ON challenge_completions;
CREATE POLICY "Completions viewable by owner" ON challenge_completions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can complete challenges" ON challenge_completions;
CREATE POLICY "Users can complete challenges" ON challenge_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Create likes table
CREATE TABLE IF NOT EXISTS likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  highlight_id UUID REFERENCES highlights(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, highlight_id)
);

-- RLS Policies for likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
CREATE POLICY "Users can manage their own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- 9. Create debug ping table
CREATE TABLE IF NOT EXISTS debug_ping (
  id SERIAL PRIMARY KEY,
  note TEXT DEFAULT 'pong',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for debug_ping
ALTER TABLE debug_ping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Debug ping viewable by all" ON debug_ping;
CREATE POLICY "Debug ping viewable by all" ON debug_ping FOR SELECT USING (true);

-- 10. PERFORMANCE INDEXES (safe creation)
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_stats_user_id ON stats(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_id ON challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge_id ON challenge_completions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_highlight_id ON likes(highlight_id);

-- ADDITIONAL PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_sport ON profiles(sport);
CREATE INDEX IF NOT EXISTS idx_profiles_grad_year ON profiles(grad_year);
CREATE INDEX IF NOT EXISTS idx_highlights_is_featured ON highlights(is_featured);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active);

-- 11. TRIGGER FUNCTIONS (safe replacement)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGER: Auto-update profiles.updated_at (safe)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- FUNCTION: Update highlight likes count (safe replacement)
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

-- TRIGGER: Auto-update likes count on highlights (safe)
DROP TRIGGER IF EXISTS update_likes_count_trigger ON likes;
CREATE TRIGGER update_likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW 
    EXECUTE FUNCTION update_highlight_likes_count();

-- 12. Insert seed challenges (only if challenges table is empty)
INSERT INTO challenges (title, description, category, difficulty, points) 
SELECT * FROM (VALUES
    ('Set Your Daily Goal', 'Write down one specific skill you want to improve today and practice it for 15 minutes', 'relentless', 'easy', 10),
    ('Find Your Why', 'Write a paragraph about why your sport matters to you and what drives your passion', 'fearless', 'easy', 10),
    ('Morning Routine', 'Create and complete a 10-minute morning routine that prepares you mentally for the day', 'resilient', 'easy', 10),
    ('Skill Focus', 'Spend 20 minutes working on your weakest fundamental skill', 'relentless', 'easy', 10),
    ('Positive Self-Talk', 'Replace one negative thought about your performance with a positive affirmation', 'resilient', 'easy', 10),
    ('Try Something New', 'Attempt a drill or technique you have never tried before', 'fearless', 'easy', 10),
    ('Weekly Reflection', 'Write about one thing you learned this week and how you will apply it', 'resilient', 'easy', 10),
    ('Bounce Back Challenge', 'After making a mistake in practice, immediately focus on the next play without dwelling', 'resilient', 'medium', 15),
    ('Failure Journal', 'Write about a recent failure and three things you learned from it', 'resilient', 'medium', 15),
    ('Pressure Practice', 'Practice your sport skill while someone watches or in a pressure situation', 'resilient', 'medium', 15),
    ('Comeback Story', 'Research an athlete who overcame adversity and write what inspires you about their journey', 'resilient', 'medium', 15),
    ('Mental Reset', 'Practice a 2-minute breathing exercise when you feel frustrated during training', 'resilient', 'medium', 15),
    ('Challenge Accepted', 'Seek out a drill or opponent that challenges you more than usual', 'resilient', 'medium', 15),
    ('Growth Mindset', 'Turn one "I cannot do this" into "I cannot do this YET" and make a plan', 'resilient', 'medium', 15),
    ('Extra Rep Challenge', 'Do 10 extra repetitions of your most important skill after regular practice', 'relentless', 'medium', 15),
    ('Consistency Streak', 'Practice the same skill for 7 days in a row, tracking your improvement', 'relentless', 'hard', 20),
    ('Early Bird Training', 'Wake up 30 minutes earlier to get extra practice time', 'relentless', 'medium', 15),
    ('Perfect Practice', 'Spend 15 minutes doing slow, perfect repetitions of a basic movement', 'relentless', 'medium', 15),
    ('No Excuse Day', 'Train at your planned time regardless of weather, mood, or minor obstacles', 'relentless', 'medium', 15),
    ('Help a Teammate', 'Spend time helping a teammate improve their skills while improving yours', 'relentless', 'medium', 15),
    ('Video Analysis', 'Record yourself and analyze three things you can improve in your technique', 'relentless', 'hard', 20),
    ('Leadership Moment', 'Take charge of organizing a drill or motivating your team during practice', 'fearless', 'hard', 20),
    ('Comfort Zone Break', 'Do something in your sport that usually makes you nervous', 'fearless', 'hard', 20),
    ('Ask for Feedback', 'Approach a coach or experienced player and ask for specific improvement advice', 'fearless', 'medium', 15),
    ('Public Speaking', 'Share something you learned about your sport with a friend or family member', 'fearless', 'medium', 15),
    ('Risk Taking', 'Try a more advanced technique or strategy in a low-stakes practice situation', 'fearless', 'hard', 20),
    ('Mentor Someone', 'Teach a younger or newer player something you have learned', 'fearless', 'medium', 15),
    ('Dream Big', 'Write down your biggest athletic goal and one concrete step to move toward it today', 'fearless', 'hard', 20),
    ('Game Film Study', 'Watch professional athletes in your sport and note three techniques to practice', 'relentless', 'medium', 15),
    ('Nutrition Focus', 'Plan and eat a performance-focused meal before your next training session', 'resilient', 'easy', 10),
    ('Team Chemistry', 'Do something to build stronger relationships with your teammates', 'fearless', 'medium', 15),
    ('Recovery Day', 'Take proper rest and do light stretching or mobility work', 'resilient', 'easy', 10)
) AS v(title, description, category, difficulty, points)
WHERE NOT EXISTS (SELECT 1 FROM challenges LIMIT 1);

-- 13. Insert seed athletes (only if not already present)
INSERT INTO profiles (id, full_name, sport, grad_year, hero_name, hero_reason, age, team_name, jersey_number, parent_email, is_parent_approved) 
SELECT * FROM (VALUES
    ('00000000-0000-0000-0000-000000000001', 'Josh Bradley', 'basketball', 2027, 'Michael Jordan', 'His relentless work ethic and never-give-up attitude inspire me to push through every challenge', 15, 'Chicago Bulls Academy', '23', 'parent1@example.com', true),
    ('00000000-0000-0000-0000-000000000002', 'Ryan Thompson', 'baseball', 2030, 'Derek Jeter', 'Captain Clutch always came through when his team needed him most. I want to be that reliable leader', 12, 'Chicago White Sox Youth', '2', 'parent2@example.com', true),
    ('00000000-0000-0000-0000-000000000003', 'Maya Rodriguez', 'soccer', 2028, 'Megan Rapinoe', 'She uses her platform to make a difference and never backs down from a challenge on or off the field', 14, 'Fire FC Academy', '15', 'parent3@example.com', true)
) AS v(id, full_name, sport, grad_year, hero_name, hero_reason, age, team_name, jersey_number, parent_email, is_parent_approved)
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001');

-- 14. Insert sample highlights (only if not already present)
INSERT INTO highlights (user_id, title, video_url, description, is_featured) 
SELECT * FROM (VALUES
    ('00000000-0000-0000-0000-000000000001', 'Game Winner vs Rivals', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Buzzer beater to win the championship game against our biggest rivals', true),
    ('00000000-0000-0000-0000-000000000002', 'Walk-off Home Run', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Bottom of the 9th, bases loaded, down by 2 - this one felt amazing', false),
    ('00000000-0000-0000-0000-000000000003', 'Hat Trick Performance', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Three goals in the first half to help my team advance to state finals', true)
) AS v(user_id, title, video_url, description, is_featured)
WHERE NOT EXISTS (SELECT 1 FROM highlights WHERE user_id = '00000000-0000-0000-0000-000000000001');

-- 15. Insert sample stats (only if not already present)
INSERT INTO stats (user_id, stat_name, value, unit, category) 
SELECT * FROM (VALUES
    ('00000000-0000-0000-0000-000000000001', 'Points Per Game', 18.5, 'PPG', 'performance'),
    ('00000000-0000-0000-0000-000000000001', 'Field Goal Percentage', 47.2, '%', 'performance'),
    ('00000000-0000-0000-0000-000000000001', 'Height', 6.2, 'feet', 'physical'),
    ('00000000-0000-0000-0000-000000000001', 'Vertical Jump', 32, 'inches', 'physical'),
    ('00000000-0000-0000-0000-000000000001', 'GPA', 3.8, 'points', 'academic'),
    ('00000000-0000-0000-0000-000000000002', 'Batting Average', 0.345, 'avg', 'performance'),
    ('00000000-0000-0000-0000-000000000002', 'Home Runs', 12, 'HR', 'performance'),
    ('00000000-0000-0000-0000-000000000002', 'Speed to First', 4.2, 'seconds', 'physical'),
    ('00000000-0000-0000-0000-000000000002', 'GPA', 3.9, 'points', 'academic'),
    ('00000000-0000-0000-0000-000000000003', 'Goals Scored', 24, 'goals', 'performance'),
    ('00000000-0000-0000-0000-000000000003', 'Sprint Speed', 7.1, 'mph', 'physical'),
    ('00000000-0000-0000-0000-000000000003', 'GPA', 4.0, 'points', 'academic')
) AS v(user_id, stat_name, value, unit, category)
WHERE NOT EXISTS (SELECT 1 FROM stats WHERE user_id = '00000000-0000-0000-0000-000000000001');