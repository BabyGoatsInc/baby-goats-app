'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        // Redirect authenticated users to dashboard
        window.location.href = '/dashboard'
      }
      setLoading(false)
    }

    checkSession()
  }, [])



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-baby-goats-black">
                BABY GOATS
              </div>
            </div>
            <div>
              {user ? (
                <Link href="/dashboard" className="baby-goats-button baby-goats-button-primary">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="baby-goats-button baby-goats-button-secondary">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="baby-goats-hero text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              BUILD YOUR <span className="text-red-500">LEGACY</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              The ultimate platform for the next generation of champions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button variant="babygoats" size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="babygoats-outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Every GOAT was once a Baby Goat
            </h2>
            <p className="text-xl text-gray-600">
              Develop the champion mindset through our three core values
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Choose Your GOAT */}
            <div className="baby-goats-card p-8 text-center">
              <div className="text-4xl mb-4">🐐</div>
              <h3 className="text-xl font-bold mb-4">Choose Your GOAT</h3>
              <p className="text-gray-600">
                Be inspired by legends who paved the way for greatness
              </p>
            </div>

            {/* Track Your Journey */}
            <div className="baby-goats-card p-8 text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-4">Track Your Journey</h3>
              <p className="text-gray-600">
                Document your growth and showcase your highlights
              </p>
            </div>

            {/* Build Character */}
            <div className="baby-goats-card p-8 text-center">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-xl font-bold mb-4">Build Character</h3>
              <p className="text-gray-600">
                Daily challenges that develop resilience, relentlessness, and fearlessness
              </p>
            </div>

            {/* Get Discovered */}
            <div className="baby-goats-card p-8 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-4">Get Discovered</h3>
              <p className="text-gray-600">
                Showcase your talent to coaches and scouts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Resilient */}
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-600">RESILIENT</h3>
              <p className="text-gray-600 text-lg">
                Bounce back stronger from every setback. Champions are made in moments of adversity.
              </p>
            </div>

            {/* Relentless */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">RELENTLESS</h3>
              <p className="text-gray-600 text-lg">
                Never give up on your dreams. Consistent effort creates extraordinary results.
              </p>
            </div>

            {/* Fearless */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-700">FEARLESS</h3>
              <p className="text-gray-600 text-lg">
                Take bold risks and embrace challenges. Growth happens outside your comfort zone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 baby-goats-hero text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-8">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join thousands of young athletes building their legacy
          </p>
          <Link href="/signup">
            <button className="baby-goats-button baby-goats-button-primary text-xl px-12 py-4">
              GET STARTED TODAY
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">BABY GOATS</div>
            <p className="text-gray-400">
              Every GOAT was once a Baby Goat
            </p>
            <div className="mt-8">
              <Link href="/debug" className="text-gray-400 hover:text-white text-sm">
                Debug Panel
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}