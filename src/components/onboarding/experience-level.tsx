'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@/lib/onboarding-state'

// Experience Level Assessment Component
export function ExperienceLevelScreen({ onNext }: { onNext: () => void }) {
  const { data, updateExperienceLevel } = useOnboardingStore()
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null)
  const [yearsPlaying, setYearsPlaying] = useState(0)
  const [currentTeam, setCurrentTeam] = useState('')
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [achievements, setAchievements] = useState<string[]>([])

  const sport = data.sport_selection?.sport || 'your sport'

  const experienceLevels = [
    {
      level: 'beginner' as const,
      title: "I'm Just Starting My Legend",
      subtitle: "Every master was once a beginner",
      description: "You're at the most exciting stage - pure potential waiting to be unleashed!",
      icon: '🌱',
      color: 'from-green-500 to-emerald-600',
      encouragement: {
        title: "Welcome to Your Origin Story! 🌟",
        message: `Every legendary ${sport.toLowerCase()} player started exactly where you are. Michael Jordan was cut from his high school team. Tom Brady was pick #199. Your journey starts now, and that's what makes it beautiful.`,
        champion_examples: [
          `Michael Jordan didn't make varsity as a sophomore`,
          `Kobe Bryant went straight from high school - everyone starts somewhere`,
          `Serena Williams began at age 3 on cracked courts`,
        ],
        mindset_tip: "Champions aren't made in the spotlight - they're forged in the early morning practices when no one is watching."
      }
    },
    {
      level: 'intermediate' as const,
      title: "I'm Building My Foundation",
      subtitle: "Consistency is the mother of mastery",
      description: "You've got the basics down and you're ready to level up your mental game!",
      icon: '🏗️',
      color: 'from-blue-500 to-indigo-600',
      encouragement: {
        title: "The Foundation Years Are Gold! 💎",
        message: `This is where champions are truly made. You have the fundamentals, now it's time to build the mental edge that separates good from great. Every practice, every rep is building your championship foundation.`,
        champion_examples: [
          `Steph Curry spent years perfecting his fundamentals at Davidson`,
          `Patrick Mahomes developed his arm strength in high school baseball`,
          `Simone Biles built her foundation through countless hours of basics`,
        ],
        mindset_tip: "The middle is where most people quit. Champions use it as their launching pad to greatness."
      }
    },
    {
      level: 'advanced' as const,
      title: "I'm Ready to Level Up",
      subtitle: "Excellence is a habit, not an act",
      description: "You've put in the work. Now it's time to develop the champion's mindset!",
      icon: '🚀',
      color: 'from-purple-500 to-pink-600',
      encouragement: {
        title: "Elite Mindset Activation! 🏆",
        message: `You've mastered the physical. Now comes the fun part - developing the mental game that turns talent into championships. This is where your real competitive advantage begins.`,
        champion_examples: [
          `LeBron James studies film more than anyone - mental preparation`,
          `Tiger Woods visualized every shot before taking it`,
          `Cristiano Ronaldo's mental toughness separates him from peers`,
        ],
        mindset_tip: "At your level, the difference between good and legendary is 90% mental. You're ready for that journey."
      }
    }
  ]

  const commonAchievements = [
    'Made school team', 
    'Won a tournament/competition',
    'Team captain or leadership role',
    'Personal best/record',
    'MVP or award recognition',
    'Competed at state/regional level',
    'Consistently starter',
    'Helped team to championship'
  ]

  useEffect(() => {
    if (selectedLevel) {
      const timer = setTimeout(() => setShowEncouragement(true), 800)
      return () => clearTimeout(timer)
    }
  }, [selectedLevel])

  const handleLevelSelect = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setSelectedLevel(level)
    setShowEncouragement(false)
    
    // Reset form data when changing levels
    setYearsPlaying(level === 'beginner' ? 0 : level === 'intermediate' ? 2 : 4)
    setCurrentTeam('')
    setAchievements([])
  }

  const handleAchievementToggle = (achievement: string) => {
    setAchievements(prev => 
      prev.includes(achievement) 
        ? prev.filter(a => a !== achievement)
        : [...prev, achievement]
    )
  }

  const handleNext = () => {
    if (!selectedLevel) return
    
    updateExperienceLevel({
      level: selectedLevel,
      years_playing: yearsPlaying,
      current_team: currentTeam || undefined,
      achievements: achievements.length > 0 ? achievements : undefined
    })
    
    onNext()
  }

  const selectedLevelData = experienceLevels.find(l => l.level === selectedLevel)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Every Master Was Once a Beginner
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your current level is just your starting point. Champions are made through growth, not through where they start.
          </p>
        </motion.div>

        {/* Experience Level Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {experienceLevels.map((level, index) => (
            <motion.div
              key={level.level}
              className={`
                relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105
                ${selectedLevel === level.level 
                  ? `bg-gradient-to-br ${level.color} shadow-2xl` 
                  : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                }
              `}
              onClick={() => handleLevelSelect(level.level)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Level Icon */}
              <div className="text-5xl mb-4 text-center">{level.icon}</div>
              
              {/* Level Title */}
              <h3 className="text-white font-bold text-lg mb-2 text-center">
                {level.title}
              </h3>
              
              {/* Level Subtitle */}
              <p className="text-sm text-gray-300 text-center mb-3 italic">
                {level.subtitle}
              </p>
              
              {/* Level Description */}
              <p className="text-sm text-gray-200 text-center">
                {level.description}
              </p>

              {/* Selection Indicator */}
              {selectedLevel === level.level && (
                <motion.div
                  className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.6 }}
                >
                  <span className="text-gray-900 text-lg font-bold">✓</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Personalized Encouragement */}
        <AnimatePresence>
          {selectedLevel && showEncouragement && selectedLevelData && (
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-3">
                  {selectedLevelData.encouragement.title}
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {selectedLevelData.encouragement.message}
                </p>
              </div>

              {/* Champion Examples */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-3 text-center">
                  Champions Who Started Here:
                </h3>
                <div className="space-y-2">
                  {selectedLevelData.encouragement.champion_examples.map((example, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center text-gray-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <span className="text-yellow-400 mr-3">🏆</span>
                      <span>{example}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Mindset Tip */}
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <p className="text-blue-300 font-medium italic">
                  💭 Champion's Mindset: {selectedLevelData.encouragement.mindset_tip}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Additional Details Form */}
        <AnimatePresence>
          {selectedLevel && (
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-white text-lg font-bold mb-6 text-center">
                Tell Us More About Your Journey
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Years Playing */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    How long have you been playing {sport.toLowerCase()}?
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={yearsPlaying}
                      onChange={(e) => setYearsPlaying(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white font-bold min-w-[60px]">
                      {yearsPlaying === 0 ? 'New!' : `${yearsPlaying} year${yearsPlaying !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>

                {/* Current Team */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Current Team (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentTeam}
                    onChange={(e) => setCurrentTeam(e.target.value)}
                    placeholder="e.g., High School Varsity, Club Team"
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Achievements (for intermediate/advanced) */}
              {selectedLevel !== 'beginner' && (
                <div className="mt-6">
                  <label className="text-white text-sm font-medium mb-3 block">
                    What achievements are you proud of? (Select any that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {commonAchievements.map((achievement) => (
                      <button
                        key={achievement}
                        onClick={() => handleAchievementToggle(achievement)}
                        className={`
                          p-3 rounded-lg text-sm font-medium transition-all duration-200
                          ${achievements.includes(achievement)
                            ? 'bg-yellow-500 text-gray-900'
                            : 'bg-white/20 text-white hover:bg-white/30'
                          }
                        `}
                      >
                        {achievement}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        <AnimatePresence>
          {selectedLevel && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.5 }}
            >
              <Button
                onClick={handleNext}
                className={`bg-gradient-to-r ${selectedLevelData?.color} hover:scale-105 text-white px-8 py-4 text-lg font-bold rounded-full shadow-2xl transform transition-all duration-200`}
              >
                My Foundation is Set! Let's Build 🚀
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}