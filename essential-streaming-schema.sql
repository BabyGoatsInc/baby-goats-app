-- Essential Live Broadcasting System Schema
-- Copy and paste this entire block into Supabase SQL Editor

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
    total_watch_time INTEGER DEFAULT 0,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'
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

-- Essential Indexes
CREATE INDEX IF NOT EXISTS idx_live_streams_streamer_id ON live_streams(streamer_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_user_id ON stream_viewers(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_chat_stream_id ON stream_chat_messages(stream_id);

-- Enable Row Level Security
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat_messages ENABLE ROW LEVEL SECURITY;

-- Service Role Policies (Critical for APIs to work)
CREATE POLICY "live_streams_service_role" ON live_streams FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

CREATE POLICY "stream_viewers_service_role" ON stream_viewers FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

CREATE POLICY "stream_chat_service_role" ON stream_chat_messages FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Enable Realtime
ALTER publication supabase_realtime ADD TABLE live_streams;
ALTER publication supabase_realtime ADD TABLE stream_viewers;
ALTER publication supabase_realtime ADD TABLE stream_chat_messages;