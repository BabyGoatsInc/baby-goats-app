#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ssdzlzlubzcknkoflgyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc5OTYsImV4cCI6MjA3MDM0Mzk5Nn0.7ZpO5R64KS89k4We6jO9CbCevxwf1S5EOoqv6Xtv1Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateRLSPolicies() {
  console.log('🚀 Starting RLS policy updates for MVP development...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('/app/supabase_rls_update.sql', 'utf8');
    
    // Split by semicolons and filter out empty commands
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== '');
    
    console.log(`📝 Found ${commands.length} SQL commands to execute`);
    
    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\n🔄 Executing command ${i + 1}/${commands.length}:`);
      console.log(command.substring(0, 100) + '...');
      
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_command: command + ';' 
      });
      
      if (error) {
        console.error(`❌ Error in command ${i + 1}:`, error);
        // Continue with other commands
      } else {
        console.log(`✅ Command ${i + 1} executed successfully`);
      }
    }
    
    console.log('\n🎉 RLS policy update process completed!');
    
    // Test a simple query to verify connection
    const { data: testData, error: testError } = await supabase
      .from('debug_ping')
      .select('*')
      .limit(5);
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
    } else {
      console.log('✅ Database connection verified');
      console.log('📊 Recent debug_ping entries:', testData);
    }
    
  } catch (error) {
    console.error('💥 Script execution failed:', error);
  }
}

// Run the update
updateRLSPolicies();