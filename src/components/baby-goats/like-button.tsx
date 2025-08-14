'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'
import { likesApi, handleApiError, handleApiSuccess } from '@/lib/api'

interface LikeButtonProps {
  highlightId: string
  initialLikesCount?: number
  userId?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LikeButton({ 
  highlightId, 
  initialLikesCount = 0, 
  userId, 
  className = '',
  size = 'sm' 
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(userId || null)

  useEffect(() => {
    // Get current user if not provided
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user?.id || null)
    }

    if (!currentUser) {
      getCurrentUser()
    }
  }, [currentUser])

  useEffect(() => {
    // Check if user has liked this highlight
    const checkLikeStatus = async () => {
      if (!currentUser) return

      const { data, error } = await likesApi.checkLike(currentUser, highlightId)
      
      if (!error && data) {
        setIsLiked(data.liked)
      }
    }

    checkLikeStatus()
  }, [currentUser, highlightId])

  const handleLikeToggle = async () => {
    if (!currentUser) {
      alert('Please sign in to like highlights')
      return
    }

    setLoading(true)

    const { data, error } = await likesApi.toggleLike({
      user_id: currentUser,
      highlight_id: highlightId
    })

    if (error) {
      handleApiError(error, 'Failed to toggle like')
    } else if (data) {
      setIsLiked(data.liked)
      
      // Update likes count based on action
      if (data.liked) {
        setLikesCount(prev => prev + 1)
      } else {
        setLikesCount(prev => Math.max(0, prev - 1))
      }

      // Optional success feedback (can be removed for less noise)
      // handleApiSuccess(data.message)
    }

    setLoading(false)
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'md':
        return 'px-3 py-2 text-sm'
      case 'lg':
        return 'px-4 py-2 text-base'
      default:
        return 'px-2 py-1 text-xs'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return '14'
      case 'md':
        return '16'
      case 'lg':
        return '18'
      default:
        return '14'
    }
  }

  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      size="sm"
      onClick={handleLikeToggle}
      disabled={loading || !currentUser}
      className={`flex items-center space-x-1 ${getSizeClasses()} ${className} ${
        isLiked 
          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
          : 'border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500'
      }`}
    >
      <svg
        width={getIconSize()}
        height={getIconSize()}
        viewBox="0 0 24 24"
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <span>{loading ? '...' : likesCount}</span>
    </Button>
  )
}

// Component for displaying who liked a highlight
interface LikesListProps {
  highlightId: string
  limit?: number
  className?: string
}

export function LikesList({ highlightId, limit = 10, className = '' }: LikesListProps) {
  const [likes, setLikes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLikes = async () => {
      const { data, error } = await likesApi.getLikes({
        highlight_id: highlightId,
        limit
      })

      if (error) {
        console.error('Failed to load likes:', error)
      } else if (data) {
        setLikes(data.likes)
      }

      setLoading(false)
    }

    loadLikes()
  }, [highlightId, limit])

  if (loading) {
    return <div className={`text-sm text-gray-500 ${className}`}>Loading likes...</div>
  }

  if (likes.length === 0) {
    return <div className={`text-sm text-gray-500 ${className}`}>No likes yet</div>
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">Liked by:</h4>
      <div className="space-y-1">
        {likes.map((like) => (
          <div key={like.id} className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">
                {like.profiles?.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {like.profiles?.full_name || 'Unknown User'}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(like.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}