import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    // Get table information from Supabase
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations')

    if (tablesError) {
      console.error('Error fetching tables:', tablesError)
    }

    // Get column information for profiles table
    const { data: profileColumns, error: profileError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .order('ordinal_position')

    if (profileError) {
      console.error('Error fetching profile columns:', profileError)
    }

    // Get column information for highlights table
    const { data: highlightColumns, error: highlightError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'highlights')
      .order('ordinal_position')

    if (highlightError) {
      console.error('Error fetching highlight columns:', highlightError)
    }

    // Get sample data from existing tables
    const { data: profileSample } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single()

    const { data: challengeSample } = await supabase
      .from('challenges')
      .select('*')
      .limit(1)
      .single()

    const schema = {
      tables: tables || [],
      profiles: {
        columns: profileColumns || [],
        sample_data: profileSample || null
      },
      highlights: {
        columns: highlightColumns || [],
        sample_data: null
      },
      challenge_sample: challengeSample || null,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ schema })

  } catch (error) {
    console.error('Schema debug error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schema information' },
      { status: 500 }
    )
  }
}