'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface ActivityNotificationContextType {
  unreadCount: number
  markAsRead: () => void
  refreshUnreadCount: () => Promise<void>
}

const ActivityNotificationContext = createContext<ActivityNotificationContextType | undefined>(undefined)

export function ActivityNotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastReadTime, setLastReadTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { data: session } = useSession()

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const fetchUnreadCount = async () => {
    if (!session?.user?.id || !isClient) {
      setUnreadCount(0)
      return
    }

    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        const now = new Date()
        
        // Get last read time from localStorage
        const storedLastRead = localStorage.getItem('lastReadActivityTime')
        const lastRead = storedLastRead ? new Date(storedLastRead) : null
        
        // Count activities newer than last read time
        let count = 0
        
        // Check recent activity
        if (data.recentActivity) {
          count += data.recentActivity.filter((activity: any) => {
            const activityDate = new Date(activity.date)
            return !lastRead || activityDate > lastRead
          }).length
        }
        
        // Check server activity
        if (data.serverActivity) {
          count += data.serverActivity.filter((activity: any) => {
            const activityDate = new Date(activity.date)
            return !lastRead || activityDate > lastRead
          }).length
        }
        
        setUnreadCount(count)
        setLastReadTime(lastRead)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const markAsRead = () => {
    if (!isClient) {
      return
    }
    
    const now = new Date()
    localStorage.setItem('lastReadActivityTime', now.toISOString())
    setLastReadTime(now)
    setUnreadCount(0)
  }

  const refreshUnreadCount = async () => {
    await fetchUnreadCount()
  }

  useEffect(() => {
    if (!isClient) {
      return
    }
    
    if (session?.user?.id) {
      fetchUnreadCount()
    } else {
      setUnreadCount(0)
    }
  }, [session?.user?.id, isClient])

  // Refresh count every 30 seconds when user is logged in
  useEffect(() => {
    if (!isClient || !session?.user?.id) {
      return
    }

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [session?.user?.id, isClient])

  return (
    <ActivityNotificationContext.Provider value={{
      unreadCount,
      markAsRead,
      refreshUnreadCount
    }}>
      {children}
    </ActivityNotificationContext.Provider>
  )
}

export function useActivityNotifications() {
  const context = useContext(ActivityNotificationContext)
  if (context === undefined) {
    throw new Error('useActivityNotifications must be used within an ActivityNotificationProvider')
  }
  return context
}
