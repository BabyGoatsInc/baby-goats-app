import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Social Schema Setup API
 * Creates advanced social features database tables
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    console.log('🚀 Setting up Advanced Social Features Database Schema...');

    const setupResults = [];

    // Create tables using manual approach
    const tables = [
      {
        name: 'messages',
        description: 'Live chat and messaging system'
      },
      {
        name: 'friendships',
        description: 'Friend connections and requests'
      },
      {
        name: 'notifications',
        description: 'Real-time notifications system'
      },
      {
        name: 'leaderboards',
        description: 'Rankings and leaderboards'
      },
      {
        name: 'leaderboard_entries',
        description: 'User positions in leaderboards'
      },
      {
        name: 'user_points',
        description: 'Points tracking system'
      }
    ];

    // Test if tables already exist
    let existingTables = [];
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);

        if (!error) {
          existingTables.push(table.name);
          setupResults.push({
            table: table.name,
            status: 'already_exists',
            message: 'Table already exists and accessible'
          });
        }
      } catch (e) {
        // Table doesn't exist or not accessible - this is expected
      }
    }

    const missingTables = tables.filter(table => !existingTables.includes(table.name));

    if (missingTables.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All social features tables already exist',
        results: setupResults,
        existingTables: existingTables.length,
        createdTables: 0
      });
    }

    // Return setup instructions since we can't create tables directly
    return NextResponse.json({
      success: false,
      message: 'Database schema setup required',
      missingTables: missingTables.map(t => t.name),
      setupInstructions: {
        message: 'Advanced social features require database schema setup',
        requiredTables: tables,
        sqlFileLocation: '/app/messaging-leaderboard-schema.sql',
        manualSetupRequired: true,
        instructions: [
          '1. Access your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Execute the SQL schema from messaging-leaderboard-schema.sql',
          '4. Ensure RLS policies are properly configured',
          '5. Test API endpoints after schema setup'
        ]
      },
      results: setupResults,
      existingTables: existingTables.length,
      totalRequired: tables.length
    });

  } catch (error) {
    console.error('Schema setup error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to setup social features schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}