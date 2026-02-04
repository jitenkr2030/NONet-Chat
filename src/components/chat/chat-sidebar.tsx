'use client'

import { useState } from 'react'
import { useChatStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Search, 
  Plus, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  User,
  Radio,
  Wifi,
  WifiOff,
  MoreVertical,
  QrCode,
  Share,
  Shield,
  Radio as Broadcast
} from 'lucide-react'
import { AuthService } from '@/lib/auth'
import { BroadcastDialog, BroadcastList } from './broadcast'
import { NewChatDialog } from './new-chat-dialog'
import { SettingsDialog } from './settings-dialog'
import { MeshPeersList } from './mesh-peers-list'

export function ChatSidebar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)
  const { 
    currentUser, 
    conversations, 
    groups, 
    activeChat, 
    activeChatType,
    meshPeers,
    setActiveChat,
    setSidebarOpen,
    isOnline,
    connectionType
  } = useChatStore()

  const handleSignOut = () => {
    AuthService.signOut()
  }

  const handleChatSelect = (chatId: string, type: 'direct' | 'group') => {
    setActiveChat(chatId, type)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const filteredConversations = conversations.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getUniqueUsers = () => {
    const userMap = new Map()
    conversations.forEach(msg => {
      if (msg.sender && !userMap.has(msg.sender.id)) {
        userMap.set(msg.sender.id, msg.sender)
      }
      if (msg.receiver && !userMap.has(msg.receiver.id)) {
        userMap.set(msg.receiver.id, msg.receiver)
      }
    })
    return Array.from(userMap.values())
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* User Profile Header */}
      <div className="p-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto">
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>
                    {currentUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium">{currentUser?.displayName}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    @{currentUser?.username}
                    {isOnline ? (
                      <Wifi className="h-3 w-3 text-green-500" />
                    ) : connectionType === 'mesh' ? (
                      <Radio className="h-3 w-3 text-blue-500" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>
                <MoreVertical className="h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <QrCode className="mr-2 h-4 w-4" />
              Share QR Code
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              Privacy Settings
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <SettingsDialog trigger={
                <div className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </div>
              } />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search and New Chat */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
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
      </div>

      {/* Chat Lists */}
      <Tabs defaultValue="chats" className="flex-1">
        <TabsList className="grid w-full grid-cols-4 mx-4">
          <TabsTrigger value="chats" className="text-xs">
            <MessageSquare className="h-4 w-4 mr-1" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-xs">
            <Users className="h-4 w-4 mr-1" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="text-xs">
            <Broadcast className="h-4 w-4 mr-1" />
            Broadcast
          </TabsTrigger>
          <TabsTrigger value="mesh" className="text-xs relative">
            <Radio className="h-4 w-4 mr-1" />
            Mesh
            {meshPeers.length > 0 && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                {meshPeers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-2">
              {getUniqueUsers().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start a new chat to begin messaging</p>
                </div>
              ) : (
                getUniqueUsers().map((user) => (
                  <Button
                    key={user.id}
                    variant={activeChat === user.id && activeChatType === 'direct' ? 'secondary' : 'ghost'}
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => handleChatSelect(user.id, 'direct')}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                      {user.isOnline && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="groups" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-2">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No groups yet</p>
                  <p className="text-xs">Create or join a group to start chatting</p>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <Button
                    key={group.id}
                    variant={activeChat === group.id && activeChatType === 'group' ? 'secondary' : 'ghost'}
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => handleChatSelect(group.id, 'group')}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={group.avatar} />
                        <AvatarFallback>
                          {group.name?.charAt(0)?.toUpperCase() || 'G'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {group.members?.length || 0} members
                        </div>
                      </div>
                      {group.isPublic && (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="broadcast" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-2 space-y-4">
              <BroadcastDialog />
              <BroadcastList />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="mesh" className="flex-1 mt-0">
          <MeshPeersList />
        </TabsContent>
      </Tabs>
    </div>
  )
}