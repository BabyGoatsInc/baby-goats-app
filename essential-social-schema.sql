-- Baby Goats Essential Social Features Database Setup
-- Run these SQL commands in Supabase SQL Editor

-- 1. Messages Table (Live Chat & Messaging)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  read_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Friendships Table (Friend System)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  initiated_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id)
);

-- 3. Notifications Table (Real-time Notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Leaderboards Table (Rankings System)
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  scope TEXT DEFAULT 'global',
  time_period TEXT DEFAULT 'all_time',
  sport_filter TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Leaderboard Entries Table (User Rankings)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  rank INT NOT NULL,
  score NUMERIC NOT NULL,
  rank_change INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Points Table (Points System)
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY,
  total_points INT DEFAULT 0,
  challenge_points INT DEFAULT 0,
  achievement_points INT DEFAULT 0,
  social_points INT DEFAULT 0,
  streak_points INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Sample Leaderboards
INSERT INTO leaderboards (name, description, type, scope, time_period) VALUES
  ('Global Champions', 'Top athletes worldwide based on total points', 'points', 'global', 'all_time'),
  ('Weekly Warriors', 'This week''s most active athletes', 'points', 'global', 'weekly'),
  ('Monthly Masters', 'Top performers this month', 'points', 'global', 'monthly'),
  ('Basketball Legends', 'Top basketball players globally', 'points', 'sport', 'all_time'),
  ('Soccer Stars', 'Top soccer players globally', 'points', 'sport', 'all_time')
ON CONFLICT DO NOTHING;

-- 8. Update sport filters for sport-specific leaderboards
UPDATE leaderboards SET sport_filter = 'basketball' WHERE name = 'Basketball Legends';
UPDATE leaderboards SET sport_filter = 'soccer' WHERE name = 'Soccer Stars';

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_board_rank ON leaderboard_entries(leaderboard_id, rank);