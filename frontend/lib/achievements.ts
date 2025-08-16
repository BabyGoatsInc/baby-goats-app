// Achievement System for Baby Goats Elite Development Platform

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'completion' | 'pillar' | 'milestone' | 'level' | 'special';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  icon: string;
  badge_color: string;
  points_awarded: number;
  requirements: AchievementRequirement;
  is_hidden?: boolean; // Hidden until requirements are met
  unlock_message?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementRequirement {
  type: 'streak' | 'goal_completion' | 'pillar_progress' | 'total_points' | 'days_active' | 'level_reached';
  target_value: number;
  pillar?: 'resilient' | 'relentless' | 'fearless';
  goal_category?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_date: string;
  progress_when_earned: number;
  achievement: Achievement;
}

export interface CharacterLevel {
  level: number;
  title: string;
  description: string;
  pillar: 'resilient' | 'relentless' | 'fearless';
  points_required: number;
  badge_icon: string;
  badge_color: string;
  special_privileges?: string[];
}

export interface UserLevel {
  pillar: 'resilient' | 'relentless' | 'fearless';
  current_level: number;
  current_points: number;
  points_to_next_level: number;
  total_levels_unlocked: number;
  current_title: string;
  next_title: string;
  level_progress_percentage: number;
}

export interface AchievementProgress {
  achievement_id: string;
  current_progress: number;
  target_progress: number;
  progress_percentage: number;
  is_completed: boolean;
  estimated_completion_date?: string;
}

// Elite Achievement Definitions
export const ELITE_ACHIEVEMENTS: Achievement[] = [
  // STREAK ACHIEVEMENTS
  {
    id: 'streak_fire_3',
    title: 'Ignition',
    description: 'Complete 3 consecutive days of training',
    category: 'streak',
    difficulty: 'bronze',
    icon: '🔥',
    badge_color: '#CD7F32',
    points_awarded: 50,
    requirements: {
      type: 'streak',
      target_value: 3,
      timeframe: 'daily'
    },
    unlock_message: 'The fire within you has been ignited!',
    rarity: 'common'
  },
  {
    id: 'streak_flame_7',
    title: 'Flame Keeper',
    description: 'Maintain a 7-day training streak',
    category: 'streak',
    difficulty: 'silver',
    icon: '🔥',
    badge_color: '#C0C0C0',
    points_awarded: 150,
    requirements: {
      type: 'streak',
      target_value: 7,
      timeframe: 'daily'
    },
    unlock_message: 'Your dedication burns bright!',
    rarity: 'rare'
  },
  {
    id: 'streak_inferno_30',
    title: 'Inferno Master',
    description: 'Achieve an unstoppable 30-day streak',
    category: 'streak',
    difficulty: 'gold',
    icon: '🔥',
    badge_color: '#FFD700',
    points_awarded: 500,
    requirements: {
      type: 'streak',
      target_value: 30,
      timeframe: 'daily'
    },
    unlock_message: 'You are unstoppable! Elite dedication achieved.',
    rarity: 'epic'
  },
  {
    id: 'streak_phoenix_100',
    title: 'Phoenix Rising',
    description: 'Legendary 100-day streak - Elite Champion status',
    category: 'streak',
    difficulty: 'legendary',
    icon: '🔥',
    badge_color: '#B19CD9',
    points_awarded: 2000,
    requirements: {
      type: 'streak',
      target_value: 100,
      timeframe: 'daily'
    },
    unlock_message: 'LEGENDARY STATUS ACHIEVED! You have risen like a phoenix!',
    rarity: 'legendary',
    is_hidden: true
  },

  // PILLAR ACHIEVEMENTS - RESILIENT
  {
    id: 'resilient_foundation',
    title: 'Mental Fortress',
    description: 'Complete 5 Resilient pillar goals',
    category: 'pillar',
    difficulty: 'bronze',
    icon: '🛡️',
    badge_color: '#4ECDC4',
    points_awarded: 100,
    requirements: {
      type: 'goal_completion',
      target_value: 5,
      pillar: 'resilient'
    },
    unlock_message: 'Your mental fortress grows stronger!',
    rarity: 'common'
  },
  {
    id: 'resilient_champion',
    title: 'Resilience Champion',
    description: 'Master the art of bouncing back - 15 Resilient goals',
    category: 'pillar',
    difficulty: 'gold',
    icon: '🛡️',
    badge_color: '#4ECDC4',
    points_awarded: 300,
    requirements: {
      type: 'goal_completion',
      target_value: 15,
      pillar: 'resilient'
    },
    unlock_message: 'Unbreakable resilience! You are a true champion.',
    rarity: 'epic'
  },

  // PILLAR ACHIEVEMENTS - RELENTLESS
  {
    id: 'relentless_warrior',
    title: 'Warrior Spirit',
    description: 'Show relentless dedication - 5 Relentless goals',
    category: 'pillar',
    difficulty: 'bronze',
    icon: '⚡',
    badge_color: '#FF6B6B',
    points_awarded: 100,
    requirements: {
      type: 'goal_completion',
      target_value: 5,
      pillar: 'relentless'
    },
    unlock_message: 'The warrior spirit awakens within you!',
    rarity: 'common'
  },
  {
    id: 'relentless_unstoppable',
    title: 'Unstoppable Force',
    description: 'Become truly unstoppable - 15 Relentless goals',
    category: 'pillar',
    difficulty: 'gold',
    icon: '⚡',
    badge_color: '#FF6B6B',
    points_awarded: 300,
    requirements: {
      type: 'goal_completion',
      target_value: 15,
      pillar: 'relentless'
    },
    unlock_message: 'Nothing can stop you now! Elite relentlessness achieved.',
    rarity: 'epic'
  },

  // PILLAR ACHIEVEMENTS - FEARLESS
  {
    id: 'fearless_courage',
    title: 'Courage Rising',
    description: 'Embrace courage - 5 Fearless goals completed',
    category: 'pillar',
    difficulty: 'bronze',
    icon: '🦁',
    badge_color: '#FFE66D',
    points_awarded: 100,
    requirements: {
      type: 'goal_completion',
      target_value: 5,
      pillar: 'fearless'
    },
    unlock_message: 'Courage courses through your veins!',
    rarity: 'common'
  },
  {
    id: 'fearless_legend',
    title: 'Fearless Legend',
    description: 'Legendary courage - 15 Fearless goals mastered',
    category: 'pillar',
    difficulty: 'gold',
    icon: '🦁',
    badge_color: '#FFE66D',
    points_awarded: 300,
    requirements: {
      type: 'goal_completion',
      target_value: 15,
      pillar: 'fearless'
    },
    unlock_message: 'Fearless legend status! Your courage inspires others.',
    rarity: 'epic'
  },

  // MILESTONE ACHIEVEMENTS
  {
    id: 'first_goal',
    title: 'First Victory',
    description: 'Complete your very first goal',
    category: 'milestone',
    difficulty: 'bronze',
    icon: '🎯',
    badge_color: '#CD7F32',
    points_awarded: 25,
    requirements: {
      type: 'goal_completion',
      target_value: 1
    },
    unlock_message: 'Every champion starts with a single step!',
    rarity: 'common'
  },
  {
    id: 'goal_master_50',  
    title: 'Goal Master',
    description: 'Elite dedication - 50 total goals completed',
    category: 'milestone',
    difficulty: 'platinum',
    icon: '🎯',
    badge_color: '#E5E4E2',
    points_awarded: 1000,
    requirements: {
      type: 'goal_completion',
      target_value: 50
    },
    unlock_message: 'GOAL MASTER ACHIEVED! Your dedication is legendary.',
    rarity: 'legendary'
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: 'triple_crown',
    title: 'Triple Crown',
    description: 'Achieve Gold level in all three character pillars',
    category: 'special',
    difficulty: 'legendary',
    icon: '👑',
    badge_color: '#FFD700',
    points_awarded: 2500,
    requirements: {
      type: 'level_reached',
      target_value: 3 // Gold level in all pillars
    },
    unlock_message: 'TRIPLE CROWN CHAMPION! You have mastered all pillars of greatness!',
    rarity: 'legendary',
    is_hidden: true
  },
  {
    id: 'point_collector_1000',
    title: 'Elite Collector',
    description: 'Accumulate 1000 achievement points',
    category: 'special',
    difficulty: 'gold',
    icon: '💎',
    badge_color: '#FFD700',
    points_awarded: 200,
    requirements: {
      type: 'total_points',
      target_value: 1000
    },
    unlock_message: 'Elite point collector! Your dedication shines bright.',
    rarity: 'epic'
  }
];

// Character Development Levels
export const CHARACTER_LEVELS: Record<'resilient' | 'relentless' | 'fearless', CharacterLevel[]> = {
  resilient: [
    {
      level: 1,
      title: 'Developing Resilience',
      description: 'Building mental toughness foundation',
      pillar: 'resilient',
      points_required: 0,
      badge_icon: '🛡️',
      badge_color: '#CD7F32'
    },
    {
      level: 2,
      title: 'Resilient Athlete',
      description: 'Showing consistent mental strength',
      pillar: 'resilient',
      points_required: 200,
      badge_icon: '🛡️',
      badge_color: '#C0C0C0'
    },
    {
      level: 3,
      title: 'Mental Fortress',
      description: 'Unshakeable mental toughness',
      pillar: 'resilient',
      points_required: 500,
      badge_icon: '🛡️',
      badge_color: '#FFD700'
    },
    {
      level: 4,
      title: 'Resilience Master',
      description: 'Elite mental strength and recovery',
      pillar: 'resilient',
      points_required: 1000,
      badge_icon: '🛡️',
      badge_color: '#E5E4E2',
      special_privileges: ['Mentor access', 'Advanced challenges']
    },
    {
      level: 5,
      title: 'Unbreakable Legend',
      description: 'Legendary resilience that inspires others',
      pillar: 'resilient',
      points_required: 2000,
      badge_icon: '🛡️',
      badge_color: '#B19CD9',
      special_privileges: ['Elite coaching', 'Leadership opportunities', 'Special recognition']
    }
  ],
  relentless: [
    {
      level: 1,
      title: 'Developing Drive',
      description: 'Building dedication and consistency',
      pillar: 'relentless',
      points_required: 0,
      badge_icon: '⚡',
      badge_color: '#CD7F32'
    },
    {
      level: 2,
      title: 'Dedicated Athlete',
      description: 'Showing consistent effort and drive',
      pillar: 'relentless',
      points_required: 200,
      badge_icon: '⚡',
      badge_color: '#C0C0C0'
    },
    {
      level: 3,
      title: 'Relentless Warrior',
      description: 'Unstoppable dedication to excellence',
      pillar: 'relentless',
      points_required: 500,
      badge_icon: '⚡',
      badge_color: '#FFD700'
    },
    {
      level: 4,
      title: 'Drive Master',
      description: 'Elite-level relentless pursuit',
      pillar: 'relentless',
      points_required: 1000,
      badge_icon: '⚡',
      badge_color: '#E5E4E2',
      special_privileges: ['Advanced training', 'Performance analytics']
    },
    {
      level: 5,
      title: 'Unstoppable Legend',
      description: 'Legendary drive that motivates champions',
      pillar: 'relentless',
      points_required: 2000,
      badge_icon: '⚡',
      badge_color: '#B19CD9',
      special_privileges: ['Elite mentorship', 'Championship access', 'Hall of fame']
    }
  ],
  fearless: [
    {
      level: 1,
      title: 'Building Courage',
      description: 'Developing fearless mindset',
      pillar: 'fearless',
      points_required: 0,
      badge_icon: '🦁',
      badge_color: '#CD7F32'
    },
    {
      level: 2,
      title: 'Brave Athlete',
      description: 'Taking on challenges with courage',
      pillar: 'fearless',
      points_required: 200,
      badge_icon: '🦁',
      badge_color: '#C0C0C0'
    },
    {
      level: 3,
      title: 'Fearless Competitor',
      description: 'Boldly pushing beyond comfort zones',
      pillar: 'fearless',
      points_required: 500,
      badge_icon: '🦁',
      badge_color: '#FFD700'
    },
    {
      level: 4,
      title: 'Courage Master',
      description: 'Elite fearlessness in all pursuits',
      pillar: 'fearless',
      points_required: 1000,
      badge_icon: '🦁',
      badge_color: '#E5E4E2',
      special_privileges: ['Leadership roles', 'Risk-taking challenges']
    },
    {
      level: 5,
      title: 'Fearless Legend',
      description: 'Legendary courage that leads others',
      pillar: 'fearless',
      points_required: 2000,
      badge_icon: '🦁',
      badge_color: '#B19CD9',
      special_privileges: ['Champion coaching', 'Inspirational speaking', 'Legacy building']
    }
  ]
};

// Achievement Calculation Utilities
export const calculateAchievementProgress = (
  achievement: Achievement,
  userStats: {
    streak_count: number;
    goals_completed: number;
    pillar_goals: Record<string, number>;
    total_points: number;
    days_active: number;
    pillar_levels: Record<string, number>;
  }
): AchievementProgress => {
  const req = achievement.requirements;
  let currentProgress = 0;

  switch (req.type) {
    case 'streak':
      currentProgress = userStats.streak_count;
      break;
    case 'goal_completion':
      if (req.pillar) {
        currentProgress = userStats.pillar_goals[req.pillar] || 0;
      } else {
        currentProgress = userStats.goals_completed;
      }
      break;
    case 'total_points':
      currentProgress = userStats.total_points;
      break;
    case 'days_active':
      currentProgress = userStats.days_active;
      break;
    case 'level_reached':
      const levels = Object.values(userStats.pillar_levels);
      currentProgress = levels.filter(level => level >= 3).length; // Gold level = 3
      break;
  }

  const progressPercentage = Math.min((currentProgress / req.target_value) * 100, 100);

  return {
    achievement_id: achievement.id,
    current_progress: currentProgress,
    target_progress: req.target_value,
    progress_percentage: progressPercentage,
    is_completed: currentProgress >= req.target_value
  };
};

export const calculateUserLevel = (
  pillar: 'resilient' | 'relentless' | 'fearless',
  totalPoints: number
): UserLevel => {
  const levels = CHARACTER_LEVELS[pillar];
  let currentLevel = levels[0];
  let nextLevel = levels[1];

  for (let i = 0; i < levels.length; i++) {
    if (totalPoints >= levels[i].points_required) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || levels[i]; // Cap at max level
    } else {
      break;
    }
  }

  const pointsToNext = nextLevel ? nextLevel.points_required - totalPoints : 0;
  const progressToNext = nextLevel ? 
    ((totalPoints - currentLevel.points_required) / (nextLevel.points_required - currentLevel.points_required)) * 100 : 
    100;

  return {
    pillar,
    current_level: currentLevel.level,
    current_points: totalPoints,
    points_to_next_level: Math.max(pointsToNext, 0),
    total_levels_unlocked: currentLevel.level,
    current_title: currentLevel.title,
    next_title: nextLevel ? nextLevel.title : 'Max Level',
    level_progress_percentage: Math.min(progressToNext, 100)
  };
};

export const getAchievementsByCategory = (category: Achievement['category']): Achievement[] => {
  return ELITE_ACHIEVEMENTS.filter(achievement => achievement.category === category);
};

export const getAchievementsByRarity = (rarity: Achievement['rarity']): Achievement[] => {
  return ELITE_ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity);
};

export const getHiddenAchievements = (): Achievement[] => {
  return ELITE_ACHIEVEMENTS.filter(achievement => achievement.is_hidden);
};