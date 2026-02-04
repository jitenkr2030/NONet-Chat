'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '@/lib/store'
import { ChatSidebar } from './chat-sidebar'
import { ChatArea } from './chat-area'
import { EmptyState } from './empty-state'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function ChatInterface() {
  const { sidebarOpen, activeChat, activeChatType, setSidebarOpen } = useChatStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setSidebarOpen])

  const renderMainContent = () => {
    if (!activeChat || !activeChatType) {
      return <EmptyState />
    }
    
    return <ChatArea />
  }

  if (isMobile) {
    return (
      <div className="flex h-[calc(100vh-60px)]">
        {/* Mobile: Show sidebar or chat area, not both */}
        {activeChat && activeChatType ? (
          <div className="flex-1 flex flex-col">
            {/* Mobile header with back button */}
            <div className="border-b bg-background p-4 flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <ChatSidebar />
                </SheetContent>
              </Sheet>
              <div className="flex-1">
                <h2 className="font-semibold truncate">
                  {activeChatType === 'direct' ? 'Direct Chat' : 'Group Chat'}
                </h2>
              </div>
            </div>
            {renderMainContent()}
          </div>
        ) : (
          <div className="flex-1">
            <ChatSidebar />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-60px)]">
      {/* Desktop: Show both sidebar and chat area */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r overflow-hidden`}>
        <ChatSidebar />
      </div>
      
      <div className="flex-1 flex flex-col">
        {renderMainContent()}
      </div>
    </div>
  )
}