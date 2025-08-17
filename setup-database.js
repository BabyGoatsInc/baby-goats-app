#!/usr/bin/env node
/**
 * Automated Supabase Database Setup for Advanced Social Features
 * Creates the essential tables for Live Chat & Messaging + Leaderboards
 */

const https = require('https');

const SUPABASE_URL = 'https://ssdzlzlubzcknkoflgyf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2Nzk5NiwiZXhwIjoyMDcwMzQzOTk2fQ.qLpTC1ugTRUJw-7hLYcoCrKGd5FczieyfIt_5hfkN8c';

// Essential SQL statements for advanced social features
const sqlStatements = [
  // 1. Messages Table
  `CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    read_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 2. Friendships Table
  `CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    initiated_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
  );`,
  
  // 3. Notifications Table
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 4. Leaderboards Table
  `CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    scope TEXT DEFAULT 'global',
    time_period TEXT DEFAULT 'all_time',
    sport_filter TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 5. Leaderboard Entries Table
  `CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rank INT NOT NULL,
    score NUMERIC NOT NULL,
    rank_change INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 6. User Points Table
  `CREATE TABLE IF NOT EXISTS user_points (
    user_id UUID PRIMARY KEY,
    total_points INT DEFAULT 0,
    challenge_points INT DEFAULT 0,
    achievement_points INT DEFAULT 0,
    social_points INT DEFAULT 0,
    streak_points INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 7. Insert Sample Leaderboards
  `INSERT INTO leaderboards (name, description, type, scope, time_period) VALUES
    ('Global Champions', 'Top athletes worldwide based on total points', 'points', 'global', 'all_time'),
    ('Weekly Warriors', 'This week''s most active athletes', 'points', 'global', 'weekly'),
    ('Monthly Masters', 'Top performers this month', 'points', 'global', 'monthly')
  ON CONFLICT DO NOTHING;`
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

async function setupDatabase() {
  console.log('🚀 Starting Baby Goats Advanced Social Features Database Setup...');
  console.log('🎯 Target: Live Chat & Messaging + Leaderboards & Rankings');
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const statementName = [
      'Messages Table',
      'Friendships Table', 
      'Notifications Table',
      'Leaderboards Table',
      'Leaderboard Entries Table',
      'User Points Table',
      'Sample Data'
    ][i];

    try {
      console.log(`⏳ Creating: ${statementName}...`);
      
      const result = await makeSupabaseRequest(sql);
      
      if (result.statusCode === 200 || result.statusCode === 201) {
        console.log(`✅ ${statementName}: Created successfully`);
        successCount++;
      } else {
        console.log(`❌ ${statementName}: Error (${result.statusCode}) - ${result.body}`);
        errorCount++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
  const testTables = ['messages', 'friendships', 'notifications', 'leaderboards', 'leaderboard_entries', 'user_points'];
  
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

  if (successCount >= 6) {
    console.log('');
    console.log('🎉 SUCCESS! Advanced Social Features Database Setup Complete!');
    console.log('');
    console.log('✨ Your Baby Goats app now supports:');
    console.log('   💬 Live Chat & Messaging System');
    console.log('   🏆 Leaderboards & Rankings');
    console.log('   👥 Friendship Management'); 
    console.log('   🔔 Real-time Notifications');
    console.log('   📊 Points & Competition System');
    console.log('');
    console.log('🚀 Ready to test the advanced social features!');
  } else {
    console.log('');
    console.log('⚠️  Setup completed with some issues. Check errors above.');
    console.log('💡 You may need to run the SQL manually in Supabase Dashboard.');
  }
}

setupDatabase().catch(console.error);