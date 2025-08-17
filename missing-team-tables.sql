-- Additional Team Challenge Tables for Baby Goats Social Platform
-- These tables are needed to complete the Team Challenges functionality

CREATE TABLE IF NOT EXISTS public.team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT DEFAULT 'collaborative',
  target_value NUMERIC NOT NULL,
  unit TEXT DEFAULT 'points',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  max_teams INT DEFAULT 50,
  rewards JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_challenge_id UUID NOT NULL,
  team_id UUID NOT NULL,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  current_progress NUMERIC DEFAULT 0,
  rank INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_challenge_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_challenge_participation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  contribution_value NUMERIC NOT NULL,
  contribution_date TIMESTAMPTZ DEFAULT NOW(),
  contribution_type TEXT DEFAULT 'manual',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check if all team challenge tables exist
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('team_challenges', 'team_challenge_participations', 'team_challenge_contributions');