'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@/lib/onboarding-state'

// Welcome Screen 1: Hero Impact
function WelcomeHeroScreen({ onNext }: { onNext: () => void }) {
  const [showText, setShowText] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Stagger the animations
    const textTimer = setTimeout(() => setShowText(true), 1000)
    const buttonTimer = setTimeout(() => setShowButton(true), 2500)
    
    return () => {
      clearTimeout(textTimer)
      clearTimeout(buttonTimer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-red-400 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -50, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Athletic Silhouettes Animation */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
      >
        {/* Stylized Athlete Silhouettes */}
        <div className="flex space-x-4">
          {/* Basketball Player */}
          <motion.div
            className="w-16 h-20 bg-gradient-to-t from-red-500 to-red-300 rounded-t-full relative"
            animate={{ 
              y: [0, -10, 0],
              rotateY: [0, 15, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 0
            }}
          >
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-200 rounded-full" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-red-600" />
          </motion.div>

          {/* Soccer Player */}
          <motion.div
            className="w-16 h-20 bg-gradient-to-t from-green-500 to-green-300 rounded-t-full relative"
            animate={{ 
              y: [0, -8, 0],
              rotateY: [0, -15, 0]
            }}
            transition={{ 
              duration: 2.2, 
              repeat: Infinity,
              delay: 0.3
            }}
          >
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-200 rounded-full" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-green-600" />
          </motion.div>

          {/* Runner */}
          <motion.div
            className="w-16 h-20 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-full relative"
            animate={{ 
              y: [0, -12, 0],
              rotateY: [0, 10, 0]
            }}
            transition={{ 
              duration: 1.8, 
              repeat: Infinity,
              delay: 0.6
            }}
          >
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-200 rounded-full" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-blue-600" />
          </motion.div>
        </div>
      </motion.div>

      {/* Main Text Animation */}
      <AnimatePresence>
        {showText && (
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-white mb-4"
              animate={{ 
                scale: [1, 1.02, 1],
                textShadow: [
                  "0 0 20px rgba(239, 68, 68, 0.5)",
                  "0 0 30px rgba(239, 68, 68, 0.8)",
                  "0 0 20px rgba(239, 68, 68, 0.5)"
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Every G.O.A.T.
            </motion.h1>
            <motion.h2 
              className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Started as a Baby G.O.A.T.
            </motion.h2>
            
            <motion.p
              className="text-gray-300 text-lg md:text-xl mt-6 max-w-md mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              Champions aren't born. They're forged through mindset, dedication, and the courage to start.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing CTA Button */}
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              bounce: 0.6, 
              duration: 0.8 
            }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(239, 68, 68, 0.3)",
                  "0 0 40px rgba(239, 68, 68, 0.6)",
                  "0 0 20px rgba(239, 68, 68, 0.3)"
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Button
                onClick={onNext}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 text-xl font-bold rounded-full shadow-2xl transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Begin Your Journey
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inspiring Quote Footer */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
      >
        <p className="text-gray-400 text-sm italic">
          "The expert in anything was once a beginner."
        </p>
      </motion.div>
    </div>
  )
}

// Welcome Screen 2: Mental Foundation
function WelcomeMentalScreen({ onNext }: { onNext: () => void }) {
  const [activePathways, setActivePathways] = useState<number[]>([])
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setShowContent(true)
  }, [])

  const pathways = [
    { id: 1, label: "Focus", x: 30, y: 20 },
    { id: 2, label: "Resilience", x: 70, y: 35 },
    { id: 3, label: "Confidence", x: 20, y: 60 },
    { id: 4, label: "Visualization", x: 80, y: 70 },
    { id: 5, label: "Pressure Control", x: 50, y: 45 }
  ]

  const handlePathwayClick = (pathwayId: number) => {
    if (!activePathways.includes(pathwayId)) {
      setActivePathways([...activePathways, pathwayId])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900 flex flex-col items-center justify-center p-6 relative">
      {/* Content Container */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Champions Think Different
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              We'll rewire your mind for greatness. Tap the pathways to light up your champion mindset.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Brain Visualization */}
      <motion.div
        className="relative w-80 h-80 mb-8"
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, duration: 1, type: "spring" }}
      >
        {/* Brain Outline */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M50 100 Q50 50, 100 50 Q150 50, 150 100 Q150 150, 100 150 Q50 150, 50 100"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            fill="rgba(255,255,255,0.05)"
          />
        </svg>

        {/* Neural Pathways */}
        {pathways.map((pathway) => (
          <motion.button
            key={pathway.id}
            className={`absolute w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-300 ${
              activePathways.includes(pathway.id)
                ? 'bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-400/50'
                : 'bg-transparent border-white/50 hover:border-white/80'
            }`}
            style={{
              left: `${pathway.x}%`,
              top: `${pathway.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => handlePathwayClick(pathway.id)}
            animate={
              activePathways.includes(pathway.id)
                ? {
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8]
                  }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity }}
          >
            {activePathways.includes(pathway.id) && (
              <motion.div
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-yellow-400 px-2 py-1 rounded text-xs font-bold whitespace-nowrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {pathway.label}
              </motion.div>
            )}
          </motion.button>
        ))}

        {/* Connection Lines */}
        {activePathways.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {activePathways.slice(1).map((pathwayId, index) => {
              const prevPathway = pathways.find(p => p.id === activePathways[index])
              const currentPathway = pathways.find(p => p.id === pathwayId)
              
              if (!prevPathway || !currentPathway) return null
              
              return (
                <motion.line
                  key={`${prevPathway.id}-${currentPathway.id}`}
                  x1={`${prevPathway.x}%`}
                  y1={`${prevPathway.y}%`}
                  x2={`${currentPathway.x}%`}
                  y2={`${currentPathway.y}%`}
                  stroke="rgba(251, 191, 36, 0.6)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8 }}
                />
              )
            })}
          </svg>
        )}
      </motion.div>

      {/* Yogi Berra Quote */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <p className="text-lg text-gray-300 italic mb-2">
          "It's 90% mental, and the other half is physical"
        </p>
        <p className="text-sm text-gray-400">- Yogi Berra</p>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <p className="text-sm text-gray-400">
          Pathways Activated: {activePathways.length} / {pathways.length}
        </p>
      </motion.div>

      {/* Continue Button */}
      <AnimatePresence>
        {activePathways.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <Button
              onClick={onNext}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3 text-lg font-bold rounded-full"
            >
              Neural Pathways Activated ⚡
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Welcome Screen 3: Future Self
function WelcomeFutureScreen({ onNext }: { onNext: () => void }) {
  const [morphValue, setMorphValue] = useState(0)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setShowContent(true)
  }, [])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMorphValue(parseInt(e.target.value))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              See the Champion You're Becoming
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Move the slider to glimpse your future self. Every great athlete started with a vision.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split Screen Visualization */}
      <motion.div
        className="relative w-full max-w-4xl h-64 mb-8 rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        {/* Current Self Side */}
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-600 to-gray-500 flex items-center justify-center transition-all duration-300"
          style={{ width: `${100 - morphValue}%` }}
        >
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🏃</span>
            </div>
            <h3 className="text-lg font-bold">Current You</h3>
            <p className="text-sm opacity-80">Starting the journey</p>
          </div>
        </div>

        {/* Future Champion Side */}
        <div 
          className="absolute right-0 top-0 h-full bg-gradient-to-r from-gold-500 to-yellow-400 flex items-center justify-center transition-all duration-300"
          style={{ width: `${morphValue}%` }}
        >
          <div className="text-center text-gray-900">
            <motion.div 
              className="w-20 h-20 bg-yellow-300 rounded-full mx-auto mb-4 flex items-center justify-center"
              animate={{ 
                scale: morphValue > 50 ? [1, 1.1, 1] : 1,
                rotate: morphValue > 70 ? [0, 10, -10, 0] : 0
              }}
              transition={{ duration: 1, repeat: morphValue > 50 ? Infinity : 0 }}
            >
              <span className="text-2xl">🏆</span>
            </motion.div>
            <h3 className="text-lg font-bold">Champion You</h3>
            <p className="text-sm opacity-80">Living your potential</p>
          </div>
        </div>

        {/* Divider Line */}
        <div 
          className="absolute top-0 h-full w-1 bg-white opacity-50 transition-all duration-300"
          style={{ left: `${100 - morphValue}%` }}
        />
      </motion.div>

      {/* Interactive Slider */}
      <motion.div
        className="w-full max-w-md mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <input
          type="range"
          min="0"
          max="100"
          value={morphValue}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #6b7280 0%, #6b7280 ${morphValue}%, #374151 ${morphValue}%, #374151 100%)`
          }}
        />
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>Today</span>
          <span>Your Champion Future</span>
        </div>
      </motion.div>

      {/* Dynamic Messaging */}
      <motion.div
        className="text-center mb-8"
        key={morphValue} // Re-animate when morphValue changes
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {morphValue < 25 && (
          <p className="text-gray-300 text-lg">Every journey begins with a single step...</p>
        )}
        {morphValue >= 25 && morphValue < 50 && (
          <p className="text-blue-300 text-lg">You're building the foundation of greatness...</p>
        )}
        {morphValue >= 50 && morphValue < 75 && (
          <p className="text-green-300 text-lg">Your potential is starting to shine through...</p>
        )}
        {morphValue >= 75 && (
          <p className="text-yellow-300 text-lg font-bold">This is the champion within you! 🏆</p>
        )}
      </motion.div>

      {/* Continue Button */}
      <AnimatePresence>
        {morphValue > 30 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <Button
              onClick={onNext}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-8 py-3 text-lg font-bold rounded-full"
            >
              I See My Future 🌟
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Main Welcome Sequence Component
export function WelcomeSequence({ onComplete }: { onComplete: () => void }) {
  const { data, setCurrentStep, completeStep } = useOnboardingStore()
  const [currentScreen, setCurrentScreen] = useState(0)

  const screens = [
    { component: WelcomeHeroScreen, step: 'welcome-hero' as const },
    { component: WelcomeMentalScreen, step: 'welcome-mental' as const },
    { component: WelcomeFutureScreen, step: 'welcome-future' as const }
  ]

  const handleNext = () => {
    const currentScreenData = screens[currentScreen]
    completeStep(currentScreenData.step)
    
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1)
      setCurrentStep(screens[currentScreen + 1].step)
    } else {
      onComplete()
    }
  }

  const CurrentScreenComponent = screens[currentScreen].component

  return (
    <div className="relative">
      {/* Progress Indicator */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex space-x-2">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index <= currentScreen 
                  ? 'bg-white shadow-lg' 
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current Screen */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <CurrentScreenComponent onNext={handleNext} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}