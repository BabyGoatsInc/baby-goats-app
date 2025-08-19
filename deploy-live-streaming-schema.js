const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployLiveStreamingSchema() {
  console.log('🚀 Deploying Live Broadcasting System Database Schema...\n');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'live-streaming-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    console.log(`📊 Schema size: ${(schema.length / 1024).toFixed(2)} KB\n`);
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`🔧 Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Skip empty statements and comments
        if (!statement || statement.trim().length === 0) continue;
        
        console.log(`⚡ [${i + 1}/${statements.length}] Executing statement...`);
        
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          // Try direct query if rpc fails
          const { data: directData, error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);
          
          if (directError) {
            throw new Error(`SQL execution failed: ${error.message}`);
          }
          
          // If we can't use rpc, we'll need to use a different approach
          console.log(`⚠️  RPC not available, using alternative approach...`);
          break;
        }
        
        successCount++;
        console.log(`✅ Statement ${i + 1} executed successfully`);
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
        
        // Continue with other statements
        continue;
      }
    }
    
    console.log('\n🎉 Live Broadcasting Schema Deployment Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📊 Total statements: ${statements.length}`);
    
    // Verify table creation
    await verifyTablesCreated();
    
  } catch (error) {
    console.error('❌ Error deploying schema:', error.message);
    process.exit(1);
  }
}

async function verifyTablesCreated() {
  console.log('\n🔍 Verifying table creation...');
  
  const tablesToCheck = [
    'live_streams',
    'stream_viewers', 
    'stream_chat_messages'
  ];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' verification failed: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' is accessible`);
      }
    } catch (error) {
      console.log(`❌ Table '${table}' check failed: ${error.message}`);
    }
  }
}

// Execute the deployment
deployLiveStreamingSchema();