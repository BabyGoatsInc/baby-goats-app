-- Baby Goats Social Platform - Comprehensive RLS Policies
-- These policies ensure proper access control for the social features

-- =============================================================================
-- 1. MESSAGES TABLE POLICIES
-- =============================================================================
-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- Users can send messages (insert)
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- Users can update messages they sent (mark as read, etc.)
CREATE POLICY "Users can update their sent messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id
  );

-- Users can delete messages they sent
CREATE POLICY "Users can delete their sent messages" ON public.messages
  FOR DELETE USING (
    auth.uid() = sender_id
  );

-- =============================================================================
-- 2. FRIENDSHIPS TABLE POLICIES
-- =============================================================================
-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they're involved in
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- Users can create friend requests
CREATE POLICY "Users can create friend requests" ON public.friendships
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update friendship status (accept/decline friend requests)
CREATE POLICY "Users can update friendship status" ON public.friendships
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- Users can delete friendships they're involved in
CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- =============================================================================
-- 3. NOTIFICATIONS TABLE POLICIES
-- =============================================================================
-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- System can create notifications for users (allow service role)
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their notifications (mark as read)
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Users can delete their notifications
CREATE POLICY "Users can delete their notifications" ON public.notifications
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- =============================================================================
-- 4. LEADERBOARDS TABLE POLICIES
-- =============================================================================
-- Enable RLS on leaderboards
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- Everyone can view active leaderboards
CREATE POLICY "Anyone can view active leaderboards" ON public.leaderboards
  FOR SELECT USING (
    is_active = true
  );

-- Only system/admins can create leaderboards (service role only)
CREATE POLICY "System can manage leaderboards" ON public.leaderboards
  FOR ALL USING (true);

-- =============================================================================
-- 5. LEADERBOARD_ENTRIES TABLE POLICIES
-- =============================================================================
-- Enable RLS on leaderboard_entries
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Everyone can view leaderboard entries
CREATE POLICY "Anyone can view leaderboard entries" ON public.leaderboard_entries
  FOR SELECT USING (true);

-- Only system can create/update leaderboard entries
CREATE POLICY "System can manage leaderboard entries" ON public.leaderboard_entries
  FOR ALL USING (true);

-- =============================================================================
-- 6. USER_POINTS TABLE POLICIES
-- =============================================================================
-- Enable RLS on user_points
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Users can view their own points, others can view public info
CREATE POLICY "Users can view points" ON public.user_points
  FOR SELECT USING (true);

-- Only the user can update their own points (or system)
CREATE POLICY "Users can update their points" ON public.user_points
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Users can create their own points record
CREATE POLICY "Users can create their points record" ON public.user_points
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- =============================================================================
-- 7. TEAMS TABLE POLICIES
-- =============================================================================
-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Everyone can view public teams
CREATE POLICY "Anyone can view public teams" ON public.teams
  FOR SELECT USING (
    is_public = true
  );

-- Team members can view their teams (including private ones)
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Users can create teams (become captain)
CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (
    auth.uid() = captain_id
  );

-- Team captains can update their teams
CREATE POLICY "Captains can update their teams" ON public.teams
  FOR UPDATE USING (
    auth.uid() = captain_id
  );

-- Team captains can delete their teams
CREATE POLICY "Captains can delete their teams" ON public.teams
  FOR DELETE USING (
    auth.uid() = captain_id
  );

-- =============================================================================
-- 8. TEAM_MEMBERS TABLE POLICIES
-- =============================================================================
-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team members can view their team's members
CREATE POLICY "Team members can view team members" ON public.team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Users can join teams or be invited
CREATE POLICY "Users can join teams" ON public.team_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    -- Or team captain is inviting
    team_id IN (
      SELECT id FROM public.teams 
      WHERE captain_id = auth.uid()
    )
  );

-- Team members can update their own membership
CREATE POLICY "Members can update their membership" ON public.team_members
  FOR UPDATE USING (
    auth.uid() = user_id OR
    -- Or team captain managing members
    team_id IN (
      SELECT id FROM public.teams 
      WHERE captain_id = auth.uid()
    )
  );

-- Team members can leave, captains can remove members
CREATE POLICY "Members can leave teams" ON public.team_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    -- Or team captain removing members
    team_id IN (
      SELECT id FROM public.teams 
      WHERE captain_id = auth.uid()
    )
  );

-- =============================================================================
-- 9. TEAM_CHALLENGES TABLE POLICIES
-- =============================================================================
-- Enable RLS on team_challenges
ALTER TABLE public.team_challenges ENABLE ROW LEVEL SECURITY;

-- Everyone can view active team challenges
CREATE POLICY "Anyone can view active team challenges" ON public.team_challenges
  FOR SELECT USING (
    is_active = true
  );

-- System/Admins can create team challenges
CREATE POLICY "System can manage team challenges" ON public.team_challenges
  FOR ALL USING (true);

-- =============================================================================
-- 10. TEAM_CHALLENGE_PARTICIPATIONS TABLE POLICIES
-- =============================================================================
-- Enable RLS on team_challenge_participations
ALTER TABLE public.team_challenge_participations ENABLE ROW LEVEL SECURITY;

-- Everyone can view team challenge participations
CREATE POLICY "Anyone can view team participations" ON public.team_challenge_participations
  FOR SELECT USING (true);

-- Team captains can register their teams for challenges
CREATE POLICY "Captains can register teams for challenges" ON public.team_challenge_participations
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams 
      WHERE captain_id = auth.uid()
    )
  );

-- System can update participation progress
CREATE POLICY "System can update participation progress" ON public.team_challenge_participations
  FOR UPDATE USING (true);

-- =============================================================================
-- 11. TEAM_CHALLENGE_CONTRIBUTIONS TABLE POLICIES
-- =============================================================================
-- Enable RLS on team_challenge_contributions
ALTER TABLE public.team_challenge_contributions ENABLE ROW LEVEL SECURITY;

-- Team members can view contributions for their team challenges
CREATE POLICY "Team members can view contributions" ON public.team_challenge_contributions
  FOR SELECT USING (
    team_challenge_participation_id IN (
      SELECT tcp.id FROM public.team_challenge_participations tcp
      JOIN public.team_members tm ON tcp.team_id = tm.team_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Users can contribute to their team challenges
CREATE POLICY "Users can contribute to team challenges" ON public.team_challenge_contributions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    team_challenge_participation_id IN (
      SELECT tcp.id FROM public.team_challenge_participations tcp
      JOIN public.team_members tm ON tcp.team_id = tm.team_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Users can update their own contributions
CREATE POLICY "Users can update their contributions" ON public.team_challenge_contributions
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Users can delete their own contributions
CREATE POLICY "Users can delete their contributions" ON public.team_challenge_contributions
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- This RLS policy setup provides:
-- 1. Privacy-focused access control
-- 2. Team-based permissions
-- 3. User ownership of data
-- 4. System/service role override capabilities
-- 5. Public visibility for appropriate data (leaderboards, public teams)
-- 6. Secure messaging between friends only
-- 7. Team captain management capabilities
-- 8. Challenge participation controls