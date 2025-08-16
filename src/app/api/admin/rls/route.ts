import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// TEMPORARY ADMIN ENDPOINT FOR MVP DEVELOPMENT
// This endpoint allows updating RLS policies to enable write operations
// In production, this should be removed or properly secured

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Admin RLS Policy Update Request Received')
    
    // Check if this is a valid admin request
    const { action, confirm } = await request.json()
    
    if (action !== 'update_rls_policies' || confirm !== 'enable_mvp_writes') {
      return NextResponse.json(
        { error: 'Invalid admin request' },
        { status: 400 }
      )
    }

    console.log('🚀 Starting RLS Policy Updates for MVP...')
    
    // SQL commands to make RLS policies permissive for MVP
    const rlsUpdates = [
      // PROFILES TABLE - Allow all operations
      `DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;`,
      `DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;`,
      `DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;`,
      `CREATE POLICY "MVP - Anyone can insert profiles" ON profiles FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "MVP - Anyone can update profiles" ON profiles FOR UPDATE USING (true);`,
      `CREATE POLICY "MVP - Anyone can delete profiles" ON profiles FOR DELETE USING (true);`,

      // HIGHLIGHTS TABLE - Allow all operations
      `DROP POLICY IF EXISTS "Users can insert their own highlights" ON highlights;`,
      `DROP POLICY IF EXISTS "Users can update their own highlights" ON highlights;`,
      `DROP POLICY IF EXISTS "Users can delete their own highlights" ON highlights;`,
      `CREATE POLICY "MVP - Anyone can insert highlights" ON highlights FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "MVP - Anyone can update highlights" ON highlights FOR UPDATE USING (true);`,
      `CREATE POLICY "MVP - Anyone can delete highlights" ON highlights FOR DELETE USING (true);`,

      // STATS TABLE - Allow all operations
      `DROP POLICY IF EXISTS "Users can manage their own stats" ON stats;`,
      `CREATE POLICY "MVP - Anyone can manage stats" ON stats FOR ALL USING (true);`,

      // CHALLENGE_COMPLETIONS TABLE - Allow all operations
      `DROP POLICY IF EXISTS "Completions viewable by owner" ON challenge_completions;`,
      `DROP POLICY IF EXISTS "Users can complete challenges" ON challenge_completions;`,
      `CREATE POLICY "MVP - Anyone can view completions" ON challenge_completions FOR SELECT USING (true);`,
      `CREATE POLICY "MVP - Anyone can complete challenges" ON challenge_completions FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "MVP - Anyone can update completions" ON challenge_completions FOR UPDATE USING (true);`,
      `CREATE POLICY "MVP - Anyone can delete completions" ON challenge_completions FOR DELETE USING (true);`,

      // LIKES TABLE - Allow all operations
      `DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;`,
      `CREATE POLICY "MVP - Anyone can manage likes" ON likes FOR ALL USING (true);`,

      // Add missing is_featured column to highlights if it doesn't exist
      `ALTER TABLE highlights ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;`,

      // Insert success record
      `INSERT INTO debug_ping (note) VALUES ('RLS policies updated for MVP - write operations enabled');`
    ]

    const results = []
    let successCount = 0
    let errorCount = 0

    // Execute each SQL command
    for (let i = 0; i < rlsUpdates.length; i++) {
      const sql = rlsUpdates[i]
      console.log(`🔄 Executing SQL ${i + 1}/${rlsUpdates.length}: ${sql.substring(0, 60)}...`)
      
      try {
        const { data, error } = await supabase.rpc('execute_sql', { sql })
        
        if (error) {
          console.error(`❌ Error in SQL ${i + 1}:`, error)
          results.push({ sql: sql.substring(0, 100), success: false, error: error.message })
          errorCount++
        } else {
          console.log(`✅ SQL ${i + 1} executed successfully`)
          results.push({ sql: sql.substring(0, 100), success: true })
          successCount++
        }
      } catch (err: any) {
        console.error(`❌ Exception in SQL ${i + 1}:`, err)
        results.push({ sql: sql.substring(0, 100), success: false, error: err.message })
        errorCount++
      }
    }

    console.log(`🏁 RLS Update Complete: ${successCount} success, ${errorCount} errors`)

    // Test a write operation to verify policies work
    console.log('🧪 Testing write operation...')
    const testProfile = {
      id: 'test-rls-' + Date.now(),
      full_name: 'RLS Test User',
      sport: 'basketball',
      is_parent_approved: true
    }

    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select()

    let writeTestResult = { success: false, error: null }
    if (testError) {
      console.error('❌ Write test failed:', testError)
      writeTestResult = { success: false, error: testError.message }
    } else {
      console.log('✅ Write test successful:', testData)
      writeTestResult = { success: true, data: testData }
      
      // Clean up test record
      await supabase.from('profiles').delete().eq('id', testProfile.id)
    }

    return NextResponse.json({
      success: true,
      message: `RLS policies updated for MVP development`,
      summary: {
        totalCommands: rlsUpdates.length,
        successCount,
        errorCount,
        writeTestResult
      },
      details: results
    })

  } catch (error) {
    console.error('💥 Admin RLS update failed:', error)
    return NextResponse.json(
      { error: 'Failed to update RLS policies', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check current RLS policy status
export async function GET(request: NextRequest) {
  try {
    // Test read operations
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    // Try a simple write test (will fail with current policies)
    const testId = 'rls-test-' + Date.now()
    const { data: writeTest, error: writeError } = await supabase
      .from('debug_ping')
      .insert({ note: 'RLS policy test' })
      .select()

    return NextResponse.json({
      message: 'RLS Policy Status Check',
      readTest: {
        success: !profileError,
        profilesCount: profiles?.length || 0,
        error: profileError?.message
      },
      writeTest: {
        success: !writeError,
        error: writeError?.message
      },
      recommendation: writeError ? 'RLS policies need to be updated for MVP functionality' : 'Write operations are enabled'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check RLS status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}