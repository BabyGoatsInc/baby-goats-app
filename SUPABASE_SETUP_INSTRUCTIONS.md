# 🐐 Baby Goats - Supabase Database Setup

## Step 1: Access Your Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in and select your project
3. Navigate to **SQL Editor** in the left sidebar

## Step 2: Run the Database Schema
Copy and paste this entire SQL script into the SQL Editor and click "Run":

```sql
-- Baby Goats Database Schema
-- Run this in your Supabase SQL Editor to create all tables and RLS policies

-- 1. Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  sport TEXT CHECK (sport IN ('basketball','football','soccer','baseball','tennis','track','gymnastics','swimming','volleyball','wrestling','other')),
  grad_year INT,
  hero_name TEXT,
  hero_reason TEXT,
  avatar_url TEXT,
  age INT CHECK (age >= 8 AND age <= 18),
  team_name TEXT,
  jersey_number TEXT,
  parent_email TEXT,
  is_parent_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- 2. Highlights table
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  likes_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for highlights
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Highlights are viewable by everyone" ON highlights FOR SELECT USING (true);
CREATE POLICY "Users can insert their own highlights" ON highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own highlights" ON highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own highlights" ON highlights FOR DELETE USING (auth.uid() = user_id);

-- 3. Stats table
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stat_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  category TEXT CHECK (category IN ('physical','performance','academic')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for stats
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stats are viewable by everyone" ON stats FOR SELECT USING (true);
CREATE POLICY "Users can manage their own stats" ON stats FOR ALL USING (auth.uid() = user_id);

-- 4. Challenges table
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('resilient','relentless','fearless')) NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')) DEFAULT 'easy',
  points INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges are viewable by everyone" ON challenges FOR SELECT USING (true);

-- 5. Challenge completions table
CREATE TABLE challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, challenge_id, DATE(completed_at))
);

-- RLS Policies for challenge_completions
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Completions viewable by owner" ON challenge_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can complete challenges" ON challenge_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Likes table
CREATE TABLE likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  highlight_id UUID REFERENCES highlights(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, highlight_id)
);

-- RLS Policies for likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- 7. Debug ping table (keep existing or create if missing)
CREATE TABLE IF NOT EXISTS debug_ping (
  id SERIAL PRIMARY KEY,
  note TEXT DEFAULT 'pong',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for debug_ping
ALTER TABLE debug_ping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Debug ping viewable by all" ON debug_ping FOR SELECT USING (true);

-- Insert seed challenges (30+ challenges across all categories)
INSERT INTO challenges (title, description, category, difficulty, points) VALUES
-- Week 1: Foundation building
('Set Your Daily Goal', 'Write down one specific skill you want to improve today and practice it for 15 minutes', 'relentless', 'easy', 10),
('Find Your Why', 'Write a paragraph about why your sport matters to you and what drives your passion', 'fearless', 'easy', 10),
('Morning Routine', 'Create and complete a 10-minute morning routine that prepares you mentally for the day', 'resilient', 'easy', 10),
('Skill Focus', 'Spend 20 minutes working on your weakest fundamental skill', 'relentless', 'easy', 10),
('Positive Self-Talk', 'Replace one negative thought about your performance with a positive affirmation', 'resilient', 'easy', 10),
('Try Something New', 'Attempt a drill or technique you have never tried before', 'fearless', 'easy', 10),
('Weekly Reflection', 'Write about one thing you learned this week and how you will apply it', 'resilient', 'easy', 10),

-- Week 2: Resilience focus
('Bounce Back Challenge', 'After making a mistake in practice, immediately focus on the next play without dwelling', 'resilient', 'medium', 15),
('Failure Journal', 'Write about a recent failure and three things you learned from it', 'resilient', 'medium', 15),
('Pressure Practice', 'Practice your sport skill while someone watches or in a pressure situation', 'resilient', 'medium', 15),
('Comeback Story', 'Research an athlete who overcame adversity and write what inspires you about their journey', 'resilient', 'medium', 15),
('Mental Reset', 'Practice a 2-minute breathing exercise when you feel frustrated during training', 'resilient', 'medium', 15),
('Challenge Accepted', 'Seek out a drill or opponent that challenges you more than usual', 'resilient', 'medium', 15),
('Growth Mindset', 'Turn one "I cannot do this" into "I cannot do this YET" and make a plan', 'resilient', 'medium', 15),

-- Week 3: Relentless effort
('Extra Rep Challenge', 'Do 10 extra repetitions of your most important skill after regular practice', 'relentless', 'medium', 15),
('Consistency Streak', 'Practice the same skill for 7 days in a row, tracking your improvement', 'relentless', 'hard', 20),
('Early Bird Training', 'Wake up 30 minutes earlier to get extra practice time', 'relentless', 'medium', 15),
('Perfect Practice', 'Spend 15 minutes doing slow, perfect repetitions of a basic movement', 'relentless', 'medium', 15),
('No Excuse Day', 'Train at your planned time regardless of weather, mood, or minor obstacles', 'relentless', 'medium', 15),
('Help a Teammate', 'Spend time helping a teammate improve their skills while improving yours', 'relentless', 'medium', 15),
('Video Analysis', 'Record yourself and analyze three things you can improve in your technique', 'relentless', 'hard', 20),

-- Week 4: Fearless growth
('Leadership Moment', 'Take charge of organizing a drill or motivating your team during practice', 'fearless', 'hard', 20),
('Comfort Zone Break', 'Do something in your sport that usually makes you nervous', 'fearless', 'hard', 20),
('Ask for Feedback', 'Approach a coach or experienced player and ask for specific improvement advice', 'fearless', 'medium', 15),
('Public Speaking', 'Share something you learned about your sport with a friend or family member', 'fearless', 'medium', 15),
('Risk Taking', 'Try a more advanced technique or strategy in a low-stakes practice situation', 'fearless', 'hard', 20),
('Mentor Someone', 'Teach a younger or newer player something you have learned', 'fearless', 'medium', 15),
('Dream Big', 'Write down your biggest athletic goal and one concrete step to move toward it today', 'fearless', 'hard', 20),

-- Additional ongoing challenges
('Game Film Study', 'Watch professional athletes in your sport and note three techniques to practice', 'relentless', 'medium', 15),
('Nutrition Focus', 'Plan and eat a performance-focused meal before your next training session', 'resilient', 'easy', 10),
('Team Chemistry', 'Do something to build stronger relationships with your teammates', 'fearless', 'medium', 15),
('Recovery Day', 'Take proper rest and do light stretching or mobility work', 'resilient', 'easy', 10);

-- Insert seed athletes (3 sample athletes for demo)
INSERT INTO profiles (id, full_name, sport, grad_year, hero_name, hero_reason, age, team_name, jersey_number, parent_email, is_parent_approved) VALUES
('00000000-0000-0000-0000-000000000001', 'Josh Bradley', 'basketball', 2027, 'Michael Jordan', 'His relentless work ethic and never-give-up attitude inspire me to push through every challenge', 15, 'Chicago Bulls Academy', '23', 'parent1@example.com', true),
('00000000-0000-0000-0000-000000000002', 'Ryan Thompson', 'baseball', 2030, 'Derek Jeter', 'Captain Clutch always came through when his team needed him most. I want to be that reliable leader', 12, 'Chicago White Sox Youth', '2', 'parent2@example.com', true),
('00000000-0000-0000-0000-000000000003', 'Maya Rodriguez', 'soccer', 2028, 'Megan Rapinoe', 'She uses her platform to make a difference and never backs down from a challenge on or off the field', 14, 'Fire FC Academy', '15', 'parent3@example.com', true);

-- Insert sample highlights
INSERT INTO highlights (user_id, title, video_url, description, is_featured) VALUES
('00000000-0000-0000-0000-000000000001', 'Game Winner vs Rivals', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Buzzer beater to win the championship game against our biggest rivals', true),
('00000000-0000-0000-0000-000000000002', 'Walk-off Home Run', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Bottom of the 9th, bases loaded, down by 2 - this one felt amazing', false),
('00000000-0000-0000-0000-000000000003', 'Hat Trick Performance', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Three goals in the first half to help my team advance to state finals', true);

-- Insert sample stats
INSERT INTO stats (user_id, stat_name, value, unit, category) VALUES
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
('00000000-0000-0000-0000-000000000003', 'GPA', 4.0, 'points', 'academic');

-- Insert sample challenge completions
INSERT INTO challenge_completions (user_id, challenge_id, completed_at, notes) 
SELECT 
    '00000000-0000-0000-0000-000000000001' as user_id,
    id as challenge_id,
    NOW() - INTERVAL '1 day' as completed_at,
    'Completed during morning practice' as notes
FROM challenges 
WHERE category = 'relentless' 
LIMIT 3;
```

## Step 3: Verify Setup
After running the SQL, you should see:
- ✅ 7 new tables created
- ✅ 30+ challenges inserted
- ✅ 3 sample athlete profiles
- ✅ Sample highlights and stats
- ✅ RLS policies enabled

## Step 4: Test the Application
1. Go to your Baby Goats app: http://localhost:3001
2. Click "Debug Panel" to verify database connection
3. Try signing up to test the full flow!

## 🎉 You're Ready!
Your Baby Goats MVP is now fully set up and ready to launch! 🐐