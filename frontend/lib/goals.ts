// Goal Tracking System for Baby Goats Elite Development

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'resilient' | 'relentless' | 'fearless';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  target_value: number;
  target_unit: 'count' | 'days' | 'hours' | 'points';
  is_active: boolean;
  created_date: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  goal_id: string;
  current_progress: number;
  target_progress: number;
  start_date: string;
  target_completion_date?: string;
  completion_date?: string;
  is_completed: boolean;
  streak_count: number;
  last_activity_date?: string;
  goal: Goal;
}

export interface GoalProgress {
  goal_id: string;
  user_id: string;
  progress_value: number;
  progress_date: string;
  notes?: string;
}

export interface CharacterPillar {
  name: 'resilient' | 'relentless' | 'fearless';
  display_name: string;
  description: string;
  color: string;
  icon: string;
  total_goals: number;
  completed_goals: number;
  current_streak: number;
  best_streak: number;
  progress_percentage: number;
}

export interface ProgressMetrics {
  total_goals_set: number;
  total_goals_completed: number;
  current_active_goals: number;
  overall_completion_rate: number;
  current_streak: number;
  best_streak: number;
  total_days_active: number;
  average_completion_time: number; // in days
  character_pillars: CharacterPillar[];
  recent_achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'completion' | 'milestone' | 'pillar';
  icon: string;
  earned_date: string;
  points_awarded: number;
}

export interface StreakData {
  current_streak: number;
  best_streak: number;
  streak_start_date?: string;
  streak_goals: string[]; // goal IDs contributing to current streak
  milestone_reached: boolean;
  next_milestone: number;
}

// Predefined Elite Goals for Character Development
export const ELITE_GOALS: Goal[] = [
  // RESILIENT Goals
  {
    id: 'resilient_1',
    title: 'Daily Mental Toughness Practice',
    description: 'Complete daily mental resilience exercises for building champion mindset',
    category: 'resilient',
    difficulty: 'beginner',
    target_value: 30,
    target_unit: 'days',
    is_active: true,
    created_date: new Date().toISOString(),
  },
  {
    id: 'resilient_2',
    title: 'Overcome Challenge Setbacks',
    description: 'Bounce back from failed attempts and maintain forward momentum',
    category: 'resilient',
    difficulty: 'intermediate',
    target_value: 5,
    target_unit: 'count',
    is_active: true,
    created_date: new Date().toISOString(),
  },
  {
    id: 'resilient_3',
    title: 'Elite Mindset Mastery',
    description: 'Develop unshakeable confidence through consistent mental training',
    category: 'resilient',
    difficulty: 'advanced',
    target_value: 100,
    target_unit: 'points',
    is_active: true,
    created_date: new Date().toISOString(),
  },

  // RELENTLESS Goals
  {
    id: 'relentless_1',
    title: 'Consistency Champion',
    description: 'Complete training challenges without missing a single day',
    category: 'relentless',
    difficulty: 'beginner',
    target_value: 14,
    target_unit: 'days',
    is_active: true,
    created_date: new Date().toISOString(),
  },
  {
    id: 'relentless_2',
    title: 'Peak Performance Pursuit',
    description: 'Push beyond comfort zone with advanced challenges',
    category: 'relentless',
    difficulty: 'intermediate',
    target_value: 25,
    target_unit: 'count',
    is_active: true,
    created_date: new Date().toISOString(),
  },
  {
    id: 'relentless_3',
    title: 'Unstoppable Force',
    description: 'Achieve elite-level performance through relentless dedication',
    category: 'relentless',
    difficulty: 'elite',
    target_value: 500,
    target_unit: 'points',
    is_active: true,
    created_date: new Date().toISOString(),
  },

  // FEARLESS Goals
  {
    id: 'fearless_1',
    title: 'Comfort Zone Crusher',
    description: 'Take on challenges that push your boundaries daily',
    category: 'fearless',
    difficulty: 'beginner',
    target_value: 7,
    target_unit: 'days',
    is_active: true,
    created_date: new Date().toISOString(),
  },
  {
    id: 'fearless_2',
    title: 'Bold Action Taker',
    description: 'Execute on goals that seemed impossible before',
    category: 'fearless',
    difficulty: 'intermediate',
    target_value: 10,
    target_unit: 'count',
    is_active: true,
    created_date: new Date().toISOString(),
  },
  {
    id: 'fearless_3',
    title: 'Legendary Courage',
    description: 'Demonstrate fearless leadership in elite performance',
    category: 'fearless',
    difficulty: 'elite',
    target_value: 1000,
    target_unit: 'points',
    is_active: true,
    created_date: new Date().toISOString(),
  },
];

export const CHARACTER_PILLARS_CONFIG = {
  resilient: {
    name: 'resilient' as const,
    display_name: 'RESILIENT',
    description: 'Mental toughness and ability to bounce back from setbacks',
    color: '#4ECDC4', // Teal
    icon: '🛡️',
  },
  relentless: {
    name: 'relentless' as const,
    display_name: 'RELENTLESS', 
    description: 'Unstoppable dedication and consistent pursuit of excellence',
    color: '#FF6B6B', // Red
    icon: '⚡',
  },
  fearless: {
    name: 'fearless' as const,
    display_name: 'FEARLESS',
    description: 'Courage to take on challenges and push beyond comfort zones',
    color: '#FFE66D', // Yellow
    icon: '🦁',
  },
};

// Goal Calculation Utilities
export const calculateProgressPercentage = (current: number, target: number): number => {
  return Math.min(Math.round((current / target) * 100), 100);
};

export const calculateStreakFromDates = (dates: string[]): number => {
  if (dates.length === 0) return 0;
  
  const sortedDates = dates.sort().reverse();
  let streak = 0;
  let expectedDate = new Date();
  
  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    const diffDays = Math.floor((expectedDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      streak++;
      expectedDate = new Date(date);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

export const getGoalDifficultyPoints = (difficulty: Goal['difficulty']): number => {
  const points = {
    beginner: 10,
    intermediate: 25,
    advanced: 50,
    elite: 100,
  };
  return points[difficulty];
};

export const getMilestoneForStreak = (streak: number): number => {
  const milestones = [3, 7, 14, 30, 60, 100, 200, 365];
  return milestones.find(m => m > streak) || streak + 100;
};