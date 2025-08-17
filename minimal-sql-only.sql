CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  initiated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL,
  scope TEXT DEFAULT 'global',
  time_period TEXT DEFAULT 'all_time',
  sport_filter TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rank INT NOT NULL,
  score NUMERIC NOT NULL,
  rank_change INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_points (
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

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sport TEXT NOT NULL,
  team_type TEXT DEFAULT 'recreational',
  captain_id UUID NOT NULL,
  max_members INT DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  invite_code TEXT UNIQUE,
  team_image_url TEXT,
  team_color TEXT DEFAULT '#EC1616',
  region TEXT,
  school_name TEXT,
  founded_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID,
  contribution_score INT DEFAULT 0,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.team_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  sport TEXT,
  difficulty_level TEXT DEFAULT 'intermediate',
  min_team_size INT DEFAULT 2,
  max_team_size INT DEFAULT 10,
  required_roles JSONB,
  target_metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  individual_contribution_required BOOLEAN DEFAULT true,
  team_points_reward INT DEFAULT 50,
  individual_points_reward INT DEFAULT 15,
  bonus_points JSONB,
  duration_days INT DEFAULT 7,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_challenge_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_challenge_id UUID NOT NULL,
  team_id UUID NOT NULL,
  current_progress NUMERIC DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0,
  individual_contributions JSONB DEFAULT '{}',
  status TEXT DEFAULT 'registered',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  final_score NUMERIC,
  team_rank INT,
  points_earned INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.team_challenge_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  contribution_value NUMERIC DEFAULT 0,
  contribution_type TEXT,
  contribution_date TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verification_data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  competition_type TEXT NOT NULL,
  sport TEXT,
  max_teams INT DEFAULT 16,
  current_teams_count INT DEFAULT 0,
  bracket_structure JSONB DEFAULT '{}',
  team_size_min INT DEFAULT 3,
  team_size_max INT DEFAULT 8,
  eligibility_requirements JSONB DEFAULT '{}',
  registration_start TIMESTAMPTZ DEFAULT NOW(),
  registration_end TIMESTAMPTZ,
  competition_start TIMESTAMPTZ,
  competition_end TIMESTAMPTZ,
  first_place_points INT DEFAULT 100,
  second_place_points INT DEFAULT 75,
  third_place_points INT DEFAULT 50,
  participation_points INT DEFAULT 20,
  status TEXT DEFAULT 'registration',
  winner_team_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_competition_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL,
  team_id UUID NOT NULL,
  registered_by UUID NOT NULL,
  registration_status TEXT DEFAULT 'pending',
  current_round INT DEFAULT 1,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  final_rank INT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.team_statistics (
  team_id UUID PRIMARY KEY,
  total_members INT DEFAULT 0,
  active_members INT DEFAULT 0,
  total_points INT DEFAULT 0,
  challenges_completed INT DEFAULT 0,
  challenges_won INT DEFAULT 0,
  challenges_failed INT DEFAULT 0,
  competitions_entered INT DEFAULT 0,
  competitions_won INT DEFAULT 0,
  best_competition_rank INT,
  total_messages INT DEFAULT 0,
  team_cohesion_score NUMERIC DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  streak_days INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.leaderboards (name, description, type, scope, time_period) VALUES
  ('Global Champions', 'Top athletes worldwide', 'points', 'global', 'all_time'),
  ('Weekly Warriors', 'Top weekly performers', 'points', 'global', 'weekly'),
  ('Basketball Legends', 'Top basketball players', 'points', 'sport', 'all_time'),
  ('Soccer Stars', 'Top soccer players', 'points', 'sport', 'all_time');
  
SELECT COUNT(*) as table_count FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('messages', 'friendships', 'notifications', 'leaderboards', 'leaderboard_entries', 'user_points', 'teams', 'team_members', 'team_challenges', 'team_challenge_participations', 'team_challenge_contributions', 'team_competitions', 'team_competition_registrations', 'team_statistics');