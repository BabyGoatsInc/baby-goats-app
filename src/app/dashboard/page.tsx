'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { 
  highlightsApi, 
  statsApi, 
  challengesApi, 
  handleApiError, 
  handleApiSuccess 
} from '@/lib/api'
import { LikeButton } from '@/components/baby-goats/like-button'

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
  created_at: string
}

interface Stat {
  id: string
  stat_name: string
  value: number
  unit: string | null
  category: string
}

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  points: number
  completed?: boolean
  completion?: any
}

interface ChallengeCompletion {
  challenge_id: string
  completed_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null)
  const [challengeStats, setChallengeStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddHighlight, setShowAddHighlight] = useState(false)
  const [showAddStat, setShowAddStat] = useState(false)
  const [highlightForm, setHighlightForm] = useState({ title: '', video_url: '', description: '' })
  const [statForm, setStatForm] = useState({ stat_name: '', value: 0, unit: '', category: 'performance' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        window.location.href = '/'
        return
      }

      setUser(session.user)

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profileData) {
        window.location.href = '/onboarding'
        return
      }

      setProfile(profileData)

      // Load data using API endpoints
      await Promise.all([
        loadHighlights(session.user.id),
        loadStats(session.user.id),
        loadTodayChallenge(session.user.id),
        loadChallengeStats(session.user.id)
      ])

      setLoading(false)
    }

    checkUserAndProfile()
  }, [])

  const loadHighlights = async (userId: string) => {
    const { data, error } = await highlightsApi.getHighlights({ 
      user_id: userId, 
      limit: 5 
    })
    
    if (error) {
      handleApiError(error, 'Failed to load highlights')
    } else if (data) {
      setHighlights(data.highlights)
    }
  }

  const loadStats = async (userId: string) => {
    const { data, error } = await statsApi.getStats({ 
      user_id: userId, 
      limit: 10 
    })
    
    if (error) {
      handleApiError(error, 'Failed to load stats')
    } else if (data) {
      setStats(data.stats)
    }
  }

  const loadTodayChallenge = async (userId: string) => {
    const { data, error } = await challengesApi.getChallenges({ 
      user_id: userId, 
      limit: 1 
    })
    
    if (error) {
      handleApiError(error, 'Failed to load challenges')
    } else if (data && data.challenges.length > 0) {
      setTodayChallenge(data.challenges[0])
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const addHighlight = async () => {
    if (!user || !highlightForm.title.trim() || !highlightForm.video_url.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    const { data, error } = await highlightsApi.createHighlight({
      user_id: user.id,
      title: highlightForm.title,
      video_url: highlightForm.video_url,
      description: highlightForm.description || undefined
    })

    if (error) {
      handleApiError(error, 'Failed to add highlight')
    } else if (data) {
      handleApiSuccess('Highlight added successfully!')
      await loadHighlights(user.id)
      setHighlightForm({ title: '', video_url: '', description: '' })
      setShowAddHighlight(false)
    }

    setSubmitting(false)
  }

  const addStat = async () => {
    if (!user || !statForm.stat_name.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    const { data, error } = await statsApi.createStat({
      user_id: user.id,
      stat_name: statForm.stat_name,
      value: statForm.value,
      unit: statForm.unit || undefined,
      category: statForm.category
    })

    if (error) {
      handleApiError(error, 'Failed to add stat')
    } else if (data) {
      handleApiSuccess('Stat added successfully!')
      await loadStats(user.id)
      setStatForm({ stat_name: '', value: 0, unit: '', category: 'performance' })
      setShowAddStat(false)
    }

    setSubmitting(false)
  }

  const completeChallenge = async () => {
    if (!user || !todayChallenge) return

    setSubmitting(true)

    const { data, error } = await challengesApi.completeChallenge({
      user_id: user.id,
      challenge_id: todayChallenge.id,
      notes: 'Completed from dashboard'
    })

    if (error) {
      handleApiError(error, 'Failed to complete challenge')
    } else if (data) {
      handleApiSuccess(`Challenge completed! +${data.points_earned} points`)
      await Promise.all([
        loadTodayChallenge(user.id),
        loadChallengeStats(user.id)
      ])
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading your dashboard...</div>
      </div>
    )
  }

  const isChallengeCompleted = todayChallenge?.completed === true

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
              <Link href="/challenges">
                <Button variant="outline">Challenges</Button>
              </Link>
              <Link href="/discover">
                <Button variant="outline">Discover</Button>
              </Link>
              <Link href={`/profile/${profile?.id}`}>
                <Button variant="outline">My Profile</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-baby-goats-black mb-2">
            Welcome back, {profile?.full_name}! 🐐
          </h1>
          <p className="text-gray-600">
            Ready to build your legacy today?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Summary & Actions */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Sport:</strong> {profile?.sport}</p>
                  <p><strong>Class of:</strong> {profile?.grad_year}</p>
                  {profile?.team_name && <p><strong>Team:</strong> {profile.team_name}</p>}
                  {profile?.jersey_number && <p><strong>Jersey:</strong> #{profile.jersey_number}</p>}
                  {profile?.hero_name && (
                    <div>
                      <p><strong>Hero:</strong> {profile.hero_name}</p>
                      {profile.hero_reason && (
                        <p className="text-sm text-gray-600 mt-1">{profile.hero_reason}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="babygoats" 
                  className="w-full"
                  onClick={() => setShowAddHighlight(true)}
                  disabled={submitting}
                >
                  Add Highlight
                </Button>
                <Button 
                  variant="babygoats-outline" 
                  className="w-full"
                  onClick={() => setShowAddStat(true)}
                  disabled={submitting}
                >
                  Update Stats
                </Button>
                <Link href="/challenges">
                  <Button variant="outline" className="w-full">
                    View All Challenges
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/profile/${profile?.id}`
                    navigator.clipboard.writeText(shareUrl)
                    alert('Profile link copied to clipboard!')
                  }}
                >
                  Share Profile
                </Button>
              </CardContent>
            </Card>

            {/* Challenge Stats */}
            {challengeStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Current Streak:</span>
                      <span className="font-bold text-baby-goats-red">{challengeStats.streak} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Points:</span>
                      <span className="font-bold">{challengeStats.total_points}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed:</span>
                      <span className="font-bold text-green-600">{challengeStats.total_completed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle Column - Today's Challenge */}
          <div className="space-y-6">
            {/* Today's Challenge */}
            {todayChallenge && (
              <Card>
                <CardHeader>
                  <CardTitle>Today's Challenge</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                      todayChallenge.category === 'resilient' ? 'bg-red-600' :
                      todayChallenge.category === 'relentless' ? 'bg-gray-900' :
                      'bg-gray-600'
                    }`}>
                      {todayChallenge.category.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {todayChallenge.points} points
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-bold mb-2">{todayChallenge.title}</h3>
                  <p className="text-gray-600 mb-4">{todayChallenge.description}</p>
                  {isChallengeCompleted ? (
                    <div className="flex items-center text-green-600 font-bold">
                      ✅ Completed Today!
                    </div>
                  ) : (
                    <Button 
                      variant="babygoats" 
                      onClick={completeChallenge}
                      disabled={submitting}
                    >
                      {submitting ? 'Completing...' : 'Mark Complete'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
                <CardDescription>Track your performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.length === 0 ? (
                  <p className="text-gray-500">No stats yet. Add your first stat!</p>
                ) : (
                  <div className="space-y-2">
                    {stats.slice(0, 5).map((stat) => (
                      <div key={stat.id} className="flex justify-between">
                        <span>{stat.stat_name}:</span>
                        <span className="font-bold">{stat.value}{stat.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Highlights */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Highlights</CardTitle>
                <CardDescription>Showcase your best moments</CardDescription>
              </CardHeader>
              <CardContent>
                {highlights.length === 0 ? (
                  <p className="text-gray-500">No highlights yet. Add your first highlight!</p>
                ) : (
                  <div className="space-y-4">
                    {highlights.slice(0, 3).map((highlight) => (
                      <div key={highlight.id} className="border rounded-lg p-3">
                        <h4 className="font-bold text-sm">{highlight.title}</h4>
                        {highlight.description && (
                          <p className="text-xs text-gray-600 mt-1">{highlight.description}</p>
                        )}
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <LikeButton 
                            highlightId={highlight.id}
                            initialLikesCount={highlight.likes_count}
                            userId={user?.id}
                            size="sm"
                          />
                          <span>{new Date(highlight.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Highlight Modal */}
        {showAddHighlight && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Highlight</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="highlight_title">Title</Label>
                  <Input
                    id="highlight_title"
                    value={highlightForm.title}
                    onChange={(e) => setHighlightForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., 'Game winning shot'"
                  />
                </div>
                <div>
                  <Label htmlFor="highlight_url">Video URL</Label>
                  <Input
                    id="highlight_url"
                    value={highlightForm.video_url}
                    onChange={(e) => setHighlightForm(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="YouTube, Vimeo, or video file URL"
                  />
                </div>
                <div>
                  <Label htmlFor="highlight_desc">Description (Optional)</Label>
                  <textarea
                    id="highlight_desc"
                    value={highlightForm.description}
                    onChange={(e) => setHighlightForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell us about this moment..."
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddHighlight(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="babygoats" 
                    onClick={addHighlight}
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Highlight'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Stat Modal */}
        {showAddStat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Stat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="stat_name">Stat Name</Label>
                  <Input
                    id="stat_name"
                    value={statForm.stat_name}
                    onChange={(e) => setStatForm(prev => ({ ...prev, stat_name: e.target.value }))}
                    placeholder="e.g., 'Points Per Game', 'Vertical Jump'"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="stat_value">Value</Label>
                    <Input
                      id="stat_value"
                      type="number"
                      step="0.1"
                      value={statForm.value}
                      onChange={(e) => setStatForm(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stat_unit">Unit</Label>
                    <Input
                      id="stat_unit"
                      value={statForm.unit}
                      onChange={(e) => setStatForm(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="PPG, inches, %"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="stat_category">Category</Label>
                  <select
                    id="stat_category"
                    value={statForm.category}
                    onChange={(e) => setStatForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="performance">Performance</option>
                    <option value="physical">Physical</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddStat(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="babygoats" 
                    onClick={addStat}
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Stat'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}