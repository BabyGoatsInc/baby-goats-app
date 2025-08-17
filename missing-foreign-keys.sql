-- Baby Goats Social Platform - Missing Foreign Key Constraints
-- These foreign keys are needed for the API joins to work properly

-- =============================================================================
-- MESSAGES TABLE FOREIGN KEYS
-- =============================================================================
ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- FRIENDSHIPS TABLE FOREIGN KEYS  
-- =============================================================================
ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_friend_id_fkey 
FOREIGN KEY (friend_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_initiated_by_fkey 
FOREIGN KEY (initiated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- =============================================================================
-- NOTIFICATIONS TABLE FOREIGN KEYS
-- =============================================================================
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- LEADERBOARD_ENTRIES TABLE FOREIGN KEYS
-- =============================================================================
ALTER TABLE public.leaderboard_entries 
ADD CONSTRAINT leaderboard_entries_leaderboard_id_fkey 
FOREIGN KEY (leaderboard_id) REFERENCES public.leaderboards(id) ON DELETE CASCADE;

ALTER TABLE public.leaderboard_entries 
ADD CONSTRAINT leaderboard_entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- USER_POINTS TABLE FOREIGN KEYS
-- =============================================================================
ALTER TABLE public.user_points 
ADD CONSTRAINT user_points_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- TEAMS TABLE FOREIGN KEYS
-- =============================================================================
ALTER TABLE public.teams 
ADD CONSTRAINT teams_captain_id_fkey 
FOREIGN KEY (captain_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- TEAM_MEMBERS TABLE FOREIGN KEYS
-- =============================================================================
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- =============================================================================
-- TEAM_CHALLENGES TABLE FOREIGN KEYS
-- =============================================================================
ALTER TABLE public.team_challenges 
ADD CONSTRAINT team_challenges_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- =============================================================================
-- TEAM_CHALLENGE_PARTICIPATIONS TABLE FOREIGN KEYS
-- =============================================================================
ALTER TABLE public.team_challenge_participations 
ADD CONSTRAINT team_challenge_participations_team_challenge_id_fkey 
FOREIGN KEY (team_challenge_id) REFERENCES public.team_challenges(id) ON DELETE CASCADE;

ALTER TABLE public.team_challenge_participations 
ADD CONSTRAINT team_challenge_participations_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- =============================================================================
-- TEAM_CHALLENGE_CONTRIBUTIONS TABLE FOREIGN KEYS
-- =============================================================================
ALTER TABLE public.team_challenge_contributions 
ADD CONSTRAINT team_challenge_contributions_participation_id_fkey 
FOREIGN KEY (team_challenge_participation_id) REFERENCES public.team_challenge_participations(id) ON DELETE CASCADE;

ALTER TABLE public.team_challenge_contributions 
ADD CONSTRAINT team_challenge_contributions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- MISSING TABLE: TEAM_STATISTICS (Referenced by Teams API)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.team_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  total_members INT DEFAULT 0,
  active_members INT DEFAULT 0,
  total_points INT DEFAULT 0,
  challenges_completed INT DEFAULT 0,
  average_contribution NUMERIC DEFAULT 0,
  ranking_position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT team_statistics_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE
);

-- Enable RLS on team_statistics
ALTER TABLE public.team_statistics ENABLE ROW LEVEL SECURITY;

-- Team statistics policies
CREATE POLICY "Anyone can view team statistics" ON public.team_statistics
  FOR SELECT USING (true);

CREATE POLICY "System can manage team statistics" ON public.team_statistics
  FOR ALL USING (true);

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Check that all foreign keys were created successfully
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE 
  tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('messages', 'friendships', 'notifications', 'leaderboard_entries', 'user_points', 'teams', 'team_members', 'team_challenges', 'team_challenge_participations', 'team_challenge_contributions', 'team_statistics')
ORDER BY tc.table_name;