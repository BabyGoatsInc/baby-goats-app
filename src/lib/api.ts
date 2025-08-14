// API integration utilities for Baby Goats application
import { createClient } from '@/lib/supabase/client'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com' 
  : 'http://localhost:3002'

// Get auth token for API requests
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    })
  }
}

// Generic API request handler with error handling
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return { data: null, error: errorData.error || `HTTP ${response.status}` }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error('API request failed:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Network error' 
    }
  }
}

// Profiles API
export const profilesApi = {
  // Get all profiles with optional filters
  getProfiles: async (params: {
    sport?: string
    grad_year?: number
    search?: string
    limit?: number
    offset?: number
  } = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    return apiRequest<{
      profiles: any[]
      pagination: { limit: number; offset: number; hasMore: boolean }
    }>(`/profiles?${searchParams.toString()}`)
  },

  // Create or update profile
  updateProfile: async (profileData: any) => {
    return apiRequest<{ profile: any }>('/profiles', {
      method: 'POST',
      body: JSON.stringify(profileData),
    })
  }
}

// Highlights API
export const highlightsApi = {
  // Get highlights with optional filters
  getHighlights: async (params: {
    user_id?: string
    is_featured?: boolean
    limit?: number
    offset?: number
  } = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    return apiRequest<{
      highlights: any[]
      pagination: { limit: number; offset: number; hasMore: boolean }
    }>(`/highlights?${searchParams.toString()}`)
  },

  // Create new highlight
  createHighlight: async (highlightData: {
    user_id: string
    title: string
    video_url: string
    description?: string
  }) => {
    return apiRequest<{ highlight: any }>('/highlights', {
      method: 'POST',
      body: JSON.stringify(highlightData),
    })
  },

  // Update highlight
  updateHighlight: async (id: string, highlightData: any) => {
    return apiRequest<{ highlight: any }>(`/highlights`, {
      method: 'PUT',
      body: JSON.stringify({ id, ...highlightData }),
    })
  },

  // Delete highlight
  deleteHighlight: async (id: string) => {
    return apiRequest<{ message: string }>(`/highlights?id=${id}`, {
      method: 'DELETE',
    })
  }
}

// Stats API
export const statsApi = {
  // Get stats with optional filters
  getStats: async (params: {
    user_id?: string
    category?: string
    stat_name?: string
    limit?: number
    offset?: number
  } = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    return apiRequest<{
      stats: any[]
      pagination: { limit: number; offset: number; hasMore: boolean }
    }>(`/stats?${searchParams.toString()}`)
  },

  // Create or update stat
  createStat: async (statData: {
    user_id: string
    stat_name: string
    value: number
    unit?: string
    category: string
  }) => {
    return apiRequest<{ stat: any }>('/stats', {
      method: 'POST',
      body: JSON.stringify(statData),
    })
  },

  // Update specific stat
  updateStat: async (id: string, statData: any) => {
    return apiRequest<{ stat: any }>('/stats', {
      method: 'PUT',
      body: JSON.stringify({ id, ...statData }),
    })
  },

  // Delete stat
  deleteStat: async (id: string) => {
    return apiRequest<{ message: string }>(`/stats?id=${id}`, {
      method: 'DELETE',
    })
  },

  // Get user stats summary
  getStatsSummary: async (userId: string) => {
    return apiRequest<{
      summary: Record<string, any[]>
      total_stats: number
    }>(`/stats/summary?user_id=${userId}`)
  }
}

// Challenges API
export const challengesApi = {
  // Get challenges with optional filters
  getChallenges: async (params: {
    category?: string
    difficulty?: string
    is_active?: boolean
    user_id?: string
    limit?: number
    offset?: number
  } = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    return apiRequest<{
      challenges: any[]
      pagination: { limit: number; offset: number; hasMore: boolean }
    }>(`/challenges?${searchParams.toString()}`)
  },

  // Complete a challenge
  completeChallenge: async (challengeData: {
    user_id: string
    challenge_id: string
    notes?: string
  }) => {
    return apiRequest<{
      completion: any
      message: string
      points_earned: number
    }>('/challenges', {
      method: 'POST',
      body: JSON.stringify(challengeData),
    })
  },

  // Get user challenge statistics
  getChallengeStats: async (userId: string) => {
    return apiRequest<{
      stats: {
        total_completed: number
        total_points: number
        categories: Record<string, any>
        streak: number
        recent_completions: any[]
      }
    }>(`/challenges/user-stats?user_id=${userId}`)
  }
}

// Likes API
export const likesApi = {
  // Toggle like on a highlight
  toggleLike: async (likeData: {
    user_id: string
    highlight_id: string
  }) => {
    return apiRequest<{
      liked: boolean
      like?: any
      message: string
    }>('/likes', {
      method: 'POST',
      body: JSON.stringify(likeData),
    })
  },

  // Get likes for highlight or user
  getLikes: async (params: {
    highlight_id?: string
    user_id?: string
    limit?: number
    offset?: number
  }) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    return apiRequest<{
      likes: any[]
      pagination: { limit: number; offset: number; hasMore: boolean }
    }>(`/likes?${searchParams.toString()}`)
  },

  // Check if user liked a highlight
  checkLike: async (userId: string, highlightId: string) => {
    return apiRequest<{
      liked: boolean
      liked_at: string | null
    }>(`/likes/check?user_id=${userId}&highlight_id=${highlightId}`)
  }
}

// Helper function for error notifications
export const handleApiError = (error: string | null, fallbackMessage = 'An error occurred') => {
  if (error) {
    console.error('API Error:', error)
    // You can integrate with your notification system here
    // For now, we'll use a simple alert
    alert(error)
    return error
  }
  return null
}

// Helper function for success notifications  
export const handleApiSuccess = (message: string) => {
  console.log('API Success:', message)
  // You can integrate with your notification system here
  return message
}