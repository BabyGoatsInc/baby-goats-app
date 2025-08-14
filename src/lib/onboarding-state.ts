// Elite onboarding state management system
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Onboarding step definitions
export type OnboardingStep = 
  | 'welcome-hero'
  | 'welcome-mental'
  | 'welcome-future'
  | 'sport-selection'
  | 'experience-level'
  | 'goal-setting'
  | 'schedule-setup'
  | 'mental-assessment'
  | 'goal-visualization'
  | 'commitment-pledge'
  | 'personalized-plan'
  | 'ai-coach-intro'
  | 'first-challenge'
  | 'parent-integration'
  | 'complete'

// User data interfaces
export interface SportSelection {
  sport: string
  interest_level: number
  experience_years: number
}

export interface ExperienceLevel {
  level: 'beginner' | 'intermediate' | 'advanced'
  years_playing: number
  current_team?: string
  achievements?: string[]
}

export interface GoalData {
  primary_goal: string
  timeline: string
  motivation: string
  custom_goal?: string
  visualization_complete: boolean
}

export interface SchedulePreferences {
  preferred_days: string[]
  preferred_times: string[]
  available_hours_per_week: number
  consistency_commitment: number
}

export interface MentalAssessment {
  pressure_response: string
  failure_mindset: string
  motivation_source: string
  confidence_level: number
  focus_ability: number
  athlete_type?: string
  strengths: string[]
  growth_areas: string[]
}

export interface VisualizationData {
  power_phrase: string
  visualization_audio_url?: string
  commitment_video_url?: string
  future_self_description: string
}

export interface CommitmentPledge {
  signed: boolean
  signature_data?: string
  commitment_date: string
  witnessed_by_parent: boolean
}

// Complete onboarding data structure
export interface OnboardingData {
  // Progress tracking
  current_step: OnboardingStep
  completed_steps: OnboardingStep[]
  progress_percentage: number
  start_time: string
  
  // User data
  sport_selection?: SportSelection
  experience_level?: ExperienceLevel
  goal_data?: GoalData
  schedule_preferences?: SchedulePreferences
  mental_assessment?: MentalAssessment
  visualization_data?: VisualizationData
  commitment_pledge?: CommitmentPledge
  
  // Personalization results
  personalized_plan?: any
  ai_coach_personality?: string
  initial_challenges?: any[]
  parent_dashboard_setup?: boolean
}

// Onboarding store
interface OnboardingStore {
  // State
  data: OnboardingData
  isLoading: boolean
  error: string | null
  
  // Actions
  setCurrentStep: (step: OnboardingStep) => void
  completeStep: (step: OnboardingStep) => void
  updateSportSelection: (data: SportSelection) => void
  updateExperienceLevel: (data: ExperienceLevel) => void
  updateGoalData: (data: GoalData) => void
  updateSchedulePreferences: (data: SchedulePreferences) => void
  updateMentalAssessment: (data: MentalAssessment) => void
  updateVisualizationData: (data: VisualizationData) => void
  updateCommitmentPledge: (data: CommitmentPledge) => void
  resetOnboarding: () => void
  saveProgress: () => Promise<void>
  loadProgress: () => Promise<void>
  
  // Computed values
  getProgressPercentage: () => number
  getNextStep: () => OnboardingStep | null
  getPreviousStep: () => OnboardingStep | null
  canProceed: () => boolean
}

// Step order definition
const STEP_ORDER: OnboardingStep[] = [
  'welcome-hero',
  'welcome-mental', 
  'welcome-future',
  'sport-selection',
  'experience-level',
  'goal-setting',
  'schedule-setup',
  'mental-assessment',
  'goal-visualization',
  'commitment-pledge',
  'personalized-plan',
  'ai-coach-intro',
  'first-challenge',
  'parent-integration',
  'complete'
]

// Initial state
const initialData: OnboardingData = {
  current_step: 'welcome-hero',
  completed_steps: [],
  progress_percentage: 0,
  start_time: new Date().toISOString()
}

// Create the store with persistence
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      data: initialData,
      isLoading: false,
      error: null,
      
      // Actions
      setCurrentStep: (step) => 
        set((state) => ({
          data: { ...state.data, current_step: step }
        })),
      
      completeStep: (step) =>
        set((state) => {
          const completed = [...state.data.completed_steps, step]
          const progress = (completed.length / STEP_ORDER.length) * 100
          
          return {
            data: {
              ...state.data,
              completed_steps: completed,
              progress_percentage: progress
            }
          }
        }),
      
      updateSportSelection: (sportData) =>
        set((state) => ({
          data: { ...state.data, sport_selection: sportData }
        })),
      
      updateExperienceLevel: (experienceData) =>
        set((state) => ({
          data: { ...state.data, experience_level: experienceData }
        })),
      
      updateGoalData: (goalData) =>
        set((state) => ({
          data: { ...state.data, goal_data: goalData }
        })),
      
      updateSchedulePreferences: (scheduleData) =>
        set((state) => ({
          data: { ...state.data, schedule_preferences: scheduleData }
        })),
      
      updateMentalAssessment: (assessmentData) =>
        set((state) => ({
          data: { ...state.data, mental_assessment: assessmentData }
        })),
      
      updateVisualizationData: (visualizationData) =>
        set((state) => ({
          data: { ...state.data, visualization_data: visualizationData }
        })),
      
      updateCommitmentPledge: (pledgeData) =>
        set((state) => ({
          data: { ...state.data, commitment_pledge: pledgeData }
        })),
      
      resetOnboarding: () =>
        set({ data: initialData, isLoading: false, error: null }),
      
      saveProgress: async () => {
        // TODO: Implement API call to save progress
        console.log('Saving onboarding progress...', get().data)
      },
      
      loadProgress: async () => {
        // TODO: Implement API call to load progress
        console.log('Loading onboarding progress...')
      },
      
      // Computed values
      getProgressPercentage: () => get().data.progress_percentage,
      
      getNextStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().data.current_step)
        return currentIndex < STEP_ORDER.length - 1 ? STEP_ORDER[currentIndex + 1] : null
      },
      
      getPreviousStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().data.current_step)
        return currentIndex > 0 ? STEP_ORDER[currentIndex - 1] : null
      },
      
      canProceed: () => {
        // TODO: Add step-specific validation logic
        return true
      }
    }),
    {
      name: 'baby-goats-onboarding',
      partialize: (state) => ({ data: state.data })
    }
  )
)