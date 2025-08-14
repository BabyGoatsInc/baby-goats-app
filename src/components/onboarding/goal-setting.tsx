'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@/lib/onboarding-state'

interface GoalSettingProps {
  onNext: () => void
}

export function GoalSettingWorkshop({ onNext }: GoalSettingProps) {
  const { data, updateGoalData } = useOnboardingStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedGoal, setSelectedGoal] = useState('')
  const [customGoal, setCustomGoal] = useState('')
  const [timeline, setTimeline] = useState('')
  const [motivation, setMotivation] = useState('')
  const [showVisualization, setShowVisualization] = useState(false)
  
  const sport = data.sport_selection?.sport || 'your sport'
  const experienceLevel = data.experience_level?.level || 'beginner'

  const commonGoals = [
    {
      id: 'team_selection',
      title: 'Make the Team',
      description: 'Earn a spot on your dream team',
      icon: '🎯',
      gradient: 'from-emerald-500 to-teal-600',
      timeframes: ['This season', 'Next school year', 'Within 2 years']
    },
    {
      id: 'skill_mastery',
      title: 'Master Key Skills',
      description: 'Perfect the fundamentals that matter',
      icon: '⚡',
      gradient: 'from-blue-500 to-indigo-600',
      timeframes: ['In 3 months', 'By season end', 'Next year']
    },
    {
      id: 'competition_success',
      title: 'Win Competitions',
      description: 'Achieve success in tournaments/games',
      icon: '🏆',
      gradient: 'from-yellow-500 to-orange-600',
      timeframes: ['This season', 'Regional level', 'State/National']
    },
    {
      id: 'leadership',
      title: 'Become a Leader',
      description: 'Inspire and guide your teammates',
      icon: '👑',
      gradient: 'from-purple-500 to-pink-600',
      timeframes: ['Team captain', 'Mentor role', 'Community leader']
    },
    {
      id: 'scholarship',
      title: 'Earn Athletic Scholarship',
      description: 'Get recognized for your talent',
      icon: '🎓',
      gradient: 'from-red-500 to-rose-600',
      timeframes: ['High school', 'College prep', 'Division level']
    },
    {
      id: 'personal_best',
      title: 'Break Personal Records',
      description: 'Push beyond your current limits',
      icon: '📈',
      gradient: 'from-cyan-500 to-blue-600',
      timeframes: ['Next month', 'This season', 'Personal milestone']
    }
  ]

  const steps = [
    {
      title: 'Choose Your North Star',
      subtitle: 'What victory looks like for you',
      component: 'goal-selection'
    },
    {
      title: 'Map Your Timeline',
      subtitle: 'When will you achieve this goal?',
      component: 'timeline'
    },
    {
      title: 'Find Your Why',
      subtitle: 'What drives you to pursue this?',
      component: 'motivation'
    },
    {
      title: 'See It, Achieve It',
      subtitle: 'Visualize your moment of triumph',
      component: 'visualization'
    }
  ]

  const currentStepData = steps[currentStep]
  const selectedGoalData = commonGoals.find(g => g.id === selectedGoal)

  const canContinue = () => {
    switch (currentStep) {
      case 0: return selectedGoal || customGoal.trim()
      case 1: return timeline
      case 2: return motivation.trim().length > 10
      case 3: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      if (currentStep === 2) {
        setShowVisualization(true)
      }
    } else {
      // Complete goal setting
      updateGoalData({
        primary_goal: selectedGoal || 'custom',
        custom_goal: customGoal || undefined,
        timeline,
        motivation,
        visualization_complete: showVisualization
      })
      onNext()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Goal-Setting Workshop
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Champions don't just dream—they set clear, powerful goals and create the path to achieve them.
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <motion.div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg' 
                      : 'bg-white/20 text-gray-400'
                  }`}
                  animate={index === currentStep ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 0px rgba(16, 185, 129, 0.5)",
                      "0 0 20px rgba(16, 185, 129, 0.8)",
                      "0 0 0px rgba(16, 185, 129, 0.5)"
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {index + 1}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                    index < currentStep ? 'bg-emerald-400' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Header */}
        <motion.div
          className="text-center mb-8"
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-300 text-lg">
            {currentStepData.subtitle}
          </p>
        </motion.div>

        {/* Step Content */}
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/20 min-h-[400px] flex items-center justify-center"
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Goal Selection */}
          {currentStep === 0 && (
            <div className="w-full">
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {commonGoals.map((goal) => (
                  <motion.button
                    key={goal.id}
                    onClick={() => {
                      setSelectedGoal(goal.id)
                      setCustomGoal('')
                    }}
                    className={`
                      relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 text-left
                      ${selectedGoal === goal.id
                        ? `bg-gradient-to-br ${goal.gradient} border-white shadow-2xl`
                        : 'bg-white/5 border-white/30 hover:bg-white/10 hover:border-white/50'
                      }
                    `}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start space-x-4">
                      <span className="text-3xl">{goal.icon}</span>
                      <div>
                        <h3 className="text-white font-bold text-lg mb-2">
                          {goal.title}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {goal.description}
                        </p>
                      </div>
                    </div>

                    {selectedGoal === goal.id && (
                      <motion.div
                        className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                      >
                        <span className="text-gray-900 text-lg">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Custom Goal Option */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-bold text-lg mb-4">
                  Or create your own goal:
                </h3>
                <textarea
                  value={customGoal}
                  onChange={(e) => {
                    setCustomGoal(e.target.value)
                    setSelectedGoal('')
                  }}
                  placeholder="Describe your unique goal in detail..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-emerald-400 focus:outline-none resize-none h-24"
                />
              </div>
            </div>
          )}

          {/* Timeline Selection */}
          {currentStep === 1 && selectedGoalData && (
            <div className="w-full text-center">
              <div className="mb-8">
                <div className="flex items-center justify-center mb-6">
                  <span className="text-4xl mr-4">{selectedGoalData.icon}</span>
                  <div>
                    <h3 className="text-white text-2xl font-bold">
                      {selectedGoalData.title}
                    </h3>
                    <p className="text-gray-300">
                      When do you want to achieve this?
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 max-w-lg mx-auto">
                {selectedGoalData.timeframes.map((timeframe) => (
                  <motion.button
                    key={timeframe}
                    onClick={() => setTimeline(timeframe)}
                    className={`
                      p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105
                      ${timeline === timeframe
                        ? `bg-gradient-to-br ${selectedGoalData.gradient} border-white shadow-2xl`
                        : 'bg-white/5 border-white/30 hover:bg-white/10 hover:border-white/50'
                      }
                    `}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-white font-bold text-lg">
                      {timeframe}
                    </span>
                    {timeline === timeframe && (
                      <motion.div
                        className="mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <span className="text-yellow-300">🎯 Target locked!</span>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Motivation */}
          {currentStep === 2 && (
            <div className="w-full max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-white text-xl font-bold mb-4">
                  What's driving this goal?
                </h3>
                <p className="text-gray-300">
                  Your "why" is what will carry you through the tough moments. Make it powerful.
                </p>
              </div>

              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="I want to achieve this because... (Write from your heart - this is for you!)"
                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:border-emerald-400 focus:outline-none resize-none h-32 text-lg"
              />

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">
                  {motivation.length}/200 characters • Minimum 10 characters
                </p>
                {motivation.length >= 10 && (
                  <motion.p
                    className="text-emerald-400 font-medium mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ✨ Powerful motivation detected!
                  </motion.p>
                )}
              </div>
            </div>
          )}

          {/* Visualization */}
          {currentStep === 3 && (
            <VisualizationExercise
              goal={selectedGoalData?.title || customGoal}
              timeline={timeline}
              motivation={motivation}
            />
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            className="px-6 py-3 text-white border-white/30 hover:bg-white/10"
          >
            ← Previous
          </Button>

          <AnimatePresence>
            {canContinue() && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 text-lg font-bold rounded-full shadow-2xl"
                >
                  {currentStep === steps.length - 1 
                    ? "Lock In My Goal! 🔒" 
                    : "Continue →"
                  }
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Visualization Exercise Component
function VisualizationExercise({ 
  goal, 
  timeline, 
  motivation 
}: { 
  goal: string
  timeline: string
  motivation: string 
}) {
  const [step, setStep] = useState(0)
  const [isVisualizing, setIsVisualizing] = useState(false)

  const visualizationSteps = [
    {
      instruction: "Close your eyes and take three deep breaths...",
      duration: 3000
    },
    {
      instruction: "Picture yourself achieving your goal...",
      duration: 4000
    },
    {
      instruction: "What do you see? Feel the moment...",
      duration: 4000
    },
    {
      instruction: "Who's there celebrating with you?",
      duration: 3000
    },
    {
      instruction: "This is your future. Hold onto this feeling.",
      duration: 3000
    }
  ]

  const startVisualization = () => {
    setIsVisualizing(true)
    setStep(0)
    
    const runStep = (stepIndex: number) => {
      if (stepIndex < visualizationSteps.length) {
        setTimeout(() => {
          setStep(stepIndex + 1)
          if (stepIndex + 1 < visualizationSteps.length) {
            runStep(stepIndex + 1)
          } else {
            setTimeout(() => {
              setIsVisualizing(false)
            }, 2000)
          }
        }, visualizationSteps[stepIndex].duration)
      }
    }
    
    runStep(0)
  }

  if (isVisualizing) {
    return (
      <div className="w-full text-center">
        <motion.div
          className="mb-8"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mx-auto mb-8 flex items-center justify-center">
            <span className="text-4xl">🎯</span>
          </div>
        </motion.div>

        <motion.h3
          className="text-white text-2xl font-bold mb-4"
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {step < visualizationSteps.length 
            ? visualizationSteps[step].instruction
            : "You've seen your future. Now go make it real."
          }
        </motion.h3>

        {step >= visualizationSteps.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <p className="text-emerald-400 text-lg font-medium">
              ✨ Visualization complete! Your goal is now imprinted in your mind.
            </p>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full text-center">
      <div className="mb-8">
        <h3 className="text-white text-2xl font-bold mb-4">
          Let's Visualize Your Success
        </h3>
        <p className="text-gray-300 mb-6">
          Mental rehearsal is a proven technique used by elite athletes. 
          Let's practice seeing your goal achievement in vivid detail.
        </p>
        
        <div className="bg-white/5 rounded-2xl p-6 max-w-lg mx-auto mb-8">
          <h4 className="text-emerald-400 font-bold mb-3">Your Goal Summary:</h4>
          <div className="text-left text-gray-300 space-y-2">
            <p><strong>Goal:</strong> {goal}</p>
            <p><strong>Timeline:</strong> {timeline}</p>
            <p><strong>Why:</strong> {motivation.slice(0, 100)}{motivation.length > 100 ? '...' : ''}</p>
          </div>
        </div>
      </div>

      <Button
        onClick={startVisualization}
        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-4 text-lg font-bold rounded-full shadow-2xl"
      >
        Start Visualization Exercise 🧠
      </Button>
    </div>
  )
}