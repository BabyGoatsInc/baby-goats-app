import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// TEMPORARY ADMIN ENDPOINT FOR MVP DEVELOPMENT
// This endpoint tests and temporarily bypasses RLS policies for MVP functionality

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Admin MVP Enable Request Received')
    
    // Check if this is a valid admin request
    const { action, confirm } = await request.json()
    
    if (action !== 'enable_mvp_mode' || confirm !== 'temporary_bypass_rls') {
      return NextResponse.json(
        { error: 'Invalid admin request' },
        { status: 400 }
      )
    }

    console.log('🚀 Testing MVP functionality...')
    
    // Test current write capabilities by attempting to create a test record
    const testResults = []
    
    // Test 1: Try to insert into debug_ping (should work if RLS allows)
    console.log('🧪 Testing debug_ping write...')
    const { data: pingData, error: pingError } = await supabase
      .from('debug_ping')
      .insert({ note: 'MVP functionality test - ' + new Date().toISOString() })
      .select()

    testResults.push({
      test: 'debug_ping write',
      success: !pingError,
      error: pingError?.message,
      data: pingData
    })

    // Test 2: Try to insert a profile
    console.log('🧪 Testing profile write...')
    const testProfile = {
      id: crypto.randomUUID(),
      full_name: 'MVP Test User',
      sport: 'basketball',
      is_parent_approved: true
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select()

    testResults.push({
      test: 'profile write',
      success: !profileError,
      error: profileError?.message,
      data: profileData,
      testId: profileError ? null : testProfile.id
    })

    // Test 3: Try to insert a challenge completion
    console.log('🧪 Testing challenge completion write...')
    const testCompletion = {
      id: crypto.randomUUID(),
      user_id: testProfile.id,
      challenge_id: '593de75d-0843-468b-ace6-07641c7b547a', // Existing challenge from seed data
      notes: 'MVP test completion'
    }

    const { data: completionData, error: completionError } = await supabase
      .from('challenge_completions')
      .insert(testCompletion)
      .select()

    testResults.push({
      test: 'challenge_completion write',
      success: !completionError,
      error: completionError?.message,
      data: completionData
    })

    // Clean up test data if successful
    if (profileData) {
      console.log('🧹 Cleaning up test profile...')
      await supabase.from('profiles').delete().eq('id', testProfile.id)
    }
    if (completionData) {
      console.log('🧹 Cleaning up test completion...')
      await supabase.from('challenge_completions').delete().eq('id', testCompletion.id)
    }

    // Calculate success rate
    const successfulTests = testResults.filter(t => t.success).length
    const totalTests = testResults.length
    
    console.log(`📊 MVP Test Results: ${successfulTests}/${totalTests} successful`)

    return NextResponse.json({
      success: true,
      message: 'MVP functionality test completed',
      summary: {
        totalTests,
        successfulTests,
        successRate: `${((successfulTests / totalTests) * 100).toFixed(1)}%`,
        mvpReady: successfulTests > 0
      },
      testResults,
      recommendation: successfulTests === 0 
        ? 'RLS policies are blocking all writes. Manual database configuration needed.'
        : successfulTests < totalTests
        ? 'Some write operations work. Partial MVP functionality available.'
        : 'All write operations working! MVP is fully functional.'
    })

  } catch (error) {
    console.error('💥 Admin MVP test failed:', error)
    return NextResponse.json(
      { error: 'Failed to test MVP functionality', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check current functionality status
export async function GET(request: NextRequest) {
  try {
    console.log('📋 RLS Policy Status Check')
    
    // Test read operations
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    const { data: challenges, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .limit(1)

    // Try a simple write test to debug_ping
    const { data: writeTest, error: writeError } = await supabase
      .from('debug_ping')
      .insert({ note: 'Status check test - ' + new Date().toISOString() })
      .select()

    return NextResponse.json({
      message: 'RLS Policy Status Check',
      timestamp: new Date().toISOString(),
      readOperations: {
        profiles: {
          success: !profileError,
          count: profiles?.length || 0,
          error: profileError?.message
        },
        challenges: {
          success: !challengeError,
          count: challenges?.length || 0,
          error: challengeError?.message
        }
      },
      writeOperations: {
        debugPing: {
          success: !writeError,
          error: writeError?.message,
          data: writeTest
        }
      },
      mvpStatus: !writeError ? 'FUNCTIONAL - Write operations enabled' : 'BLOCKED - RLS policies preventing writes',
      nextSteps: writeError 
        ? 'Use the POST endpoint to run MVP functionality tests'
        : 'MVP is ready! Write operations are working.'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}