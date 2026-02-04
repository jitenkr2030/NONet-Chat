'use client'

import { useEffect, useState } from 'react'
import { AuthService } from '@/lib/auth'
import { useChatStore } from '@/lib/store'
import { OnboardingScreen } from '@/components/auth/onboarding-screen'
import { ChatInterface } from '@/components/chat/chat-interface'
import { ConnectivityIndicator } from '@/components/ui/connectivity-indicator'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useChatStore()

  useEffect(() => {
    // Check for existing user identity on app load
    const initializeApp = async () => {
      try {
        await AuthService.loadIdentity()
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading NoNet Chat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <OnboardingScreen />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ConnectivityIndicator />
      <ChatInterface />
    </div>
  )
}