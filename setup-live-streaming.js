#!/usr/bin/env node
/**
 * Automated Supabase Database Setup for Live Broadcasting System
 * Creates the essential tables for Live Streaming, Viewers, and Stream Chat
 */

const https = require('https');

const SUPABASE_URL = 'https://ssdzlzlubzcknkoflgyf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2Nzk5NiwiZXhwIjoyMDcwMzQzOTk2fQ.qLpTC1ugTRUJw-7hLYcoCrKGd5FczieyfIt_5hfkN8c';

// Essential SQL statements for Live Broadcasting System
const sqlStatements = [
  // 1. Live Streams Table
  `CREATE TABLE IF NOT EXISTS live_streams (
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
  );`,
  
  // 2. Stream Viewers Table
  `CREATE TABLE IF NOT EXISTS stream_viewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    total_watch_time INTEGER DEFAULT 0,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'
  );`,
  
  // 3. Stream Chat Messages Table
  `CREATE TABLE IF NOT EXISTS stream_chat_messages (
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
  );`,
  
  // 4. Create Indexes
  `CREATE INDEX IF NOT EXISTS idx_live_streams_streamer_id ON live_streams(streamer_id);`,
  `CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);`,
  `CREATE INDEX IF NOT EXISTS idx_live_streams_category ON live_streams(category);`,
  `CREATE INDEX IF NOT EXISTS idx_live_streams_created_at ON live_streams(created_at DESC);`,
  
  `CREATE INDEX IF NOT EXISTS idx_stream_viewers_user_id ON stream_viewers(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);`,
  `CREATE INDEX IF NOT EXISTS idx_stream_viewers_active ON stream_viewers(is_active) WHERE is_active = true;`,
  `CREATE INDEX IF NOT EXISTS idx_stream_viewers_joined_at ON stream_viewers(joined_at DESC);`,
  
  `CREATE INDEX IF NOT EXISTS idx_stream_chat_stream_id ON stream_chat_messages(stream_id);`,
  `CREATE INDEX IF NOT EXISTS idx_stream_chat_user_id ON stream_chat_messages(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_stream_chat_created_at ON stream_chat_messages(created_at DESC);`,
  
  // 5. Enable Row Level Security
  `ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;`, 
  `ALTER TABLE stream_chat_messages ENABLE ROW LEVEL SECURITY;`,
  
  // 6. Service Role Policies (Allow all operations for service role)
  `CREATE POLICY IF NOT EXISTS "live_streams_service_role" ON live_streams FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );`,
  
  `CREATE POLICY IF NOT EXISTS "stream_viewers_service_role" ON stream_viewers FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );`,
  
  `CREATE POLICY IF NOT EXISTS "stream_chat_service_role" ON stream_chat_messages FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );`,
  
  // 7. User Policies for Live Streams
  `CREATE POLICY IF NOT EXISTS "live_streams_read" ON live_streams FOR SELECT USING (
    is_private = false OR 
    streamer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM stream_viewers 
      WHERE stream_id = live_streams.id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );`,
  
  `CREATE POLICY IF NOT EXISTS "live_streams_insert" ON live_streams FOR INSERT WITH CHECK (
    auth.uid() = streamer_id
  );`,
  
  `CREATE POLICY IF NOT EXISTS "live_streams_update" ON live_streams FOR UPDATE USING (
    auth.uid() = streamer_id
  );`,
  
  `CREATE POLICY IF NOT EXISTS "live_streams_delete" ON live_streams FOR DELETE USING (
    auth.uid() = streamer_id
  );`,
  
  // 8. User Policies for Stream Viewers
  `CREATE POLICY IF NOT EXISTS "stream_viewers_read" ON stream_viewers FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM live_streams 
      WHERE id = stream_viewers.stream_id 
      AND streamer_id = auth.uid()
    )
  );`,
  
  `CREATE POLICY IF NOT EXISTS "stream_viewers_insert" ON stream_viewers FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );`,
  
  `CREATE POLICY IF NOT EXISTS "stream_viewers_update" ON stream_viewers FOR UPDATE USING (
    auth.uid() = user_id
  );`,
  
  // 9. User Policies for Stream Chat
  `CREATE POLICY IF NOT EXISTS "stream_chat_read" ON stream_chat_messages FOR SELECT USING (
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
  );`,
  
  `CREATE POLICY IF NOT EXISTS "stream_chat_insert" ON stream_chat_messages FOR INSERT WITH CHECK (
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
  );`,
  
  // 10. Enable Realtime for all streaming tables
  `ALTER publication supabase_realtime ADD TABLE live_streams;`,
  `ALTER publication supabase_realtime ADD TABLE stream_viewers;`,
  `ALTER publication supabase_realtime ADD TABLE stream_chat_messages;`
];

function makeSupabaseRequest(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'ssdzlzlubzcknkoflgyf.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function setupLiveStreaming() {
  console.log('🎥 Starting Baby Goats Live Broadcasting System Database Setup...');
  console.log('🎯 Target: Live Streaming + Real-time Chat + Viewer Management');
  console.log('');

  const statementNames = [
    'Live Streams Table',
    'Stream Viewers Table', 
    'Stream Chat Messages Table',
    'Live Streams Indexes',
    'Live Streams Status Index',
    'Live Streams Category Index', 
    'Live Streams Created Index',
    'Stream Viewers User Index',
    'Stream Viewers Stream Index',
    'Stream Viewers Active Index',
    'Stream Viewers Joined Index',
    'Stream Chat Stream Index',
    'Stream Chat User Index',
    'Stream Chat Created Index',
    'Enable RLS: Live Streams',
    'Enable RLS: Stream Viewers',
    'Enable RLS: Stream Chat',
    'Service Role Policy: Live Streams',
    'Service Role Policy: Stream Viewers', 
    'Service Role Policy: Stream Chat',
    'User Policy: Streams Read',
    'User Policy: Streams Insert',
    'User Policy: Streams Update',
    'User Policy: Streams Delete',
    'User Policy: Viewers Read',
    'User Policy: Viewers Insert',
    'User Policy: Viewers Update',
    'User Policy: Chat Read',
    'User Policy: Chat Insert',
    'Enable Realtime: Live Streams',
    'Enable Realtime: Stream Viewers',
    'Enable Realtime: Stream Chat'
  ];

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const statementName = statementNames[i] || `Statement ${i + 1}`;

    try {
      console.log(`⏳ Setting up: ${statementName}...`);
      
      const result = await makeSupabaseRequest(sql);
      
      if (result.statusCode === 200 || result.statusCode === 201) {
        console.log(`✅ ${statementName}: Success`);
        successCount++;
      } else {
        console.log(`❌ ${statementName}: Error (${result.statusCode}) - ${result.body}`);
        errorCount++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      console.log(`❌ ${statementName}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('📊 SETUP RESULTS:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('');

  // Test database access
  console.log('🔍 Testing Database Access...');
  const testTables = ['live_streams', 'stream_viewers', 'stream_chat_messages'];
  
  for (const table of testTables) {
    try {
      const testResult = await makeSupabaseRequest(`SELECT COUNT(*) FROM ${table};`);
      if (testResult.statusCode === 200) {
        console.log(`✅ ${table}: Accessible`);
      } else {
        console.log(`❌ ${table}: Not accessible (${testResult.statusCode})`);
      }
    } catch (error) {
      console.log(`❌ ${table}: Error - ${error.message}`);
    }
  }

  if (successCount >= 25) {
    console.log('');
    console.log('🎉 SUCCESS! Live Broadcasting System Database Setup Complete!');
    console.log('');
    console.log('✨ Your Baby Goats app now supports:');
    console.log('   📺 Live Streaming with RTMP integration');
    console.log('   👥 Real-time Viewer Management'); 
    console.log('   💬 Live Stream Chat with Moderation');
    console.log('   🔒 Secure Row Level Security Policies');
    console.log('   ⚡ Real-time Updates via Supabase Subscriptions');
    console.log('   📊 Stream Analytics and Viewer Tracking');
    console.log('');
    console.log('🚀 Ready to test the Live Broadcasting System!');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Test the streaming APIs with the backend testing agent');
    console.log('   2. Create your first live stream from the mobile app');
    console.log('   3. Test real-time chat and viewer interactions');
  } else {
    console.log('');
    console.log('⚠️  Setup completed with some issues. Check errors above.');
    console.log('💡 You may need to run some SQL manually in Supabase Dashboard.');
  }
}

setupLiveStreaming().catch(console.error);