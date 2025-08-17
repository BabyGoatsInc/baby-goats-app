#!/usr/bin/env node

/**
 * Apply Advanced Social Features Database Schema
 * Creates messaging and leaderboard tables in Supabase
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applySocialSchema() {
  console.log('🚀 Starting Advanced Social Features Database Schema Application...');
  
  try {
    // Read the schema file
    const schemaSQL = fs.readFileSync('/app/messaging-leaderboard-schema.sql', 'utf8');
    
    console.log('📋 Schema file loaded successfully');
    console.log(`📏 Schema size: ${(schemaSQL.length / 1024).toFixed(1)}KB`);
    
    // Split into individual statements (rough approach)
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      try {
        console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Some errors might be expected (like "table already exists")
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Expected: ${error.message}`);
          } else {
            console.error(`❌ Error: ${error.message}`);
            errors.push({
              statement: i + 1,
              error: error.message,
              sql: statement.substring(0, 100) + '...'
            });
            errorCount++;
          }
        } else {
          successCount++;
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Failed to execute statement ${i + 1}: ${err.message}`);
        errors.push({
          statement: i + 1,
          error: err.message,
          sql: statement.substring(0, 100) + '...'
        });
        errorCount++;
      }
    }
    
    console.log('\n📊 SCHEMA APPLICATION SUMMARY:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORS ENCOUNTERED:');
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. Statement ${err.statement}: ${err.error}`);
        console.log(`   SQL: ${err.sql}`);
      });
    }
    
    // Test table creation by checking if tables exist
    console.log('\n🔍 VERIFYING TABLE CREATION...');
    
    const tablesToCheck = [
      'messages',
      'friendships', 
      'notifications',
      'activity_feed',
      'user_presence',
      'leaderboards',
      'leaderboard_entries',
      'user_points'
    ];
    
    let tablesCreated = 0;
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`✅ Table '${table}' exists and accessible`);
          tablesCreated++;
        } else {
          console.log(`❌ Table '${table}' not accessible: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' check failed: ${err.message}`);
      }
    }
    
    console.log(`\n📋 TABLES VERIFICATION: ${tablesCreated}/${tablesToCheck.length} tables accessible`);
    
    if (tablesCreated === tablesToCheck.length) {
      console.log('🎉 SUCCESS! All advanced social features tables created successfully!');
      console.log('\n🚀 Advanced Social Features Database Schema Application Complete!');
      console.log('✨ The Baby Goats app now supports:');
      console.log('   • Live Chat & Messaging System');
      console.log('   • Leaderboards & Rankings');
      console.log('   • Friendship Management');
      console.log('   • Real-time Notifications');
      console.log('   • Activity Feed');
      console.log('   • User Presence & Points System');
      
      return true;
    } else {
      console.log('⚠️  Some tables may not have been created properly. Check errors above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Fatal error applying schema:', error.message);
    return false;
  }
}

// Alternative approach: Try direct SQL execution through database connection
async function tryDirectExecution() {
  console.log('\n🔄 Trying alternative approach: Direct table creation...');
  
  const basicTables = [
    // Messages table
    `CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT CHECK (message_type IN ('text', 'image', 'achievement', 'challenge')) DEFAULT 'text',
      read_at TIMESTAMPTZ,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT different_users CHECK (sender_id != receiver_id)
    )`,
    
    // Friendships table
    `CREATE TABLE IF NOT EXISTS friendships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
      initiated_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      accepted_at TIMESTAMPTZ,
      CONSTRAINT different_friends CHECK (user_id != friend_id),
      UNIQUE(user_id, friend_id)
    )`,
    
    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      type TEXT CHECK (type IN ('friend_request', 'friend_accept', 'message', 'achievement', 'challenge', 'leaderboard')) NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // Leaderboards table
    `CREATE TABLE IF NOT EXISTS leaderboards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      type TEXT CHECK (type IN ('points', 'achievements', 'challenges', 'streaks')) NOT NULL,
      scope TEXT CHECK (scope IN ('global', 'sport', 'region', 'team')) DEFAULT 'global',
      time_period TEXT CHECK (time_period IN ('daily', 'weekly', 'monthly', 'all_time')) DEFAULT 'all_time',
      sport_filter TEXT,
      region_filter TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
  ];
  
  let createdCount = 0;
  for (const [index, tableSQL] of basicTables.entries()) {
    try {
      console.log(`⏳ Creating basic table ${index + 1}/${basicTables.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: tableSQL
      });
      
      if (error) {
        console.log(`❌ Error creating table ${index + 1}: ${error.message}`);
      } else {
        console.log(`✅ Basic table ${index + 1} created successfully`);
        createdCount++;
      }
    } catch (err) {
      console.log(`❌ Failed to create basic table ${index + 1}: ${err.message}`);
    }
  }
  
  console.log(`\n📊 BASIC TABLES CREATED: ${createdCount}/${basicTables.length}`);
  return createdCount > 0;
}

// Main execution
async function main() {
  try {
    // First try the full schema
    const fullSuccess = await applySocialSchema();
    
    if (!fullSuccess) {
      // If full schema fails, try basic tables
      console.log('\n🔄 Full schema application had issues. Trying basic table creation...');
      await tryDirectExecution();
    }
    
    console.log('\n✨ Schema application process completed!');
    
  } catch (error) {
    console.error('❌ Fatal error in schema application:', error.message);
    process.exit(1);
  }
}

main();