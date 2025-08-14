'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { 
  challengesApi, 
  handleApiError, 
  handleApiSuccess 
} from '@/lib/api'

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  points: number
  created_at: string
  completed?: boolean
  completion?: any
}

interface ChallengeStats {
  total_completed: number
  total_points: number
  categories: Record<string, any>
  streak: number
  recent_completions: any[]
}

export default function ChallengesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null) // Track which challenge is being submitted

  useEffect(() => {
    const loadChallengesData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        window.location.href = '/'
        return
      }

      setUser(session.user)

      // Load data using API endpoints
      await Promise.all([
        loadChallenges(session.user.id),
        loadChallengeStats(session.user.id)
      ])

      setLoading(false)
    }

    loadChallengesData()
  }, [])

  const loadChallenges = async (userId: string) => {
    const { data, error } = await challengesApi.getChallenges({
      user_id: userId,
      is_active: true
    })

    if (error) {
      handleApiError(error, 'Failed to load challenges')
    } else if (data) {
      setChallenges(data.challenges)
    }
  }

  const loadChallengeStats = async (userId: string) => {
    const { data, error } = await challengesApi.getChallengeStats(userId)
    
    if (error) {
      console.error('Failed to load challenge stats:', error)
    } else if (data) {
      setChallengeStats(data.stats)
    }
  }

  const completeChallenge = async (challenge: Challenge) => {
    if (!user) return

    const notes = prompt('Add a note about completing this challenge (optional):')
    
    setSubmitting(challenge.id)

    const { data, error } = await challengesApi.completeChallenge({
      user_id: user.id,
      challenge_id: challenge.id,
      notes: notes || undefined
    })

    if (error) {
      if (error.includes('duplicate') || error.includes('already completed')) {
        alert('You have already completed this challenge today!')
      } else {
        handleApiError(error, 'Failed to complete challenge')
      }
    } else if (data) {
      handleApiSuccess(`Challenge completed! +${data.points_earned} points`)
      
      // Refresh data to show updated completion status
      await Promise.all([
        loadChallenges(user.id),
        loadChallengeStats(user.id)
      ])
    }

    setSubmitting(null)
  }

  const isChallengeCompleted = (challenge: Challenge) => {
    return challenge.completed === true
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'resilient': return 'bg-red-600'
      case 'relentless': return 'bg-gray-900'
      case 'fearless': return 'bg-gray-600'
      default: return 'bg-blue-600'
    }
  }

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'resilient': return '🔥'
      case 'relentless': return '⚡'
      case 'fearless': return '🚀'
      default: return '💪'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading challenges...</div>
      </div>
    )
  }

  const challengesByCategory = challenges.reduce((acc, challenge) => {
    if (!acc[challenge.category]) acc[challenge.category] = []
    acc[challenge.category].push(challenge)
    return acc
  }, {} as Record<string, Challenge[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-2xl font-bold text-baby-goats-black">
              BABY GOATS
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/discover">
                <Button variant="outline">Discover</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-baby-goats-black mb-4">
            GOAT CHALLENGES 🐐
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Build champion character through daily challenges
          </p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-baby-goats-red">
                  {challengeStats?.streak || 0}
                </div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-baby-goats-black">
                  {challengeStats?.total_points || 0}
                </div>
                <div className="text-sm text-gray-600">Total Points</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {challengeStats?.total_completed || 0}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Challenge Categories */}
        <div className="space-y-8">
          {Object.entries(challengesByCategory).map(([category, categoryCharlenges]) => (
            <div key={category}>
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-3">{getCategoryEmoji(category)}</span>
                <h2 className="text-3xl font-bold capitalize text-baby-goats-black">
                  {category}
                </h2>
                <div className={`ml-4 px-3 py-1 rounded-full text-white text-sm font-bold ${getCategoryColor(category)}`}>
                  {categoryCharlenges.length} Challenges
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryCharlenges.map((challenge) => {
                  const isCompleted = isChallengeCompleted(challenge.id)
                  
                  return (
                    <Card key={challenge.id} className={`relative ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getCategoryColor(challenge.category)}`}>
                              {challenge.points} pts
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {challenge.difficulty}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{challenge.description}</p>
                        
                        {isCompleted ? (
                          <div className="flex items-center justify-center text-green-600 font-bold">
                            ✅ Completed Today!
                          </div>
                        ) : (
                          <Button 
                            variant="babygoats" 
                            className="w-full"
                            onClick={() => completeChallenge(challenge)}
                          >
                            Complete Challenge
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Challenge Explanation */}
        <div className="mt-12 bg-white rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-center mb-6">Build Champion Character</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">🔥</span>
              </div>
              <h4 className="text-xl font-bold mb-2 text-red-600">RESILIENT</h4>
              <p className="text-gray-600">
                Bounce back stronger from setbacks. Champions are forged in adversity.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-900">RELENTLESS</h4>
              <p className="text-gray-600">
                Never give up on your dreams. Consistent effort creates extraordinary results.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">🚀</span>
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-600">FEARLESS</h4>
              <p className="text-gray-600">
                Embrace challenges and take bold risks. Growth happens outside your comfort zone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}