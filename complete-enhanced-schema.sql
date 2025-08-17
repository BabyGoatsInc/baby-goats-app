-- Baby Goats Complete Enhanced Social Schema
-- Combines Supabase improvements with our complete feature set
-- Run this AFTER executing Supabase's enhanced schema

-- Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Messages Table (Live Chat & Messaging) - Enhanced Version
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 5000),
  message_type TEXT DEFAULT 'text' 
    CHECK (message_type IN ('text', 'image', 'file', 'system')),
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (sender_id != receiver_id)
);

-- Notifications Table (Real-time Notifications) - Enhanced
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'team_invite', 'challenge_complete', 'achievement_unlock', 'message', 'team_update')),
  title TEXT NOT NULL CHECK (LENGTH(title) <= 200),
  message TEXT NOT NULL CHECK (LENGTH(message) <= 1000),
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboards Table (Rankings System) - Enhanced
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (LENGTH(name) <= 100),
  description TEXT CHECK (LENGTH(description) <= 500),
  type TEXT NOT NULL CHECK (type IN ('points', 'challenges', 'streak', 'team')),
  scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'sport', 'region', 'school')),
  time_period TEXT DEFAULT 'all_time' 
    CHECK (time_period IN ('all_time', 'weekly', 'monthly', 'yearly')),
  sport_filter TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard Entries Table (User Rankings) - Enhanced
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rank INT NOT NULL CHECK (rank > 0),
  score NUMERIC NOT NULL CHECK (score >= 0),
  rank_change INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id)
);

-- User Points Table (Points System) - Enhanced  
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points INT DEFAULT 0 CHECK (total_points >= 0),
  challenge_points INT DEFAULT 0 CHECK (challenge_points >= 0),
  achievement_points INT DEFAULT 0 CHECK (achievement_points >= 0),
  social_points INT DEFAULT 0 CHECK (social_points >= 0),
  streak_points INT DEFAULT 0 CHECK (streak_points >= 0),
  current_streak INT DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INT DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Challenge Participations - Enhanced
CREATE TABLE IF NOT EXISTS team_challenge_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_challenge_id UUID REFERENCES team_challenges(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  
  current_progress NUMERIC DEFAULT 0 CHECK (current_progress >= 0),
  completion_percentage NUMERIC DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  individual_contributions JSONB DEFAULT '{}',
  
  status TEXT CHECK (status IN ('registered', 'active', 'completed', 'failed', 'withdrawn')) 
    DEFAULT 'registered',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  final_score NUMERIC CHECK (final_score >= 0),
  team_rank INT CHECK (team_rank > 0),
  points_earned INT DEFAULT 0 CHECK (points_earned >= 0),
  
  UNIQUE(team_challenge_id, team_id)
);

-- Team Challenge Contributions - Enhanced
CREATE TABLE IF NOT EXISTS team_challenge_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participation_id UUID REFERENCES team_challenge_participations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  contribution_value NUMERIC DEFAULT 0 CHECK (contribution_value >= 0),
  contribution_type TEXT CHECK (LENGTH(contribution_type) <= 100),
  contribution_date TIMESTAMPTZ DEFAULT NOW(),
  
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verification_data JSONB DEFAULT '{}',
  
  notes TEXT CHECK (LENGTH(notes) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Competitions - Enhanced
CREATE TABLE IF NOT EXISTS team_competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (LENGTH(name) <= 200),
  description TEXT CHECK (LENGTH(description) <= 1000),
  competition_type TEXT CHECK (competition_type IN ('tournament', 'league', 'bracket', 'round_robin')) NOT NULL,
  sport TEXT,
  
  max_teams INT CHECK (max_teams BETWEEN 2 AND 64) DEFAULT 16,
  current_teams_count INT DEFAULT 0 CHECK (current_teams_count >= 0),
  bracket_structure JSONB DEFAULT '{}',
  
  team_size_min INT DEFAULT 3 CHECK (team_size_min >= 2),
  team_size_max INT DEFAULT 8 CHECK (team_size_max <= 20),
  eligibility_requirements JSONB DEFAULT '{}',
  
  registration_start TIMESTAMPTZ DEFAULT NOW(),
  registration_end TIMESTAMPTZ,
  competition_start TIMESTAMPTZ,
  competition_end TIMESTAMPTZ,
  
  first_place_points INT DEFAULT 100 CHECK (first_place_points >= 0),
  second_place_points INT DEFAULT 75 CHECK (second_place_points >= 0),
  third_place_points INT DEFAULT 50 CHECK (third_place_points >= 0),
  participation_points INT DEFAULT 20 CHECK (participation_points >= 0),
  
  status TEXT CHECK (status IN ('registration', 'active', 'completed', 'cancelled')) DEFAULT 'registration',
  winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (registration_end > registration_start),
  CHECK (competition_start >= registration_end),
  CHECK (competition_end > competition_start),
  CHECK (team_size_max >= team_size_min)
);

-- Team Competition Registrations - Enhanced
CREATE TABLE IF NOT EXISTS team_competition_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID REFERENCES team_competitions(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  
  registered_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  registration_status TEXT CHECK (registration_status IN ('pending', 'approved', 'rejected', 'withdrawn')) 
    DEFAULT 'pending',
  
  current_round INT DEFAULT 1 CHECK (current_round >= 1),
  wins INT DEFAULT 0 CHECK (wins >= 0),
  losses INT DEFAULT 0 CHECK (losses >= 0),
  total_score NUMERIC DEFAULT 0 CHECK (total_score >= 0),
  final_rank INT CHECK (final_rank > 0),
  
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  
  UNIQUE(competition_id, team_id)
);

-- Team Statistics - Enhanced
CREATE TABLE IF NOT EXISTS team_statistics (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  
  total_members INT DEFAULT 0 CHECK (total_members >= 0),
  active_members INT DEFAULT 0 CHECK (active_members >= 0),
  total_points INT DEFAULT 0 CHECK (total_points >= 0),
  
  challenges_completed INT DEFAULT 0 CHECK (challenges_completed >= 0),
  challenges_won INT DEFAULT 0 CHECK (challenges_won >= 0),
  challenges_failed INT DEFAULT 0 CHECK (challenges_failed >= 0),
  
  competitions_entered INT DEFAULT 0 CHECK (competitions_entered >= 0),
  competitions_won INT DEFAULT 0 CHECK (competitions_won >= 0),
  best_competition_rank INT CHECK (best_competition_rank > 0),
  
  total_messages INT DEFAULT 0 CHECK (total_messages >= 0),
  team_cohesion_score NUMERIC DEFAULT 0 CHECK (team_cohesion_score BETWEEN 0 AND 100),
  
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  streak_days INT DEFAULT 0 CHECK (streak_days >= 0),
  longest_streak INT DEFAULT 0 CHECK (longest_streak >= 0),
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (active_members <= total_members),
  CHECK (longest_streak >= streak_days)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read_at) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_board_rank ON leaderboard_entries(leaderboard_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON leaderboard_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_team_challenge_participations_status ON team_challenge_participations(status, team_challenge_id);
CREATE INDEX IF NOT EXISTS idx_team_challenge_participations_team ON team_challenge_participations(team_id, status);

CREATE INDEX IF NOT EXISTS idx_team_competitions_status_sport ON team_competitions(status, sport);
CREATE INDEX IF NOT EXISTS idx_team_competition_registrations_status ON team_competition_registrations(registration_status);

-- Enhanced Functions

-- Function to update user points efficiently
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id UUID,
  p_challenge_points INT DEFAULT 0,
  p_achievement_points INT DEFAULT 0,
  p_social_points INT DEFAULT 0,
  p_streak_points INT DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_points (
    user_id, 
    challenge_points, 
    achievement_points, 
    social_points, 
    streak_points,
    total_points,
    last_activity,
    updated_at
  ) VALUES (
    p_user_id,
    p_challenge_points,
    p_achievement_points,
    p_social_points,
    p_streak_points,
    p_challenge_points + p_achievement_points + p_social_points + p_streak_points,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    challenge_points = user_points.challenge_points + p_challenge_points,
    achievement_points = user_points.achievement_points + p_achievement_points,
    social_points = user_points.social_points + p_social_points,
    streak_points = user_points.streak_points + p_streak_points,
    total_points = user_points.challenge_points + user_points.achievement_points + user_points.social_points + user_points.streak_points + p_challenge_points + p_achievement_points + p_social_points + p_streak_points,
    last_activity = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all social tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenge_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_competition_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_statistics ENABLE ROW LEVEL SECURITY;

-- Sample Enhanced RLS Policies

-- Messages: Users can see messages they sent or received
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications: Users can only see their own notifications  
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Leaderboards: Public read access, restricted write
CREATE POLICY "Anyone can view leaderboards" ON leaderboards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own leaderboard entries" ON leaderboard_entries
  FOR SELECT USING (true); -- Public leaderboards

-- User Points: Users can view their own points
CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

-- Sample Data for Enhanced Tables

-- Insert sample leaderboards
INSERT INTO leaderboards (name, description, type, scope, time_period) VALUES
  ('Global Champions', 'Top athletes worldwide based on total points', 'points', 'global', 'all_time'),
  ('Weekly Warriors', 'This week''s most active athletes', 'points', 'global', 'weekly'),
  ('Monthly Masters', 'Top performers this month', 'points', 'global', 'monthly'),
  ('Basketball Legends', 'Top basketball players globally', 'points', 'sport', 'all_time'),
  ('Soccer Stars', 'Top soccer players globally', 'points', 'sport', 'all_time')
ON CONFLICT (name) DO NOTHING;

-- Update sport filters for sport-specific leaderboards
UPDATE leaderboards SET sport_filter = 'basketball' WHERE name = 'Basketball Legends';
UPDATE leaderboards SET sport_filter = 'soccer' WHERE name = 'Soccer Stars';

-- Insert sample team challenges (enhanced version)
INSERT INTO team_challenges (title, description, challenge_type, sport, target_metric, target_value, team_points_reward, duration_days, start_date, end_date) VALUES
  (
    'Team Sprint Championship',
    'Work together as a team to complete 100 individual challenges in 7 days. Every team member must contribute!',
    'cumulative',
    'general',
    'total_challenges_completed',
    100,
    75,
    7,
    NOW(),
    NOW() + INTERVAL '7 days'
  ),
  (
    'Basketball Teamwork Challenge',
    'Basketball teams compete to achieve the highest average shooting accuracy. Requires all team members to participate.',
    'competitive', 
    'basketball',
    'average_accuracy_percentage',
    85.0,
    100,
    14,
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '15 days'
  ),
  (
    'Soccer Fitness Relay',
    'Soccer teams take turns completing fitness challenges. Each member must complete their portion before the next can start.',
    'relay',
    'soccer',
    'total_relay_time_minutes',
    120,
    90,
    10,
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '12 days'
  )
ON CONFLICT DO NOTHING;

-- Insert sample competition
INSERT INTO team_competitions (
  name, 
  description, 
  competition_type, 
  sport, 
  registration_start, 
  registration_end, 
  competition_start, 
  competition_end
) VALUES (
  'Baby Goats Championship 2025',
  'The ultimate multi-sport team competition for young athletes!',
  'tournament',
  'general',
  NOW(),
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '21 days', 
  NOW() + INTERVAL '35 days'
) ON CONFLICT DO NOTHING;