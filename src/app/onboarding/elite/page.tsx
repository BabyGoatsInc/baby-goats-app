'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { WelcomeSequence } from '@/components/onboarding/welcome-sequence'
import { ExperienceLevelScreen } from '@/components/onboarding/experience-level'
import { GoalSettingWorkshop } from '@/components/onboarding/goal-setting'
import { useOnboardingStore, OnboardingStep } from '@/lib/onboarding-state'

// Enhanced Sport Selection Component
function SportSelectionScreen({ onNext }: { onNext: () => void }) {
  const { updateSportSelection } = useOnboardingStore()
  const [selectedSport, setSelectedSport] = useState('')
  const [interestLevel, setInterestLevel] = useState(5)

  const sports = [
    { name: 'Basketball', emoji: '🏀', mindset: 'Teamwork builds legends' },
    { name: 'Soccer', emoji: '⚽', mindset: 'Endurance creates champions' },
    { name: 'Tennis', emoji: '🎾', mindset: 'Mental toughness wins matches' },
    { name: 'Swimming', emoji: '🏊', mindset: 'Discipline conquers all' },
    { name: 'Track & Field', emoji: '🏃', mindset: 'Every second counts' },
    { name: 'Football', emoji: '🏈', mindset: 'Strategy meets strength' },
    { name: 'Baseball', emoji: '⚾', mindset: 'Patience leads to power' },
    { name: 'Gymnastics', emoji: '🤸', mindset: 'Precision creates perfection' },
    { name: 'Wrestling', emoji: '🤼', mindset: 'Will over skill' },
    { name: 'Volleyball', emoji: '🏐', mindset: 'Unity builds victory' }
  ]

  const handleSportSelect = (sport: string) => {
    setSelectedSport(sport)
  }

  const handleNext = () => {
    updateSportSelection({
      sport: selectedSport,
      interest_level: interestLevel,
      experience_years: 0 // Will be collected in experience level step
    })
    onNext()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What's Your Arena?
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Every sport builds a different type of mental warrior. Choose your battlefield.
          </p>
        </div>

        {/* Sport Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {sports.map((sport) => (
            <div
              key={sport.name}
              onClick={() => handleSportSelect(sport.name)}
              className={`
                relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105
                ${selectedSport === sport.name 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-xl shadow-red-500/25' 
                  : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                }
              `}
            >
              {/* Sport Emoji */}
              <div className="text-4xl mb-3 text-center">{sport.emoji}</div>
              
              {/* Sport Name */}
              <h3 className="text-white font-bold text-center text-sm mb-2">
                {sport.name}
              </h3>
              
              {/* Mindset Hook */}
              <p className="text-xs text-gray-300 text-center opacity-80">
                {sport.mindset}
              </p>

              {/* Selection Indicator */}
              {selectedSport === sport.name && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-gray-900 text-sm">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Interest Level Slider */}
        {selectedSport && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <h3 className="text-white text-lg font-bold mb-4">
              How passionate are you about {selectedSport}?
            </h3>
            
            <div className="mb-4">
              <input
                type="range"
                min="1"
                max="10"
                value={interestLevel}
                onChange={(e) => setInterestLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>Just starting</span>
                <span className="text-red-400 font-bold">{interestLevel}/10</span>
                <span>Completely obsessed</span>
              </div>
            </div>

            <div className="text-center">
              {interestLevel <= 3 && (
                <p className="text-blue-300">Every great journey starts with curiosity 🌱</p>
              )}
              {interestLevel > 3 && interestLevel <= 7 && (
                <p className="text-green-300">Your passion is growing strong 🔥</p>
              )}
              {interestLevel > 7 && (
                <p className="text-yellow-300 font-bold">Champion-level dedication detected! 🏆</p>
              )}
            </div>
          </div>
        )}

        {/* Continue Button */}
        {selectedSport && (
          <div className="text-center">
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 text-lg font-bold rounded-full shadow-2xl transform transition-all duration-200 hover:scale-105"
            >
              My Arena is {selectedSport}! ⚡
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Temporary placeholder for next steps
function NextStepsPlaceholder() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          🎉 Welcome Sequence Complete!
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          You've just experienced the first phase of our elite onboarding. 
          This is where the rest of the championship journey would continue...
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-lg mx-auto">
          <h3 className="text-white font-bold mb-4">Next in Development:</h3>
          <ul className="text-left text-gray-300 space-y-2">
            <li>✓ Welcome sequence (Complete!)</li>
            <li>✓ Sport selection (Complete!)</li>
            <li>🔄 Experience level assessment</li>
            <li>🔄 Goal-setting workshop</li>
            <li>🔄 Mental game evaluation</li>
            <li>🔄 Visualization theater</li>
            <li>🔄 PEAK AI coach introduction</li>
          </ul>
        </div>

        <button
          onClick={() => window.location.href = '/dashboard'}
          className="mt-8 bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 text-lg font-bold rounded-full"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  )
}

// Main Elite Onboarding Component
export default function EliteOnboardingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { data, setCurrentStep, completeStep } = useOnboardingStore()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    checkUser()
  }, [])

  const handleWelcomeComplete = () => {
    setCurrentStep('sport-selection')
  }

  const handleSportSelectionComplete = () => {
    completeStep('sport-selection')
    setCurrentStep('experience-level')
  }

  const handleExperienceLevelComplete = () => {
    completeStep('experience-level')
    setCurrentStep('goal-setting')
  }

  const handleGoalSettingComplete = () => {
    completeStep('goal-setting')
    setCurrentStep('schedule-setup') // Next step will be schedule setup
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your champion journey...</div>
      </div>
    )
  }

  // Determine which step to show
  const shouldShowWelcome = !data.completed_steps.includes('welcome-future')
  const shouldShowSportSelection = data.completed_steps.includes('welcome-future') && 
                                  !data.completed_steps.includes('sport-selection')
  const shouldShowExperienceLevel = data.completed_steps.includes('sport-selection') &&
                                   !data.completed_steps.includes('experience-level')

  if (shouldShowWelcome) {
    return <WelcomeSequence onComplete={handleWelcomeComplete} />
  }

  if (shouldShowSportSelection) {
    return <SportSelectionScreen onNext={handleSportSelectionComplete} />
  }

  if (shouldShowExperienceLevel) {
    return <ExperienceLevelScreen onNext={handleExperienceLevelComplete} />
  }

  // For now, show placeholder for remaining steps
  return <NextStepsPlaceholder />
}