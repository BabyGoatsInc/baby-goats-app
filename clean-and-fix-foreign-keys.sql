-- Baby Goats Social Platform - Clean Data & Add Foreign Keys
-- First clean up orphaned data, then add foreign key constraints

-- =============================================================================
-- STEP 1: CLEAN ORPHANED DATA
-- =============================================================================

-- Clean notifications table - remove notifications for non-existent users
DELETE FROM public.notifications 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Clean messages table - remove messages from/to non-existent users  
DELETE FROM public.messages 
WHERE sender_id NOT IN (SELECT id FROM public.profiles)
   OR receiver_id NOT IN (SELECT id FROM public.profiles);

-- Clean friendships table - remove friendships with non-existent users
DELETE FROM public.friendships 
WHERE user_id NOT IN (SELECT id FROM public.profiles)
   OR friend_id NOT IN (SELECT id FROM public.profiles);

-- Clean leaderboard_entries table - remove entries for non-existent users
DELETE FROM public.leaderboard_entries 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Clean user_points table - remove points for non-existent users
DELETE FROM public.user_points 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Clean teams table - remove teams with non-existent captains
DELETE FROM public.teams 
WHERE captain_id NOT IN (SELECT id FROM public.profiles);

-- Clean team_members table - remove memberships for non-existent users or teams
DELETE FROM public.team_members 
WHERE user_id NOT IN (SELECT id FROM public.profiles)
   OR team_id NOT IN (SELECT id FROM public.teams);

-- Clean team_challenges table - remove challenges created by non-existent users
UPDATE public.team_challenges 
SET created_by = NULL 
WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM public.profiles);

-- Clean team_challenge_participations table - remove participations for non-existent teams
DELETE FROM public.team_challenge_participations 
WHERE team_id NOT IN (SELECT id FROM public.teams)
   OR team_challenge_id NOT IN (SELECT id FROM public.team_challenges);

-- Clean team_challenge_contributions table - remove contributions from non-existent users
DELETE FROM public.team_challenge_contributions 
WHERE user_id NOT IN (SELECT id FROM public.profiles)
   OR team_challenge_participation_id NOT IN (SELECT id FROM public.team_challenge_participations);

-- =============================================================================
-- STEP 2: ADD FOREIGN KEY CONSTRAINTS (ONLY IF THEY DON'T EXIST)
-- =============================================================================

-- Messages table foreign keys
DO $$
BEGIN
    -- Add sender_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'messages_sender_id_fkey') THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Add receiver_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'messages_receiver_id_fkey') THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_receiver_id_fkey 
        FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Friendships table foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'friendships_user_id_fkey') THEN
        ALTER TABLE public.friendships 
        ADD CONSTRAINT friendships_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'friendships_friend_id_fkey') THEN
        ALTER TABLE public.friendships 
        ADD CONSTRAINT friendships_friend_id_fkey 
        FOREIGN KEY (friend_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'friendships_initiated_by_fkey') THEN
        ALTER TABLE public.friendships 
        ADD CONSTRAINT friendships_initiated_by_fkey 
        FOREIGN KEY (initiated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Notifications table foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'notifications_user_id_fkey') THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Leaderboard entries foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'leaderboard_entries_leaderboard_id_fkey') THEN
        ALTER TABLE public.leaderboard_entries 
        ADD CONSTRAINT leaderboard_entries_leaderboard_id_fkey 
        FOREIGN KEY (leaderboard_id) REFERENCES public.leaderboards(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'leaderboard_entries_user_id_fkey') THEN
        ALTER TABLE public.leaderboard_entries 
        ADD CONSTRAINT leaderboard_entries_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- User points foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'user_points_user_id_fkey') THEN
        ALTER TABLE public.user_points 
        ADD CONSTRAINT user_points_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Teams foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'teams_captain_id_fkey') THEN
        ALTER TABLE public.teams 
        ADD CONSTRAINT teams_captain_id_fkey 
        FOREIGN KEY (captain_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Team members foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_members_team_id_fkey') THEN
        ALTER TABLE public.team_members 
        ADD CONSTRAINT team_members_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_members_user_id_fkey') THEN
        ALTER TABLE public.team_members 
        ADD CONSTRAINT team_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_members_invited_by_fkey') THEN
        ALTER TABLE public.team_members 
        ADD CONSTRAINT team_members_invited_by_fkey 
        FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Team challenges foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_challenges_created_by_fkey') THEN
        ALTER TABLE public.team_challenges 
        ADD CONSTRAINT team_challenges_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Team challenge participations foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_challenge_participations_team_challenge_id_fkey') THEN
        ALTER TABLE public.team_challenge_participations 
        ADD CONSTRAINT team_challenge_participations_team_challenge_id_fkey 
        FOREIGN KEY (team_challenge_id) REFERENCES public.team_challenges(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_challenge_participations_team_id_fkey') THEN
        ALTER TABLE public.team_challenge_participations 
        ADD CONSTRAINT team_challenge_participations_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Team challenge contributions foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_challenge_contributions_participation_id_fkey') THEN
        ALTER TABLE public.team_challenge_contributions 
        ADD CONSTRAINT team_challenge_contributions_participation_id_fkey 
        FOREIGN KEY (team_challenge_participation_id) REFERENCES public.team_challenge_participations(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_challenge_contributions_user_id_fkey') THEN
        ALTER TABLE public.team_challenge_contributions 
        ADD CONSTRAINT team_challenge_contributions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================================================
-- STEP 3: CREATE MISSING TEAM_STATISTICS TABLE
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for team_statistics if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_statistics_team_id_fkey') THEN
        -- First clean any orphaned team statistics
        DELETE FROM public.team_statistics 
        WHERE team_id NOT IN (SELECT id FROM public.teams);
        
        -- Then add the constraint
        ALTER TABLE public.team_statistics
        ADD CONSTRAINT team_statistics_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on team_statistics if not already enabled
ALTER TABLE public.team_statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team_statistics if they don't exist
DO $$
BEGIN
    -- Check if the policy exists before creating it
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view team statistics') THEN
        CREATE POLICY "Anyone can view team statistics" ON public.team_statistics
          FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can manage team statistics') THEN
        CREATE POLICY "System can manage team statistics" ON public.team_statistics
          FOR ALL USING (true);
    END IF;
END $$;

-- =============================================================================
-- STEP 4: VERIFICATION
-- =============================================================================
-- Show summary of foreign keys created
SELECT 
  'Foreign keys successfully created!' as status,
  COUNT(*) as total_foreign_keys
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public'
  AND table_name IN ('messages', 'friendships', 'notifications', 'leaderboard_entries', 'user_points', 'teams', 'team_members', 'team_challenges', 'team_challenge_participations', 'team_challenge_contributions', 'team_statistics');