import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = redirect
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('next')
  redirectTo.searchParams.delete('redirect')

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Get the user to check if they need onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has completed their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, sport')
          .eq('id', user.id)
          .single()

        // If no profile or incomplete profile, redirect to onboarding
        if (!profile || !profile.full_name || !profile.sport) {
          redirectTo.pathname = '/onboarding'
        }
      }

      return NextResponse.redirect(redirectTo)
    }
  }

  // Redirect to error page with instructions
  redirectTo.pathname = '/auth/error'
  return NextResponse.redirect(redirectTo)
}