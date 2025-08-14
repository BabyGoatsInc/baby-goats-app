'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MagicLinkFormProps {
  title?: string
  description?: string
  redirectTo?: string
}

export function MagicLinkForm({ 
  title = "Sign In to Baby Goats",
  description = "Enter your email to receive a magic link",
  redirectTo = "/dashboard"
}: MagicLinkFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?redirect=${redirectTo}`,
        },
      })

      if (error) {
        setMessage(error.message)
        setIsSuccess(false)
      } else {
        setMessage('Check your email for the magic link!')
        setIsSuccess(true)
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
      setIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-baby-goats-black">
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full"
            variant="babygoats"
          >
            {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
          </Button>
          
          {message && (
            <div className={`text-sm text-center p-3 rounded-md ${
              isSuccess 
                ? 'text-green-700 bg-green-50 border border-green-200' 
                : 'text-red-700 bg-red-50 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            New to Baby Goats?{' '}
            <a href="/signup" className="font-medium text-baby-goats-red hover:underline">
              Create an account
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Signup variant
export function SignupForm() {
  return (
    <MagicLinkForm
      title="Join Baby Goats"
      description="Enter your email to create your account and receive a magic link"
      redirectTo="/onboarding"
    />
  )
}