-- Baby Goats Group Challenges & Team Competitions Schema
-- Advanced Social Features Phase 2: Team-based challenges and competitions

-- 1. Teams Table - Core team management
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sport TEXT,
  team_type TEXT CHECK (team_type IN ('school', 'club', 'recreational', 'competitive')) DEFAULT 'recreational',
  captain_id UUID NOT NULL, -- References profiles(id)
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

-- 2. Team Members Table - Team membership management
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL, -- References profiles(id)
  role TEXT CHECK (role IN ('captain', 'co_captain', 'member', 'pending')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID, -- References profiles(id)
  contribution_score INT DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'inactive', 'removed')) DEFAULT 'active',
  
  -- Prevent duplicate memberships
  UNIQUE(team_id, user_id)
);

-- 3. Team Challenges Table - Group challenges requiring team collaboration  
CREATE TABLE IF NOT EXISTS team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT CHECK (challenge_type IN ('collaborative', 'competitive', 'relay', 'cumulative')) NOT NULL,
  sport TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'elite')) DEFAULT 'intermediate',
  
  -- Team requirements
  min_team_size INT DEFAULT 2,
  max_team_size INT DEFAULT 10,
  required_roles JSONB, -- e.g., ["captain", "2_members"]
  
  -- Challenge mechanics
  target_metric TEXT NOT NULL, -- e.g., "total_points", "average_time", "completion_count"
  target_value NUMERIC NOT NULL,
  individual_contribution_required BOOLEAN DEFAULT true,
  
  -- Rewards and points
  team_points_reward INT DEFAULT 50,
  individual_points_reward INT DEFAULT 15,
  bonus_points JSONB, -- Additional rewards for exceptional performance
  
  -- Timing
  duration_days INT DEFAULT 7,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID, -- References profiles(id) - challenge creator
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Team Challenge Participations Table - Track which teams are participating
CREATE TABLE IF NOT EXISTS team_challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_challenge_id UUID REFERENCES team_challenges(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  
  -- Progress tracking
  current_progress NUMERIC DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0,
  individual_contributions JSONB, -- Track each member's contribution
  
  -- Status and timing
  status TEXT CHECK (status IN ('registered', 'active', 'completed', 'failed', 'withdrawn')) DEFAULT 'registered',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results
  final_score NUMERIC,
  team_rank INT,
  points_earned INT DEFAULT 0,
  
  -- Prevent duplicate participations
  UNIQUE(team_challenge_id, team_id)
);

-- 5. Individual Contributions Table - Track each team member's contributions
CREATE TABLE IF NOT EXISTS team_challenge_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id UUID REFERENCES team_challenge_participations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL, -- References profiles(id)
  
  -- Contribution tracking
  contribution_value NUMERIC DEFAULT 0,
  contribution_type TEXT, -- e.g., "distance_run", "challenges_completed", "points_earned"
  contribution_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID, -- References profiles(id)
  verification_data JSONB, -- Supporting evidence/data
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Team Competitions Table - Inter-team tournaments and competitions
CREATE TABLE IF NOT EXISTS team_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  competition_type TEXT CHECK (competition_type IN ('tournament', 'league', 'bracket', 'round_robin')) NOT NULL,
  sport TEXT,
  
  -- Competition structure
  max_teams INT DEFAULT 16,
  current_teams_count INT DEFAULT 0,
  bracket_structure JSONB, -- Tournament bracket information
  
  -- Rules and requirements
  team_size_min INT DEFAULT 3,
  team_size_max INT DEFAULT 8,
  eligibility_requirements JSONB, -- Age, skill level, region requirements
  
  -- Timing
  registration_start TIMESTAMPTZ DEFAULT NOW(),
  registration_end TIMESTAMPTZ,
  competition_start TIMESTAMPTZ,
  competition_end TIMESTAMPTZ,
  
  -- Rewards
  first_place_points INT DEFAULT 100,
  second_place_points INT DEFAULT 75,
  third_place_points INT DEFAULT 50,
  participation_points INT DEFAULT 20,
  
  -- Status
  status TEXT CHECK (status IN ('registration', 'active', 'completed', 'cancelled')) DEFAULT 'registration',
  winner_team_id UUID REFERENCES teams(id),
  
  -- Metadata
  created_by UUID, -- References profiles(id)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Team Competition Registrations Table
CREATE TABLE IF NOT EXISTS team_competition_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES team_competitions(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  
  -- Registration info
  registered_by UUID NOT NULL, -- References profiles(id) - must be team captain
  registration_status TEXT CHECK (registration_status IN ('pending', 'approved', 'rejected', 'withdrawn')) DEFAULT 'pending',
  
  -- Competition performance
  current_round INT DEFAULT 1,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  final_rank INT,
  
  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  
  -- Prevent duplicate registrations
  UNIQUE(competition_id, team_id)
);

-- 8. Team Statistics Table - Aggregate team performance metrics
CREATE TABLE IF NOT EXISTS team_statistics (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Basic stats
  total_members INT DEFAULT 0,
  active_members INT DEFAULT 0,
  total_points INT DEFAULT 0,
  
  -- Challenge performance
  challenges_completed INT DEFAULT 0,
  challenges_won INT DEFAULT 0,
  challenges_failed INT DEFAULT 0,
  
  -- Competition performance  
  competitions_entered INT DEFAULT 0,
  competitions_won INT DEFAULT 0,
  best_competition_rank INT,
  
  -- Social metrics
  total_messages INT DEFAULT 0,
  team_cohesion_score NUMERIC DEFAULT 0, -- Calculated metric
  
  -- Activity metrics
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  streak_days INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  
  -- Updated tracking
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_sport ON teams(sport);
CREATE INDEX IF NOT EXISTS idx_teams_region ON teams(region);
CREATE INDEX IF NOT EXISTS idx_teams_public ON teams(is_public);
CREATE INDEX IF NOT EXISTS idx_team_members_team_status ON team_members(team_id, status);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_challenges_active ON team_challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_team_challenges_sport ON team_challenges(sport);
CREATE INDEX IF NOT EXISTS idx_team_challenge_participations_status ON team_challenge_participations(status);
CREATE INDEX IF NOT EXISTS idx_team_competitions_status ON team_competitions(status);
CREATE INDEX IF NOT EXISTS idx_team_competition_registrations_status ON team_competition_registrations(registration_status);

-- Insert sample team challenges
INSERT INTO team_challenges (title, description, challenge_type, sport, target_metric, target_value, team_points_reward, duration_days) VALUES
  (
    'Team Sprint Championship',
    'Work together as a team to complete 100 individual challenges in 7 days. Every team member must contribute!',
    'cumulative',
    'general',
    'total_challenges_completed',
    100,
    75,
    7
  ),
  (
    'Basketball Teamwork Challenge',
    'Basketball teams compete to achieve the highest average shooting accuracy. Requires all team members to participate.',
    'competitive', 
    'basketball',
    'average_accuracy_percentage',
    85.0,
    100,
    14
  ),
  (
    'Soccer Fitness Relay',
    'Soccer teams take turns completing fitness challenges. Each member must complete their portion before the next can start.',
    'relay',
    'soccer',
    'total_relay_time_minutes',
    120,
    90,
    10
  ),
  (
    'Cross-Training Collaboration',
    'Multi-sport teams work together on various training challenges. Builds teamwork across different sports.',
    'collaborative',
    'general',
    'team_collaboration_score',
    500,
    80,
    21
  );

-- Insert sample teams
INSERT INTO teams (name, description, sport, team_type, captain_id, invite_code, region, school_name) VALUES
  ('Thunder Bolts', 'Elite basketball team focused on championship-level training', 'basketball', 'competitive', '00000000-0000-0000-0000-000000000001', 'THUNDER2024', 'California', 'Lincoln High School'),
  ('Soccer Strikers', 'Passionate soccer players building skills and friendships', 'soccer', 'school', '00000000-0000-0000-0000-000000000002', 'STRIKE24', 'Texas', 'Roosevelt Middle School'),
  ('All-Stars United', 'Multi-sport team for athletes who love all kinds of challenges', 'general', 'recreational', '00000000-0000-0000-0000-000000000003', 'ALLSTAR', 'New York', 'Washington Academy'),
  ('Elite Runners', 'Track and field team dedicated to running excellence', 'track', 'club', '00000000-0000-0000-0000-000000000001', 'RUNNER24', 'Florida', 'Miami Athletics Club');

-- Insert sample team memberships
INSERT INTO team_members (team_id, user_id, role) VALUES
  ((SELECT id FROM teams WHERE name = 'Thunder Bolts'), '00000000-0000-0000-0000-000000000001', 'captain'),
  ((SELECT id FROM teams WHERE name = 'Thunder Bolts'), '00000000-0000-0000-0000-000000000002', 'member'),
  ((SELECT id FROM teams WHERE name = 'Thunder Bolts'), '00000000-0000-0000-0000-000000000003', 'member'),
  ((SELECT id FROM teams WHERE name = 'Soccer Strikers'), '00000000-0000-0000-0000-000000000002', 'captain'),
  ((SELECT id FROM teams WHERE name = 'Soccer Strikers'), '00000000-0000-0000-0000-000000000003', 'co_captain'),
  ((SELECT id FROM teams WHERE name = 'All-Stars United'), '00000000-0000-0000-0000-000000000003', 'captain');

-- Functions for team management

-- Function to update team statistics
CREATE OR REPLACE FUNCTION update_team_statistics()
RETURNS void AS $$
BEGIN
  -- Update team member counts and statistics
  INSERT INTO team_statistics (
    team_id, 
    total_members, 
    active_members,
    updated_at
  )
  SELECT 
    t.id,
    COALESCE(tm_total.member_count, 0) as total_members,
    COALESCE(tm_active.active_count, 0) as active_members,
    NOW()
  FROM teams t
  LEFT JOIN (
    SELECT team_id, COUNT(*) as member_count
    FROM team_members 
    GROUP BY team_id
  ) tm_total ON tm_total.team_id = t.id
  LEFT JOIN (
    SELECT team_id, COUNT(*) as active_count
    FROM team_members 
    WHERE status = 'active'
    GROUP BY team_id
  ) tm_active ON tm_active.team_id = t.id
  ON CONFLICT (team_id) 
  DO UPDATE SET 
    total_members = EXCLUDED.total_members,
    active_members = EXCLUDED.active_members,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate team challenge progress
CREATE OR REPLACE FUNCTION calculate_team_challenge_progress(
  p_participation_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_progress NUMERIC DEFAULT 0;
  v_target_value NUMERIC;
  v_current_progress NUMERIC;
BEGIN
  -- Get target value and current progress
  SELECT 
    tc.target_value,
    tcp.current_progress
  INTO v_target_value, v_current_progress
  FROM team_challenge_participations tcp
  JOIN team_challenges tc ON tc.id = tcp.team_challenge_id
  WHERE tcp.id = p_participation_id;
  
  -- Calculate progress percentage
  IF v_target_value > 0 THEN
    v_progress = (v_current_progress / v_target_value) * 100;
    v_progress = LEAST(v_progress, 100); -- Cap at 100%
  END IF;
  
  -- Update the participation record
  UPDATE team_challenge_participations 
  SET 
    completion_percentage = v_progress,
    updated_at = NOW(),
    status = CASE 
      WHEN v_progress >= 100 THEN 'completed'
      WHEN v_progress > 0 THEN 'active'
      ELSE status
    END
  WHERE id = p_participation_id;
  
  RETURN v_progress;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update team statistics when team members change
CREATE OR REPLACE FUNCTION trigger_update_team_stats()
RETURNS trigger AS $$
BEGIN
  PERFORM update_team_statistics();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_team_stats();

-- Update team statistics initially
SELECT update_team_statistics();