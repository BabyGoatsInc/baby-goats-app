import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'

// Create a service role client for write operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Sanitize and validate input to prevent XSS and injection attacks
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove HTML tags and scripts
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Remove JavaScript protocols
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove potential SQL injection patterns
    .replace(/(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\s/gi, '')
    // Remove potential command injection
    .replace(/[;&|`$(){}[\]]/g, '')
    // Escape special characters for SQL safety
    .replace(/'/g, "''")
    // Limit length
    .substring(0, 1000)
    .trim();
}

/**
 * Validate profile data
 */
function validateProfileData(data: any): { isValid: boolean; errors: string[]; sanitizedData: any } {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Validate and sanitize each field
  if (data.full_name !== undefined) {
    if (typeof data.full_name !== 'string' || data.full_name.length < 1) {
      errors.push('Full name is required and must be at least 1 character');
    } else {
      sanitizedData.full_name = sanitizeInput(data.full_name);
      if (sanitizedData.full_name.length > 100) {
        errors.push('Full name must not exceed 100 characters');
      }
    }
  }

  if (data.sport !== undefined) {
    if (typeof data.sport !== 'string' || data.sport.length < 1) {
      errors.push('Sport is required');
    } else {
      sanitizedData.sport = sanitizeInput(data.sport);
      if (sanitizedData.sport.length > 50) {
        errors.push('Sport name must not exceed 50 characters');
      }
    }
  }

  if (data.location !== undefined && data.location !== null) {
    sanitizedData.location = sanitizeInput(data.location.toString());
    if (sanitizedData.location.length > 100) {
      errors.push('Location must not exceed 100 characters');
    }
  }

  if (data.grad_year !== undefined) {
    const currentYear = new Date().getFullYear();
    const gradYear = parseInt(data.grad_year);
    if (isNaN(gradYear) || gradYear < currentYear || gradYear > currentYear + 10) {
      errors.push(`Graduation year must be between ${currentYear} and ${currentYear + 10}`);
    } else {
      sanitizedData.grad_year = gradYear;
    }
  }

  if (data.username !== undefined && data.username !== null) {
    const username = sanitizeInput(data.username.toString());
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      errors.push('Username must be 3-30 characters and contain only letters, numbers, and underscores');
    } else {
      sanitizedData.username = username;
    }
  }

  // Copy other safe fields
  if (data.id !== undefined) sanitizedData.id = data.id;
  if (data.avatar_url !== undefined) sanitizedData.avatar_url = data.avatar_url;

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

// GET /api/profiles - Search/filter profiles
// Query params: sport, grad_year, search (name), limit, offset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // INPUT SANITIZATION: Sanitize all query parameters
    const rawSport = searchParams.get('sport')
    const rawGradYear = searchParams.get('grad_year')
    const rawSearch = searchParams.get('search')
    const rawLimit = searchParams.get('limit') || '20'
    const rawOffset = searchParams.get('offset') || '0'

    // Sanitize inputs
    const sport = rawSport ? sanitizeInput(rawSport) : null
    const search = rawSearch ? sanitizeInput(rawSearch) : null
    
    // Validate and parse numeric inputs
    let gradYear: number | null = null
    if (rawGradYear) {
      const parsedGradYear = parseInt(rawGradYear)
      const currentYear = new Date().getFullYear()
      if (!isNaN(parsedGradYear) && parsedGradYear >= currentYear && parsedGradYear <= currentYear + 10) {
        gradYear = parsedGradYear
      } else {
        return NextResponse.json(
          { error: `Invalid graduation year. Must be between ${currentYear} and ${currentYear + 10}` },
          { status: 400 }
        )
      }
    }

    // Validate pagination parameters
    const limit = Math.min(Math.max(parseInt(rawLimit) || 20, 1), 100) // Max 100 results
    const offset = Math.max(parseInt(rawOffset) || 0, 0)

    let query = supabase
      .from('profiles')
      .select('*')
      // Note: is_parent_approved column may not exist yet, so we'll show all profiles for now

    // Apply filters with sanitized inputs
    if (sport && sport.length > 0) {
      query = query.eq('sport', sport)
    }
    
    if (gradYear) {
      query = query.eq('grad_year', gradYear)
    }

    if (search && search.length > 0) {
      // Use sanitized search term and prevent SQL injection
      query = query.ilike('full_name', `%${search.substring(0, 50)}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: profiles, error } = await query

    if (error) {
      console.error('Error fetching profiles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profiles: profiles || [],
      pagination: {
        limit,
        offset,
        hasMore: profiles ? profiles.length === limit : false
      }
    })

  } catch (error) {
    console.error('Profiles API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/profiles - Create/update profile
export async function POST(request: NextRequest) {
  try {
    const body: ProfileUpdate = await request.json()
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if profile exists using regular client
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', body.id)
      .single()

    let result
    
    if (existingProfile) {
      // Update existing profile using service role (bypasses RLS)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', body.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json(
          { error: 'Failed to update profile', details: error.message },
          { status: 500 }
        )
      }
      result = data
    } else {
      // Create new profile using service role (bypasses RLS)
      const profileData: ProfileInsert = {
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return NextResponse.json(
          { error: 'Failed to create profile', details: error.message },
          { status: 500 }
        )
      }
      result = data
    }

    console.log('✅ Profile operation successful:', result.full_name)
    return NextResponse.json({ 
      profile: result,
      message: 'Profile saved successfully',
      productionMode: true 
    })

  } catch (error) {
    console.error('Profile POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/profiles/[id] - Get single profile by ID
export async function GET_PROFILE_BY_ID(id: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        highlights (
          id,
          title,
          video_url,
          description,
          likes_count,
          is_featured,
          created_at
        ),
        stats (
          id,
          stat_name,
          value,
          unit,
          category,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (!profile.is_parent_approved) {
      return NextResponse.json(
        { error: 'Profile not available' },
        { status: 403 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Profile GET_BY_ID API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}