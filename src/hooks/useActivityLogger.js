import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { activityApi } from '../services/api'

export function useActivityLogger(pageName) {
  const { user } = useAuth()
  const userId = user?.userId
  const hasLogged = useRef(false)

  const logPageVisit = useCallback(async () => {
    try {
      await activityApi.logActivity({
        userId,
        activityType: 'PAGE_VISIT',
        pageVisited: pageName,
        timeSpentSeconds: 0,
        typingSpeedWpm: 0,
      })
    } catch {
      // Silent fail for activity logging
    }
  }, [pageName, userId])

  useEffect(() => {
    if (!hasLogged.current && userId) {
      logPageVisit()
      hasLogged.current = true
    }

    return () => {
      hasLogged.current = false
    }
  }, [logPageVisit, userId])

  return { logPageVisit }
}

export function useTypingSpeedTracker() {
  const { user } = useAuth()
  const userId = user?.userId
  const typingTimeoutRef = useRef(null)
  const startTimeRef = useRef(null)
  const wordCountRef = useRef(0)

  const logTypingActivity = useCallback(async () => {
    if (!userId || wordCountRef.current === 0) return

    try {
      const timeTakenSeconds = (Date.now() - startTimeRef.current) / 1000
      const typingSpeedWpm = (wordCountRef.current / timeTakenSeconds) * 60

      await activityApi.logActivity({
        userId,
        activityType: 'JOURNAL_WRITE',
        pageVisited: 'mood',
        timeSpentSeconds: Math.round(timeTakenSeconds),
        typingSpeedWpm: Math.round(typingSpeedWpm),
      })

      startTimeRef.current = null
      wordCountRef.current = 0
    } catch {
      // Silent fail for activity logging
    }
  }, [userId])

  const handleTyping = useCallback((text) => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    wordCountRef.current = text.trim().split(/\s+/).filter((word) => word.length > 0).length

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      logTypingActivity()
    }, 2000)
  }, [logTypingActivity])

  const reset = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    startTimeRef.current = null
    wordCountRef.current = 0
  }, [])

  return { handleTyping, reset }
}
