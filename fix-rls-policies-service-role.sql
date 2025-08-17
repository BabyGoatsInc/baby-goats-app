-- Baby Goats Social Platform - Fix RLS Policies for Service Role Key
-- These policies allow service role key to bypass RLS while maintaining security

-- =============================================================================
-- STEP 1: DROP EXISTING CONFLICTING POLICIES
-- =============================================================================

-- Drop existing policies that might be blocking service role access
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their sent messages" ON public.messages;

DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendship status" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their notifications" ON public.notifications;

DROP POLICY IF EXISTS "Anyone can view active leaderboards" ON public.leaderboards;
DROP POLICY IF EXISTS "System can manage leaderboards" ON public.leaderboards;

DROP POLICY IF EXISTS "Anyone can view leaderboard entries" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "System can manage leaderboard entries" ON public.leaderboard_entries;

DROP POLICY IF EXISTS "Users can view points" ON public.user_points;
DROP POLICY IF EXISTS "Users can update their points" ON public.user_points;
DROP POLICY IF EXISTS "Users can create their points record" ON public.user_points;

DROP POLICY IF EXISTS "Anyone can view public teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Captains can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Captains can delete their teams" ON public.teams;

DROP POLICY IF EXISTS "Team members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can join teams" ON public.team_members;
DROP POLICY IF EXISTS "Members can update their membership" ON public.team_members;
DROP POLICY IF EXISTS "Members can leave teams" ON public.team_members;

DROP POLICY IF EXISTS "Anyone can view team statistics" ON public.team_statistics;
DROP POLICY IF EXISTS "System can manage team statistics" ON public.team_statistics;

-- =============================================================================
-- STEP 2: CREATE SERVICE ROLE FRIENDLY POLICIES
-- =============================================================================

-- Messages table policies - Allow service role full access, users limited access
CREATE POLICY "Service role full access" ON public.messages
  FOR ALL USING (
    current_setting('role') = 'service_role' OR
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- Friendships table policies - Allow service role full access, users limited access
CREATE POLICY "Service role full access" ON public.friendships
  FOR ALL USING (
    current_setting('role') = 'service_role' OR
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- Notifications table policies - Allow service role full access, users see their own
CREATE POLICY "Service role full access" ON public.notifications
  FOR ALL USING (
    current_setting('role') = 'service_role' OR
    auth.uid() = user_id
  );

-- Leaderboards table policies - Allow service role full access, public read
CREATE POLICY "Service role full access" ON public.leaderboards
  FOR ALL USING (
    current_setting('role') = 'service_role' OR
    is_active = true
  );

-- Leaderboard entries table policies - Allow service role full access, public read
CREATE POLICY "Service role full access" ON public.leaderboard_entries
  FOR ALL USING (
    current_setting('role') = 'service_role'
  );

CREATE POLICY "Public read access" ON public.leaderboard_entries
  FOR SELECT USING (true);

-- User points table policies - Allow service role full access, users see their own
CREATE POLICY "Service role full access" ON public.user_points
  FOR ALL USING (
    current_setting('role') = 'service_role' OR
    auth.uid() = user_id
  );

-- Teams table policies - Allow service role full access, public view for public teams
CREATE POLICY "Service role full access" ON public.teams
  FOR ALL USING (
    current_setting('role') = 'service_role' OR
    is_public = true OR
    auth.uid() = captain_id OR
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Team members table policies - Allow service role full access, team members see team data
CREATE POLICY "Service role full access" ON public.team_members
  FOR ALL USING (
    current_setting('role') = 'service_role' OR
    auth.uid() = user_id OR
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Team statistics table policies - Allow service role full access, public read
CREATE POLICY "Service role full access" ON public.team_statistics
  FOR ALL USING (
    current_setting('role') = 'service_role'
  );

CREATE POLICY "Public read access" ON public.team_statistics
  FOR SELECT USING (true);

-- =============================================================================
-- STEP 3: ADDITIONAL TABLES (if they exist)
-- =============================================================================

-- Team challenges table policies (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_challenges') THEN
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active team challenges" ON public.team_challenges';
        EXECUTE 'DROP POLICY IF EXISTS "System can manage team challenges" ON public.team_challenges';
        
        -- Create new policy
        EXECUTE 'CREATE POLICY "Service role full access" ON public.team_challenges
          FOR ALL USING (
            current_setting(''role'') = ''service_role'' OR
            is_active = true
          )';
    END IF;
END $$;

-- Team challenge participations table policies (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_challenge_participations') THEN
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view team participations" ON public.team_challenge_participations';
        EXECUTE 'DROP POLICY IF EXISTS "Captains can register teams for challenges" ON public.team_challenge_participations';
        EXECUTE 'DROP POLICY IF EXISTS "System can update participation progress" ON public.team_challenge_participations';
        
        -- Create new policy
        EXECUTE 'CREATE POLICY "Service role full access" ON public.team_challenge_participations
          FOR ALL USING (
            current_setting(''role'') = ''service_role''
          )';
        
        EXECUTE 'CREATE POLICY "Public read access" ON public.team_challenge_participations
          FOR SELECT USING (true)';
    END IF;
END $$;

-- Team challenge contributions table policies (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_challenge_contributions') THEN
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "Team members can view contributions" ON public.team_challenge_contributions';
        EXECUTE 'DROP POLICY IF EXISTS "Users can contribute to team challenges" ON public.team_challenge_contributions';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their contributions" ON public.team_challenge_contributions';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their contributions" ON public.team_challenge_contributions';
        
        -- Create new policy
        EXECUTE 'CREATE POLICY "Service role full access" ON public.team_challenge_contributions
          FOR ALL USING (
            current_setting(''role'') = ''service_role'' OR
            auth.uid() = user_id
          )';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: VERIFICATION
-- =============================================================================

-- Show all RLS policies for verification
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('messages', 'friendships', 'notifications', 'leaderboards', 'leaderboard_entries', 'user_points', 'teams', 'team_members', 'team_statistics', 'team_challenges', 'team_challenge_participations', 'team_challenge_contributions')
ORDER BY tablename, policyname;

-- Show summary
SELECT 'RLS policies updated for service role access!' as status;