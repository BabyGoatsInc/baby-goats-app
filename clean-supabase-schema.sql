CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS sport TEXT,
ADD COLUMN IF NOT EXISTS grad_year INT;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    sport_interests TEXT[],
    location TEXT,
    bio TEXT,
    sport TEXT,
    grad_year INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
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

CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'blocked')),
    initiated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'team_invite', 'challenge_complete', 'achievement_unlock', 'message', 'team_update')),
  title TEXT NOT NULL CHECK (LENGTH(title) <= 200),
  message TEXT NOT NULL CHECK (LENGTH(message) <= 1000),
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leaderboards (
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

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID REFERENCES public.leaderboards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rank INT NOT NULL CHECK (rank > 0),
  score NUMERIC NOT NULL CHECK (score >= 0),
  rank_change INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_points (
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

CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sport TEXT NOT NULL,
    team_type TEXT CHECK (team_type IN ('school', 'club', 'recreational', 'competitive')) 
        DEFAULT 'recreational',
    captain_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    max_members INT CHECK (max_members BETWEEN 2 AND 50) DEFAULT 10,
    is_public BOOLEAN DEFAULT true,
    invite_code TEXT UNIQUE,
    team_image_url TEXT,
    team_color TEXT DEFAULT '#EC1616' 
        CHECK (team_color ~ '^#[0-9A-Fa-f]{6}$'),
    region TEXT,
    school_name TEXT,
    founded_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('captain', 'co_captain', 'member', 'pending')) 
        DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, 
    contribution_score INT DEFAULT 0 
        CHECK (contribution_score >= 0),
    status TEXT CHECK (status IN ('active', 'inactive', 'removed')) 
        DEFAULT 'active',
    UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    challenge_type TEXT CHECK (
        challenge_type IN ('collaborative', 'competitive', 'relay', 'cumulative')
    ) NOT NULL,
    sport TEXT,
    difficulty_level TEXT CHECK (
        difficulty_level IN ('beginner', 'intermediate', 'advanced', 'elite')
    ) DEFAULT 'intermediate',
    min_team_size INT CHECK (min_team_size >= 2) DEFAULT 2,
    max_team_size INT CHECK (max_team_size <= 20) DEFAULT 10,
    required_roles JSONB, 
    target_metric TEXT NOT NULL, 
    target_value NUMERIC NOT NULL CHECK (target_value > 0),
    individual_contribution_required BOOLEAN DEFAULT true,
    team_points_reward INT DEFAULT 50 CHECK (team_points_reward >= 0),
    individual_points_reward INT DEFAULT 15 CHECK (individual_points_reward >= 0),
    bonus_points JSONB, 
    duration_days INT CHECK (duration_days BETWEEN 1 AND 365) DEFAULT 7,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ CHECK (end_date > start_date),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_challenge_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_challenge_id UUID REFERENCES public.team_challenges(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.team_challenge_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participation_id UUID REFERENCES public.team_challenge_participations(id) ON DELETE CASCADE NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.team_competitions (
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
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (registration_end > registration_start),
  CHECK (competition_start >= registration_end),
  CHECK (competition_end > competition_start),
  CHECK (team_size_max >= team_size_min)
);

CREATE TABLE IF NOT EXISTS public.team_competition_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID REFERENCES public.team_competitions(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.team_statistics (
  team_id UUID PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON public.messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, read_at) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON public.friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON public.friendships(friend_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_board_rank ON public.leaderboard_entries(leaderboard_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON public.leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_active_type ON public.leaderboards(is_active, type);

CREATE INDEX IF NOT EXISTS idx_teams_sport_region ON public.teams(sport, region);
CREATE INDEX IF NOT EXISTS idx_teams_public ON public.teams(is_public);
CREATE INDEX IF NOT EXISTS idx_team_members_user_status ON public.team_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_team_members_team_status ON public.team_members(team_id, status);

CREATE INDEX IF NOT EXISTS idx_team_challenges_sport_active ON public.team_challenges(sport, is_active);
CREATE INDEX IF NOT EXISTS idx_team_challenges_active_dates ON public.team_challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_team_challenge_participations_status ON public.team_challenge_participations(status, team_challenge_id);
CREATE INDEX IF NOT EXISTS idx_team_challenge_participations_team ON public.team_challenge_participations(team_id, status);

CREATE INDEX IF NOT EXISTS idx_team_competitions_status_sport ON public.team_competitions(status, sport);
CREATE INDEX IF NOT EXISTS idx_team_competition_registrations_status ON public.team_competition_registrations(registration_status);

INSERT INTO public.leaderboards (name, description, type, scope, time_period, sport_filter) VALUES
  ('Global Champions', 'Top athletes worldwide based on total points', 'points', 'global', 'all_time', NULL),
  ('Weekly Warriors', 'This week''s most active athletes', 'points', 'global', 'weekly', NULL),
  ('Monthly Masters', 'Top performers this month', 'points', 'global', 'monthly', NULL),
  ('Basketball Legends', 'Top basketball players globally', 'points', 'sport', 'all_time', 'basketball'),
  ('Soccer Stars', 'Top soccer players globally', 'points', 'sport', 'all_time', 'soccer')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.team_challenges (title, description, challenge_type, sport, target_metric, target_value, team_points_reward, duration_days, start_date, end_date) VALUES
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

INSERT INTO public.team_competitions (
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

SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'messages', 'friendships', 'notifications', 
    'leaderboards', 'leaderboard_entries', 'user_points', 
    'teams', 'team_members', 'team_challenges', 
    'team_challenge_participations', 'team_challenge_contributions',
    'team_competitions', 'team_competition_registrations', 'team_statistics'
  )
ORDER BY tablename;

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'messages', 'friendships', 'notifications', 
        'leaderboards', 'leaderboard_entries', 'user_points', 
        'teams', 'team_members', 'team_challenges', 
        'team_challenge_participations', 'team_challenge_contributions',
        'team_competitions', 'team_competition_registrations', 'team_statistics'
      );

    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'BABY GOATS SOCIAL DATABASE CREATION COMPLETE!';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Tables created: % out of 14 social tables', table_count;
    
    IF table_count >= 14 THEN
        RAISE NOTICE 'SUCCESS: All social tables created successfully!';
        RAISE NOTICE 'Live Chat & Messaging: ENABLED';
        RAISE NOTICE 'Friend System: ENABLED';
        RAISE NOTICE 'Leaderboards & Rankings: ENABLED';
        RAISE NOTICE 'Team Management: ENABLED';
        RAISE NOTICE 'Group Challenges: ENABLED';
        RAISE NOTICE 'Competitions: ENABLED';
        RAISE NOTICE 'Your Baby Goats social platform is now fully functional!';
    ELSE
        RAISE NOTICE 'WARNING: Only % out of 14 tables were created', table_count;
        RAISE NOTICE 'Please check for errors above and re-run if needed';
    END IF;
    
    RAISE NOTICE '====================================================================';
END $$;