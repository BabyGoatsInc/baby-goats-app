import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types for the database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          sport: string
          grad_year: number | null
          hero_name: string | null
          hero_reason: string | null
          avatar_url: string | null
          age: number | null
          team_name: string | null
          jersey_number: string | null
          parent_email: string | null
          is_parent_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          sport: string
          grad_year?: number | null
          hero_name?: string | null
          hero_reason?: string | null
          avatar_url?: string | null
          age?: number | null
          team_name?: string | null
          jersey_number?: string | null
          parent_email?: string | null
          is_parent_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          sport?: string
          grad_year?: number | null
          hero_name?: string | null
          hero_reason?: string | null
          avatar_url?: string | null
          age?: number | null
          team_name?: string | null
          jersey_number?: string | null
          parent_email?: string | null
          is_parent_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      highlights: {
        Row: {
          id: string
          user_id: string
          title: string
          video_url: string
          description: string | null
          likes_count: number
          is_featured: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          video_url: string
          description?: string | null
          likes_count?: number
          is_featured?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          video_url?: string
          description?: string | null
          likes_count?: number
          is_featured?: boolean
          created_at?: string
        }
      }
      stats: {
        Row: {
          id: string
          user_id: string
          stat_name: string
          value: number
          unit: string | null
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stat_name: string
          value: number
          unit?: string | null
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stat_name?: string
          value?: number
          unit?: string | null
          category?: string
          created_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          difficulty: string
          points: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          difficulty?: string
          points?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          difficulty?: string
          points?: number
          is_active?: boolean
          created_at?: string
        }
      }
      challenge_completions: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          completed_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          completed_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          completed_at?: string
          notes?: string | null
        }
      }
      likes: {
        Row: {
          user_id: string
          highlight_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          highlight_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          highlight_id?: string
          created_at?: string
        }
      }
      debug_ping: {
        Row: {
          id: number
          note: string
          created_at: string
        }
        Insert: {
          id?: number
          note?: string
          created_at?: string
        }
        Update: {
          id?: number
          note?: string
          created_at?: string
        }
      }
    }
  }
}