'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  sport: string
  grad_year: number | null
  hero_name: string | null
  age: number | null
  team_name: string | null
  jersey_number: string | null
  created_at: string
}

interface ProfileWithStats extends Profile {
  highlights_count?: number
  top_stat?: {
    stat_name: string
    value: number
    unit: string | null
  }
}

const SPORTS = [
  'all', 'basketball', 'football', 'soccer', 'baseball', 'tennis', 
  'track', 'gymnastics', 'swimming', 'volleyball', 'wrestling', 'other'
]

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<ProfileWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState('all')
  const [selectedGradYear, setSelectedGradYear] = useState('')
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  useEffect(() => {
    const loadProfiles = async () => {
      // Check current user
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user?.id || null)

      await searchProfiles()
    }

    loadProfiles()
  }, [])

  const searchProfiles = async () => {
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,team_name.ilike.%${searchTerm}%`)
    }

    if (selectedSport !== 'all') {
      query = query.eq('sport', selectedSport)
    }

    if (selectedGradYear) {
      query = query.eq('grad_year', parseInt(selectedGradYear))
    }

    const { data: profilesData } = await query.limit(20)

    if (profilesData) {
      // Enrich profiles with additional data
      const enrichedProfiles = await Promise.all(
        profilesData.map(async (profile) => {
          // Get highlights count
          const { count: highlightsCount } = await supabase
            .from('highlights')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)

          // Get top stat
          const { data: topStat } = await supabase
            .from('stats')
            .select('stat_name, value, unit')
            .eq('user_id', profile.id)
            .eq('category', 'performance')
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...profile,
            highlights_count: highlightsCount || 0,
            top_stat: topStat?.[0] || null
          }
        })
      )

      setProfiles(enrichedProfiles)
    }

    setLoading(false)
  }

  const handleSearch = () => {
    searchProfiles()
  }

  const getSportEmoji = (sport: string) => {
    switch (sport) {
      case 'basketball': return '🏀'
      case 'football': return '🏈'
      case 'soccer': return '⚽'
      case 'baseball': return '⚾'
      case 'tennis': return '🎾'
      case 'track': return '🏃'
      case 'gymnastics': return '🤸'
      case 'swimming': return '🏊'
      case 'volleyball': return '🏐'
      case 'wrestling': return '🤼'
      default: return '🏆'
    }
  }

  const currentYear = new Date().getFullYear()
  const gradYears = Array.from({ length: 10 }, (_, i) => currentYear + i)

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
              {currentUser ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                  <Link href="/challenges">
                    <Button variant="outline">Challenges</Button>
                  </Link>
                </>
              ) : (
                <Link href="/">
                  <Button variant="outline">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-baby-goats-black mb-4">
            DISCOVER YOUNG CHAMPIONS 🌟
          </h1>
          <p className="text-xl text-gray-600">
            Find and connect with the next generation of athletes
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Athletes</CardTitle>
            <CardDescription>Find athletes by name, team, sport, or graduation year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Name or team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <Label htmlFor="sport">Sport</Label>
                <select
                  id="sport"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {SPORTS.map(sport => (
                    <option key={sport} value={sport}>
                      {sport === 'all' ? 'All Sports' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="grad_year">Graduation Year</Label>
                <select
                  id="grad_year"
                  value={selectedGradYear}
                  onChange={(e) => setSelectedGradYear(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Years</option>
                  {gradYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="babygoats" 
                  onClick={handleSearch}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl">Searching for athletes...</div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-4">No athletes found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
            <Button variant="babygoats-outline" onClick={() => {
              setSearchTerm('')
              setSelectedSport('all')
              setSelectedGradYear('')
              searchProfiles()
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Found {profiles.length} athletes
              </h2>
              <div className="text-sm text-gray-600">
                Showing latest results
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-baby-goats-red rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {profile.full_name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-1">{getSportEmoji(profile.sport)}</span>
                            <span className="capitalize">{profile.sport}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        Class of {profile.grad_year}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-4">
                      {profile.team_name && (
                        <p className="text-sm">
                          <strong>Team:</strong> {profile.team_name}
                          {profile.jersey_number && ` #${profile.jersey_number}`}
                        </p>
                      )}
                      {profile.hero_name && (
                        <p className="text-sm">
                          <strong>Hero:</strong> {profile.hero_name}
                        </p>
                      )}
                      {profile.top_stat && (
                        <p className="text-sm">
                          <strong>{profile.top_stat.stat_name}:</strong> {profile.top_stat.value}{profile.top_stat.unit}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {profile.highlights_count} highlight{profile.highlights_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link href={`/profile/${profile.id}`} className="flex-1">
                        <Button variant="babygoats" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                      {currentUser && currentUser !== profile.id && (
                        <Button variant="outline" size="sm">
                          ⭐
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {profiles.length >= 20 && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={searchProfiles}>
                  Load More Athletes
                </Button>
              </div>
            )}
          </>
        )}

        {/* Featured Section */}
        <div className="mt-16 bg-white rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-center mb-6">Why Baby Goats?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="font-bold mb-2">Discover Talent</h4>
              <p className="text-gray-600">
                Find young athletes who demonstrate character and skill beyond their years
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h4 className="font-bold mb-2">Track Progress</h4>
              <p className="text-gray-600">
                Watch athletes grow and develop through their highlight reels and stats
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h4 className="font-bold mb-2">Build Connections</h4>
              <p className="text-gray-600">
                Connect coaches, scouts, and mentors with the next generation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}