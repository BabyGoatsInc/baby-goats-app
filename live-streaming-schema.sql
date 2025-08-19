-- Live Broadcasting System Database Schema
-- Creates tables for live streaming, viewer management, and stream chat

-- 1. Live Streams Table
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    streamer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'live', 'ended', 'scheduled')),
    viewer_count INTEGER DEFAULT 0,
    max_viewers INTEGER DEFAULT 0,
    stream_key TEXT UNIQUE NOT NULL,
    stream_url TEXT NOT NULL,
    thumbnail_url TEXT,
    chat_enabled BOOLEAN DEFAULT true,
    is_private BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Stream Viewers Table
CREATE TABLE IF NOT EXISTS stream_viewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    total_watch_time INTEGER DEFAULT 0, -- in seconds
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(user_id, stream_id, joined_at) -- Allow multiple viewing sessions for same user/stream
);

-- 3. Stream Chat Messages Table
CREATE TABLE IF NOT EXISTS stream_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'system', 'special')),
    is_highlighted BOOLEAN DEFAULT false,
    is_moderator BOOLEAN DEFAULT false,
    moderation_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_streams_streamer_id ON live_streams(streamer_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_category ON live_streams(category);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_at ON live_streams(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stream_viewers_user_id ON stream_viewers(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_active ON stream_viewers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stream_viewers_joined_at ON stream_viewers(joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_stream_chat_stream_id ON stream_chat_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_chat_user_id ON stream_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_chat_created_at ON stream_chat_messages(created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat_messages ENABLE ROW LEVEL SECURITY;

-- Live Streams Policies
-- Read: Everyone can read public streams, only streamers can read their private streams
CREATE POLICY "live_streams_read" ON live_streams FOR SELECT USING (
    is_private = false OR 
    streamer_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM stream_viewers 
        WHERE stream_id = live_streams.id 
        AND user_id = auth.uid() 
        AND is_active = true
    )
);

-- Insert: Only authenticated users can create streams for themselves
CREATE POLICY "live_streams_insert" ON live_streams FOR INSERT WITH CHECK (
    auth.uid() = streamer_id
);

-- Update: Only streamers can update their own streams
CREATE POLICY "live_streams_update" ON live_streams FOR UPDATE USING (
    auth.uid() = streamer_id
);

-- Delete: Only streamers can delete their own streams
CREATE POLICY "live_streams_delete" ON live_streams FOR DELETE USING (
    auth.uid() = streamer_id
);

-- Stream Viewers Policies
-- Read: Users can read their own viewing history and streamers can see their stream viewers
CREATE POLICY "stream_viewers_read" ON stream_viewers FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM live_streams 
        WHERE id = stream_viewers.stream_id 
        AND streamer_id = auth.uid()
    )
);

-- Insert: Users can join streams as viewers
CREATE POLICY "stream_viewers_insert" ON stream_viewers FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- Update: Users can update their own viewer records
CREATE POLICY "stream_viewers_update" ON stream_viewers FOR UPDATE USING (
    auth.uid() = user_id
);

-- Delete: Users can delete their own viewer records
CREATE POLICY "stream_viewers_delete" ON stream_viewers FOR DELETE USING (
    auth.uid() = user_id
);

-- Stream Chat Messages Policies
-- Read: Users can read chat messages for streams they're viewing or streams they own
CREATE POLICY "stream_chat_read" ON stream_chat_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM live_streams 
        WHERE id = stream_chat_messages.stream_id 
        AND (streamer_id = auth.uid() OR is_private = false)
    ) OR
    EXISTS (
        SELECT 1 FROM stream_viewers 
        WHERE stream_id = stream_chat_messages.stream_id 
        AND user_id = auth.uid() 
        AND is_active = true
    )
);

-- Insert: Users can send messages to streams they're viewing
CREATE POLICY "stream_chat_insert" ON stream_chat_messages FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (EXISTS (
        SELECT 1 FROM stream_viewers 
        WHERE stream_id = stream_chat_messages.stream_id 
        AND user_id = auth.uid() 
        AND is_active = true
    ) OR
    EXISTS (
        SELECT 1 FROM live_streams 
        WHERE id = stream_chat_messages.stream_id 
        AND streamer_id = auth.uid()
    ))
);

-- Update: Only streamers can update/moderate chat messages in their streams
CREATE POLICY "stream_chat_update" ON stream_chat_messages FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM live_streams 
        WHERE id = stream_chat_messages.stream_id 
        AND streamer_id = auth.uid()
    )
);

-- Delete: Users can delete their own messages, streamers can delete any message in their streams
CREATE POLICY "stream_chat_delete" ON stream_chat_messages FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM live_streams 
        WHERE id = stream_chat_messages.stream_id 
        AND streamer_id = auth.uid()
    )
);

-- Service Role Full Access Policies
-- These policies allow the service role to bypass RLS for backend operations

CREATE POLICY "live_streams_service_role" ON live_streams FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

CREATE POLICY "stream_viewers_service_role" ON stream_viewers FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

CREATE POLICY "stream_chat_service_role" ON stream_chat_messages FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Realtime Subscriptions (for live updates)
-- Enable realtime for all streaming tables

-- Allow users to subscribe to live streams they can view
ALTER publication supabase_realtime ADD TABLE live_streams;

-- Allow users to subscribe to viewer updates for streams they're watching or owning
ALTER publication supabase_realtime ADD TABLE stream_viewers;

-- Allow users to subscribe to chat messages for streams they're viewing
ALTER publication supabase_realtime ADD TABLE stream_chat_messages;

-- Functions for automatic cleanup and maintenance

-- Function to update stream viewer count
CREATE OR REPLACE FUNCTION update_stream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- User joined stream
        UPDATE live_streams 
        SET viewer_count = (
            SELECT COUNT(*) FROM stream_viewers 
            WHERE stream_id = NEW.stream_id AND is_active = true
        ),
        max_viewers = GREATEST(
            max_viewers,
            (SELECT COUNT(*) FROM stream_viewers 
             WHERE stream_id = NEW.stream_id AND is_active = true)
        )
        WHERE id = NEW.stream_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- User left stream or status changed
        UPDATE live_streams 
        SET viewer_count = (
            SELECT COUNT(*) FROM stream_viewers 
            WHERE stream_id = NEW.stream_id AND is_active = true
        )
        WHERE id = NEW.stream_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Viewer record deleted
        UPDATE live_streams 
        SET viewer_count = (
            SELECT COUNT(*) FROM stream_viewers 
            WHERE stream_id = OLD.stream_id AND is_active = true
        )
        WHERE id = OLD.stream_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update viewer counts
CREATE TRIGGER update_stream_viewer_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON stream_viewers
    FOR EACH ROW EXECUTE FUNCTION update_stream_viewer_count();

-- Function to cleanup inactive viewers
CREATE OR REPLACE FUNCTION cleanup_inactive_viewers()
RETURNS INTEGER AS $$
DECLARE
    inactive_count INTEGER;
BEGIN
    -- Mark viewers as inactive if they haven't sent a heartbeat in 5 minutes
    UPDATE stream_viewers 
    SET is_active = false, 
        left_at = now()
    WHERE is_active = true 
      AND (last_heartbeat IS NULL OR last_heartbeat < now() - INTERVAL '5 minutes');
    
    GET DIAGNOSTICS inactive_count = ROW_COUNT;
    RETURN inactive_count;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically end streams that have been inactive
CREATE OR REPLACE FUNCTION auto_end_inactive_streams()
RETURNS INTEGER AS $$
DECLARE
    ended_count INTEGER;
BEGIN
    -- End streams that have been live for more than 8 hours or have no active viewers for 30 minutes
    UPDATE live_streams 
    SET status = 'ended',
        ended_at = now()
    WHERE status = 'live' 
      AND (
          started_at < now() - INTERVAL '8 hours' OR
          (viewer_count = 0 AND started_at < now() - INTERVAL '30 minutes')
      );
    
    GET DIAGNOSTICS ended_count = ROW_COUNT;
    RETURN ended_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON live_streams TO authenticated, service_role;
GRANT ALL ON stream_viewers TO authenticated, service_role;
GRANT ALL ON stream_chat_messages TO authenticated, service_role;

-- Comments for documentation
COMMENT ON TABLE live_streams IS 'Stores live streaming sessions with metadata and status';
COMMENT ON TABLE stream_viewers IS 'Tracks users viewing live streams with session information';
COMMENT ON TABLE stream_chat_messages IS 'Real-time chat messages during live streams';

COMMENT ON COLUMN live_streams.stream_key IS 'Unique key for streaming software to connect';
COMMENT ON COLUMN live_streams.stream_url IS 'RTMP URL for streaming';
COMMENT ON COLUMN stream_viewers.total_watch_time IS 'Total watch time in seconds';
COMMENT ON COLUMN stream_viewers.last_heartbeat IS 'Last activity timestamp for viewer presence';
COMMENT ON COLUMN stream_chat_messages.is_highlighted IS 'Whether message is highlighted by moderator';

-- Initial sample data (optional - for testing)
-- This would typically be commented out in production

/*
-- Sample stream categories
INSERT INTO live_streams (streamer_id, title, description, category, status, stream_key, stream_url) 
VALUES 
    ((SELECT id FROM profiles LIMIT 1), 'Elite Training Session', 'Join me for an intense workout!', 'training', 'created', 'bgs_sample_key_1', 'rtmp://streaming.babygoats.app/live/bgs_sample_key_1'),
    ((SELECT id FROM profiles LIMIT 1), 'Q&A with Champions', 'Ask me anything about sports and training', 'q_and_a', 'scheduled', 'bgs_sample_key_2', 'rtmp://streaming.babygoats.app/live/bgs_sample_key_2');
*/