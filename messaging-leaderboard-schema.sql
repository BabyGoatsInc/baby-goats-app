-- Baby Goats Messaging & Leaderboard Schema Extension
-- Advanced Social Features: Live Chat & Messaging + Leaderboards & Rankings

-- 1. Messages table for Live Chat & Messaging System
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'achievement', 'challenge')) DEFAULT 'text',
  read_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure users can't message themselves
  CONSTRAINT different_users CHECK (sender_id != receiver_id)
);

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own messages" ON messages 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their received messages" ON messages 
  FOR UPDATE USING (auth.uid() = receiver_id);

-- 2. Friendships table for social connections
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  initiated_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- Ensure users can't be friends with themselves
  CONSTRAINT different_friends CHECK (user_id != friend_id),
  -- Prevent duplicate friend requests
  UNIQUE(user_id, friend_id)
);

-- RLS Policies for friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their friendships" ON friendships 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON friendships 
  FOR INSERT WITH CHECK (auth.uid() = initiated_by);
CREATE POLICY "Users can update their friendships" ON friendships 
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 3. Notifications table for real-time notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('friend_request', 'friend_accept', 'message', 'achievement', 'challenge', 'leaderboard')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their notifications" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Activity Feed table for social activity
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('achievement', 'challenge_complete', 'goal_reached', 'streak', 'friend_added', 'leaderboard_rank')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for activity_feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public activities are viewable by everyone" ON activity_feed 
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create their own activities" ON activity_feed 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. User Presence table for online status
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('online', 'away', 'offline')) DEFAULT 'offline',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  current_activity TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Presence is viewable by friends" ON user_presence 
  FOR SELECT USING (
    user_id IN (
      SELECT CASE 
        WHEN user_id = auth.uid() THEN friend_id 
        ELSE user_id 
      END
      FROM friendships 
      WHERE (user_id = auth.uid() OR friend_id = auth.uid()) 
      AND status = 'accepted'
    ) OR user_id = auth.uid()
  );
CREATE POLICY "Users can update their own presence" ON user_presence 
  FOR ALL USING (auth.uid() = user_id);

-- 6. Leaderboards table for rankings system
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('points', 'achievements', 'challenges', 'streaks', 'goals')) NOT NULL,
  scope TEXT CHECK (scope IN ('global', 'sport', 'region', 'team')) DEFAULT 'global',
  time_period TEXT CHECK (time_period IN ('daily', 'weekly', 'monthly', 'all_time')) DEFAULT 'all_time',
  sport_filter TEXT,
  region_filter TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for leaderboards
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboards are viewable by everyone" ON leaderboards 
  FOR SELECT USING (is_active = true);

-- 7. Leaderboard Entries table for user rankings
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rank INT NOT NULL,
  score NUMERIC NOT NULL,
  previous_rank INT,
  rank_change INT DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for user per leaderboard per period
  UNIQUE(leaderboard_id, user_id, period_start)
);

-- RLS Policies for leaderboard_entries
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard entries are viewable by everyone" ON leaderboard_entries 
  FOR SELECT USING (true);

-- 8. User Points table for point tracking
CREATE TABLE user_points (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
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

-- RLS Policies for user_points
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User points are viewable by everyone" ON user_points 
  FOR SELECT USING (true);
CREATE POLICY "System can manage user points" ON user_points 
  FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX idx_messages_sender_created ON messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend_status ON friendships(friend_id, status);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_user_created ON activity_feed(user_id, created_at DESC);
CREATE INDEX idx_leaderboard_entries_board_rank ON leaderboard_entries(leaderboard_id, rank);
CREATE INDEX idx_leaderboard_entries_user ON leaderboard_entries(user_id);
CREATE INDEX idx_user_presence_status ON user_presence(status, last_seen DESC);

-- Insert default leaderboards
INSERT INTO leaderboards (name, description, type, scope, time_period) VALUES
('Global Champions', 'Top athletes worldwide based on total points', 'points', 'global', 'all_time'),
('Weekly Warriors', 'This week''s most active athletes', 'points', 'global', 'weekly'),
('Monthly Masters', 'Top performers this month', 'points', 'global', 'monthly'),
('Challenge Champions', 'Athletes who completed the most challenges', 'challenges', 'global', 'all_time'),
('Achievement All-Stars', 'Athletes with the most achievements unlocked', 'achievements', 'global', 'all_time'),
('Streak Superstars', 'Athletes with the longest active streaks', 'streaks', 'global', 'all_time'),
('Basketball Legends', 'Top basketball players globally', 'points', 'sport', 'all_time'),
('Soccer Stars', 'Top soccer players globally', 'points', 'sport', 'all_time'),
('Baseball Bashers', 'Top baseball players globally', 'points', 'sport', 'all_time');

-- Update leaderboards with sport filters
UPDATE leaderboards SET sport_filter = 'basketball' WHERE name = 'Basketball Legends';
UPDATE leaderboards SET sport_filter = 'soccer' WHERE name = 'Soccer Stars';  
UPDATE leaderboards SET sport_filter = 'baseball' WHERE name = 'Baseball Bashers';

-- Initialize user points for existing users
INSERT INTO user_points (user_id, total_points, challenge_points, achievement_points, current_streak)
SELECT 
  id,
  COALESCE((SELECT COUNT(*) * 15 FROM challenge_completions WHERE user_id = profiles.id), 0) as total_points,
  COALESCE((SELECT COUNT(*) * 15 FROM challenge_completions WHERE user_id = profiles.id), 0) as challenge_points,
  25 as achievement_points, -- Base achievement points
  COALESCE((SELECT COUNT(*) FROM challenge_completions WHERE user_id = profiles.id AND completed_at > NOW() - INTERVAL '7 days'), 0) as current_streak
FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- Function to calculate leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings()
RETURNS void AS $$
BEGIN
  -- Update Global Champions (all-time points)
  INSERT INTO leaderboard_entries (leaderboard_id, user_id, rank, score, period_start, period_end)
  SELECT 
    (SELECT id FROM leaderboards WHERE name = 'Global Champions'),
    up.user_id,
    ROW_NUMBER() OVER (ORDER BY up.total_points DESC),
    up.total_points,
    '1970-01-01'::timestamptz,
    '2099-12-31'::timestamptz
  FROM user_points up
  INNER JOIN profiles p ON p.id = up.user_id
  WHERE up.total_points > 0
  ON CONFLICT (leaderboard_id, user_id, period_start) 
  DO UPDATE SET 
    rank = EXCLUDED.rank,
    score = EXCLUDED.score,
    updated_at = NOW();

  -- Update Weekly Warriors
  INSERT INTO leaderboard_entries (leaderboard_id, user_id, rank, score, period_start, period_end)
  SELECT 
    (SELECT id FROM leaderboards WHERE name = 'Weekly Warriors'),
    up.user_id,
    ROW_NUMBER() OVER (ORDER BY weekly_points DESC),
    weekly_points,
    DATE_TRUNC('week', NOW()),
    DATE_TRUNC('week', NOW()) + INTERVAL '1 week'
  FROM (
    SELECT 
      up.user_id,
      COALESCE(SUM(
        CASE WHEN cc.completed_at >= DATE_TRUNC('week', NOW()) THEN c.points ELSE 0 END
      ), 0) as weekly_points
    FROM user_points up
    LEFT JOIN challenge_completions cc ON cc.user_id = up.user_id
    LEFT JOIN challenges c ON c.id = cc.challenge_id
    GROUP BY up.user_id
    HAVING COALESCE(SUM(
      CASE WHEN cc.completed_at >= DATE_TRUNC('week', NOW()) THEN c.points ELSE 0 END
    ), 0) > 0
  ) weekly_data
  INNER JOIN user_points up ON up.user_id = weekly_data.user_id
  ON CONFLICT (leaderboard_id, user_id, period_start) 
  DO UPDATE SET 
    rank = EXCLUDED.rank,
    score = EXCLUDED.score,
    updated_at = NOW();

  -- Update sport-specific leaderboards
  INSERT INTO leaderboard_entries (leaderboard_id, user_id, rank, score, period_start, period_end)
  SELECT 
    l.id,
    up.user_id,
    ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY up.total_points DESC),
    up.total_points,
    '1970-01-01'::timestamptz,
    '2099-12-31'::timestamptz
  FROM user_points up
  INNER JOIN profiles p ON p.id = up.user_id
  INNER JOIN leaderboards l ON l.sport_filter = p.sport
  WHERE up.total_points > 0 AND l.scope = 'sport'
  ON CONFLICT (leaderboard_id, user_id, period_start) 
  DO UPDATE SET 
    rank = EXCLUDED.rank,
    score = EXCLUDED.score,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- Create trigger to update leaderboards when points change
CREATE OR REPLACE FUNCTION trigger_update_leaderboards()
RETURNS trigger AS $$
BEGIN
  -- Update leaderboards when user points change
  PERFORM update_leaderboard_rankings();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaderboards_trigger
  AFTER INSERT OR UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_leaderboards();

-- Function to award points for various activities
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INT,
  p_category TEXT DEFAULT 'general'
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_points (user_id, total_points, challenge_points, achievement_points, social_points, streak_points)
  VALUES (p_user_id, p_points, 
    CASE WHEN p_category = 'challenge' THEN p_points ELSE 0 END,
    CASE WHEN p_category = 'achievement' THEN p_points ELSE 0 END,
    CASE WHEN p_category = 'social' THEN p_points ELSE 0 END,
    CASE WHEN p_category = 'streak' THEN p_points ELSE 0 END
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + p_points,
    challenge_points = user_points.challenge_points + CASE WHEN p_category = 'challenge' THEN p_points ELSE 0 END,
    achievement_points = user_points.achievement_points + CASE WHEN p_category = 'achievement' THEN p_points ELSE 0 END,
    social_points = user_points.social_points + CASE WHEN p_category = 'social' THEN p_points ELSE 0 END,
    streak_points = user_points.streak_points + CASE WHEN p_category = 'streak' THEN p_points ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Populate initial leaderboard data
SELECT update_leaderboard_rankings();

-- Add some sample friendships for testing
INSERT INTO friendships (user_id, friend_id, status, initiated_by, accepted_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accepted', '00000000-0000-0000-0000-000000000001', NOW()),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'accepted', '00000000-0000-0000-0000-000000000001', NOW()),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'accepted', '00000000-0000-0000-0000-000000000002', NOW());

-- Add some sample messages for testing
INSERT INTO messages (sender_id, receiver_id, content, message_type) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hey! Great game yesterday! Your buzzer beater was incredible 🏀', 'text'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Thanks! Your defense in the fourth quarter was what won us the game though 💪', 'text'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Want to practice together this weekend? I could use some help with my footwork', 'text'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Absolutely! Meet at the park courts Saturday morning?', 'text');

-- Add some sample notifications
INSERT INTO notifications (user_id, type, title, message, data) VALUES
('00000000-0000-0000-0000-000000000001', 'friend_accept', 'New Friend!', 'Ryan Thompson accepted your friend request', '{"friend_id": "00000000-0000-0000-0000-000000000002"}'),
('00000000-0000-0000-0000-000000000002', 'message', 'New Message', 'Josh Bradley sent you a message', '{"sender_id": "00000000-0000-0000-0000-000000000001"}'),
('00000000-0000-0000-0000-000000000003', 'leaderboard', 'Rising Star!', 'You moved up 5 spots on the Soccer Stars leaderboard!', '{"leaderboard": "Soccer Stars", "new_rank": 12, "old_rank": 17}');

-- Add sample activity feed items
INSERT INTO activity_feed (user_id, type, title, description, data) VALUES
('00000000-0000-0000-0000-000000000001', 'challenge_complete', 'Challenge Conquered!', 'Completed the "Extra Rep Challenge" and earned 15 points', '{"challenge_id": "challenge_1", "points": 15}'),
('00000000-0000-0000-0000-000000000002', 'streak', 'Streak Master!', 'Reached a 7-day practice streak', '{"streak_days": 7}'),
('00000000-0000-0000-0000-000000000003', 'achievement', 'New Achievement!', 'Unlocked the "Team Player" achievement for helping teammates', '{"achievement_id": "team_player"}'),
('00000000-0000-0000-0000-000000000001', 'leaderboard_rank', 'Leaderboard Climber!', 'Moved up to #3 on the Basketball Legends leaderboard', '{"leaderboard": "Basketball Legends", "rank": 3}'),
('00000000-0000-0000-0000-000000000002', 'friend_added', 'New Connection!', 'Became friends with Maya Rodriguez', '{"friend_id": "00000000-0000-0000-0000-000000000003"}');