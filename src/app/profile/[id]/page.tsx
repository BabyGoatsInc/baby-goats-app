'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  sport: string
  grad_year: number | null
  hero_name: string | null
  hero_reason: string | null
  age: number | null
  team_name: string | null
  jersey_number: string | null
  is_parent_approved: boolean
  created_at: string
}

interface Highlight {
  id: string
  title: string
  video_url: string
  description: string | null
  likes_count: number
  is_featured: boolean
  created_at: string
}

interface Stat {
  id: string
  stat_name: string
  value: number
  unit: string | null
  category: string
}

interface ChallengeCompletion {
  id: string
  completed_at: string
  challenge: {
    title: string
    category: string
    points: number
  }
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [challengeCompletions, setChallengeCompletions] = useState<ChallengeCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  useEffect(() => {
    const loadProfileData = async () => {
      // Check current user
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user?.id || null)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!profileData) {
        // Profile not found
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Load highlights
      const { data: highlightsData } = await supabase
        .from('highlights')
        .select('*')
        .eq('user_id', params.id)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      setHighlights(highlightsData || [])

      // Load stats grouped by category
      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', params.id)
        .order('category')
        .order('created_at', { ascending: false })

      setStats(statsData || [])

      // Load challenge completions with challenge details
      const { data: completionsData } = await supabase
        .from('challenge_completions')
        .select(`
          id,
          completed_at,
          challenges (
            title,
            category,
            points
          )
        `)
        .eq('user_id', params.id)
        .order('completed_at', { ascending: false })
        .limit(10)

      setChallengeCompletions(completionsData?.map(c => ({
        id: c.id,
        completed_at: c.completed_at,
        challenge: c.challenges as any
      })) || [])

      setLoading(false)
    }

    loadProfileData()
  }, [params.id])

  const getVideoEmbedUrl = (url: string) => {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('/').pop()
      return `https://www.youtube.com/embed/${videoId}`
    }
    // Convert Vimeo URLs
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('/').pop()
      return `https://player.vimeo.com/video/${videoId}`
    }
    return url
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return '🏆'
      case 'physical': return '💪'
      case 'academic': return '📚'
      default: return '📊'
    }
  }

  const getChallengeEmoji = (category: string) => {
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
        <div className="text-xl">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-4">This athlete profile doesn't exist or has been removed.</p>
          <Link href="/discover">
            <Button variant="babygoats">Discover Athletes</Button>
          </Link>
        </div>
      </div>
    )
  }

  const statsByCategory = stats.reduce((acc, stat) => {
    if (!acc[stat.category]) acc[stat.category] = []
    acc[stat.category].push(stat)
    return acc
  }, {} as Record<string, Stat[]>)

  const isOwnProfile = currentUser === params.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-baby-goats-black">
              BABY GOATS
            </Link>
            <div className="flex items-center space-x-4">
              {isOwnProfile ? (
                <Link href="/dashboard">
                  <Button variant="outline">My Dashboard</Button>
                </Link>
              ) : (
                <Link href="/discover">
                  <Button variant="outline">Discover More</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-20 h-20 bg-baby-goats-red rounded-full flex items-center justify-center text-white text-2xl font-bold mr-6">
                {profile.full_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-baby-goats-black">{profile.full_name}</h1>
                <p className="text-xl text-gray-600 capitalize">
                  {profile.sport} • Class of {profile.grad_year}
                </p>
                {profile.team_name && (
                  <p className="text-gray-500">
                    {profile.team_name} {profile.jersey_number && `#${profile.jersey_number}`}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="babygoats-outline"
                onClick={() => {
                  const shareUrl = window.location.href
                  navigator.clipboard.writeText(shareUrl)
                  alert('Profile link copied!')
                }}
              >
                Share Profile
              </Button>
              {profile.is_parent_approved && (
                <Button variant="babygoats">
                  Contact
                </Button>
              )}
            </div>
          </div>

          {/* Hero Inspiration */}
          {profile.hero_name && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">Inspired by: {profile.hero_name}</h3>
              {profile.hero_reason && (
                <p className="text-gray-600 italic">"{profile.hero_reason}"</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
                <CardDescription>Performance metrics and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(statsByCategory).length === 0 ? (
                  <p className="text-gray-500">No stats available</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(statsByCategory).map(([category, categoryStats]) => (
                      <div key={category}>
                        <h4 className="font-bold text-sm uppercase text-gray-600 mb-2 flex items-center">
                          <span className="mr-2">{getCategoryIcon(category)}</span>
                          {category}
                        </h4>
                        <div className="space-y-2">
                          {categoryStats.map((stat) => (
                            <div key={stat.id} className="flex justify-between items-center">
                              <span className="text-sm">{stat.stat_name}:</span>
                              <span className="font-bold">{stat.value}{stat.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Character Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Character Journey</CardTitle>
                <CardDescription>Challenge completions and growth</CardDescription>
              </CardHeader>
              <CardContent>
                {challengeCompletions.length === 0 ? (
                  <p className="text-gray-500">No challenges completed yet</p>
                ) : (
                  <div className="space-y-3">
                    {challengeCompletions.slice(0, 5).map((completion) => (
                      <div key={completion.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <span className="mr-2">{getChallengeEmoji(completion.challenge.category)}</span>
                          <div>
                            <p className="text-sm font-medium">{completion.challenge.title}</p>
                            <p className="text-xs text-gray-500 capitalize">{completion.challenge.category}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(completion.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Highlights */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Highlights</CardTitle>
                <CardDescription>Showcase of best moments and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {highlights.length === 0 ? (
                  <p className="text-gray-500">No highlights available</p>
                ) : (
                  <div className="space-y-6">
                    {highlights.map((highlight) => (
                      <div key={highlight.id} className={`border rounded-lg p-4 ${highlight.is_featured ? 'border-baby-goats-red bg-red-50' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg">{highlight.title}</h3>
                            {highlight.description && (
                              <p className="text-gray-600 mt-1">{highlight.description}</p>
                            )}
                            {highlight.is_featured && (
                              <span className="inline-block bg-baby-goats-red text-white text-xs px-2 py-1 rounded mt-2">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>❤️ {highlight.likes_count}</p>
                            <p>{new Date(highlight.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        {/* Video Embed */}
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <iframe
                            src={getVideoEmbedUrl(highlight.video_url)}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            allowFullScreen
                            className="w-full h-full"
                            title={highlight.title}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action for Coaches/Scouts */}
        {!isOwnProfile && profile.is_parent_approved && (
          <Card className="mt-8 bg-baby-goats-black text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Interested in {profile.full_name}?</h3>
              <p className="text-gray-300 mb-6">
                Connect with this talented {profile.sport} athlete for recruiting or mentorship opportunities.
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="babygoats">
                  Contact Athlete
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-baby-goats-black">
                  Add to Watchlist
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}