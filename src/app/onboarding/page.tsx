'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SPORTS = [
  'basketball', 'football', 'soccer', 'baseball', 'tennis', 
  'track', 'gymnastics', 'swimming', 'volleyball', 'wrestling', 'other'
]

const GOAT_HEROES = [
  { name: 'Michael Jordan', sport: 'basketball', image: '🏀' },
  { name: 'Serena Williams', sport: 'tennis', image: '🎾' },
  { name: 'Lionel Messi', sport: 'soccer', image: '⚽' },
  { name: 'Tom Brady', sport: 'football', image: '🏈' },
  { name: 'Babe Ruth', sport: 'baseball', image: '⚾' },
  { name: 'Simone Biles', sport: 'gymnastics', image: '🤸' },
  { name: 'Katie Ledecky', sport: 'swimming', image: '🏊' },
  { name: 'Usain Bolt', sport: 'track', image: '🏃' },
]

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    full_name: '',
    sport: '',
    grad_year: new Date().getFullYear() + 4,
    hero_name: '',
    hero_reason: '',
    age: 14,
    team_name: '',
    jersey_number: '',
    parent_email: '',
    first_highlight_title: '',
    first_highlight_url: ''
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        window.location.href = '/'
        return
      }
      
      setUser(session.user)
      
      // Check if user already has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profile) {
        window.location.href = '/dashboard'
        return
      }
      
      setLoading(false)
    }

    checkUser()
  }, [])

  const handleSportSelect = (selectedSport: string) => {
    setFormData(prev => ({ ...prev, sport: selectedSport }))
    setStep(2)
  }

  const handleHeroSelect = (hero: typeof GOAT_HEROES[0]) => {
    setFormData(prev => ({ ...prev, hero_name: hero.name }))
  }

  const completeOnboarding = async () => {
    if (!user) return

    setLoading(true)
    
    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: formData.full_name || user.email || 'New Athlete',
          sport: formData.sport,
          grad_year: formData.grad_year,
          hero_name: formData.hero_name,
          hero_reason: formData.hero_reason,
          age: formData.age,
          team_name: formData.team_name,
          jersey_number: formData.jersey_number,
          parent_email: formData.parent_email,
          is_parent_approved: false
        })

      if (profileError) throw profileError

      // Add first highlight if provided
      if (formData.first_highlight_title && formData.first_highlight_url) {
        const { error: highlightError } = await supabase
          .from('highlights')
          .insert({
            user_id: user.id,
            title: formData.first_highlight_title,
            video_url: formData.first_highlight_url,
            description: 'My first highlight on Baby Goats!',
            is_featured: true
          })

        if (highlightError) console.log('Highlight error:', highlightError)
      }

      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('There was an error completing your profile. Please try again.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Setting up your profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-baby-goats-black mb-2">
            Welcome to BABY GOATS
          </h1>
          <p className="text-gray-600">Let's build your champion profile</p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    num <= step ? 'bg-baby-goats-red text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Choose Your Sport */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Sport</CardTitle>
              <CardDescription>What sport are you passionate about?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SPORTS.map((sport) => (
                  <Button
                    key={sport}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center hover:bg-baby-goats-red hover:text-white"
                    onClick={() => handleSportSelect(sport)}
                  >
                    <div className="text-2xl mb-1">
                      {sport === 'basketball' ? '🏀' :
                       sport === 'football' ? '🏈' :
                       sport === 'soccer' ? '⚽' :
                       sport === 'baseball' ? '⚾' :
                       sport === 'tennis' ? '🎾' :
                       sport === 'track' ? '🏃' :
                       sport === 'gymnastics' ? '🤸' :
                       sport === 'swimming' ? '🏊' :
                       sport === 'volleyball' ? '🏐' :
                       sport === 'wrestling' ? '🤼' : '🏆'}
                    </div>
                    <div className="text-sm capitalize">{sport}</div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Who's Your GOAT? */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Who's Your GOAT?</CardTitle>
              <CardDescription>Choose a legendary athlete who inspires you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GOAT_HEROES.map((hero) => (
                  <Button
                    key={hero.name}
                    variant="outline"
                    className={`h-16 flex items-center justify-start p-4 ${
                      formData.hero_name === hero.name ? 'bg-baby-goats-red text-white' : ''
                    }`}
                    onClick={() => handleHeroSelect(hero)}
                  >
                    <div className="text-2xl mr-3">{hero.image}</div>
                    <div className="text-left">
                      <div className="font-bold">{hero.name}</div>
                      <div className="text-sm capitalize">{hero.sport}</div>
                    </div>
                  </Button>
                ))}
              </div>

              {formData.hero_name && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hero_reason">Why is {formData.hero_name} your GOAT?</Label>
                    <textarea
                      id="hero_reason"
                      placeholder="Tell us what makes them legendary to you..."
                      className="w-full mt-2 p-3 border rounded-md"
                      rows={4}
                      value={formData.hero_reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, hero_reason: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button 
                      variant="babygoats" 
                      onClick={() => setStep(3)}
                      disabled={!formData.hero_reason.trim()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete Your Profile */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>Let's finish setting up your champion profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="8"
                    max="18"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="grad_year">Graduation Year</Label>
                  <Input
                    id="grad_year"
                    type="number"
                    value={formData.grad_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, grad_year: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="team_name">Team Name (Optional)</Label>
                  <Input
                    id="team_name"
                    value={formData.team_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                    placeholder="Your team or school"
                  />
                </div>
                <div>
                  <Label htmlFor="jersey_number">Jersey Number (Optional)</Label>
                  <Input
                    id="jersey_number"
                    value={formData.jersey_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, jersey_number: e.target.value }))}
                    placeholder="Your jersey number"
                  />
                </div>
                <div>
                  <Label htmlFor="parent_email">Parent Email</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_email: e.target.value }))}
                    placeholder="Parent or guardian email"
                  />
                </div>
              </div>

              {/* Optional First Highlight */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Add Your First Highlight (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="first_highlight_title">Highlight Title</Label>
                    <Input
                      id="first_highlight_title"
                      value={formData.first_highlight_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_highlight_title: e.target.value }))}
                      placeholder="e.g., 'Game winning shot vs rivals'"
                    />
                  </div>
                  <div>
                    <Label htmlFor="first_highlight_url">Video URL</Label>
                    <Input
                      id="first_highlight_url"
                      value={formData.first_highlight_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_highlight_url: e.target.value }))}
                      placeholder="YouTube, Vimeo, or video file URL"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  variant="babygoats" 
                  onClick={completeOnboarding}
                  disabled={!formData.full_name.trim() || !formData.parent_email.trim()}
                >
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}