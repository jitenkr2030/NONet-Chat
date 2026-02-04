'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useChatStore } from '@/lib/store'
import { 
  MessageSquare, 
  Users, 
  Radio, 
  Plus,
  Wifi,
  WifiOff,
  Shield
} from 'lucide-react'
import { useState } from 'react'
import { NewChatDialog } from './new-chat-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function EmptyState() {
  const [newChatOpen, setNewChatOpen] = useState(false)
  const { isOnline, connectionType, meshPeers, setActiveChat } = useChatStore()

  const getConnectionStatus = () => {
    if (isOnline) {
      return {
        icon: <Wifi className="h-8 w-8 text-green-500" />,
        title: 'Connected to Internet',
        description: 'You can chat with anyone worldwide',
        color: 'text-green-600'
      }
    }
    
    if (connectionType === 'mesh' && meshPeers.length > 0) {
      return {
        icon: <Radio className="h-8 w-8 text-blue-500" />,
        title: 'Mesh Network Active',
        description: `Connected to ${meshPeers.length} nearby device${meshPeers.length > 1 ? 's' : ''}`,
        color: 'text-blue-600'
      }
    }
    
    return {
      icon: <WifiOff className="h-8 w-8 text-red-500" />,
      title: 'Offline Mode',
      description: 'Waiting for network connection or mesh peers',
      color: 'text-red-600'
    }
  }

  const status = getConnectionStatus()

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        {/* Connection Status Card */}
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              {status.icon}
            </div>
            <CardTitle className={status.color}>{status.title}</CardTitle>
            <CardDescription>{status.description}</CardDescription>
          </CardHeader>
        </Card>

        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Welcome to NoNet Chat</h2>
          <p className="text-muted-foreground">
            Start a conversation to begin messaging. NoNet Chat works online and offline.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3">
          <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Start New Chat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
                <DialogDescription>
                  Choose how you want to start chatting
                </DialogDescription>
              </DialogHeader>
              <NewChatDialog onClose={() => setNewChatOpen(false)} />
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Direct Chat</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Create Group</span>
            </Button>
          </div>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm">End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              <span className="text-sm">Works without internet</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <span className="text-sm">Mesh networking support</span>
            </div>
          </CardContent>
        </Card>

        {/* Connection Info */}
        {connectionType === 'mesh' && meshPeers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Mesh Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active peers</span>
                <Badge variant="secondary">{meshPeers.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You can communicate directly with nearby devices without internet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}