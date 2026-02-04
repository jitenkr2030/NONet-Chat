'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from './file-upload'
import { FileMessage } from './file-message'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Send,
  Paperclip,
  Mic,
  MoreVertical,
  Phone,
  Video,
  Search,
  Info,
  Users
} from 'lucide-react'

export function ChatArea() {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { 
    activeChat, 
    activeChatType, 
    conversations, 
    groups, 
    currentUser,
    setActiveChat
  } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversations])

  const handleSendMessage = () => {
    if (!message.trim() || !activeChat || !currentUser) return

    // In a real implementation, this would send the message via the appropriate transport
    const newMessage = {
      id: `msg_${Date.now()}`,
      content: message,
      messageType: 'text' as const,
      senderId: currentUser.id,
      receiverId: activeChat,
      status: 'pending' as const,
      transportMode: 'auto' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: currentUser
    }

    // Add to store (temporary - would be handled by API)
    useChatStore.getState().addMessage(newMessage)
    
    setMessage('')
    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getChatInfo = () => {
    if (!activeChat || !activeChatType) return null

    if (activeChatType === 'direct') {
      // Find user from conversations
      const user = conversations.find(msg => 
        msg.senderId === activeChat || msg.receiverId === activeChat
      )?.sender || conversations.find(msg => 
        msg.senderId === activeChat || msg.receiverId === activeChat
      )?.receiver

      return {
        name: user?.displayName || 'Unknown User',
        username: user?.username || 'unknown',
        avatar: user?.avatar,
        isOnline: user?.isOnline || false,
        type: 'direct'
      }
    }

    const group = groups.find(g => g.id === activeChat)
    return {
      name: group?.name || 'Unknown Group',
      username: `${group?.members?.length || 0} members`,
      avatar: group?.avatar,
      isOnline: true, // Groups are always "online"
      type: 'group'
    }
  }

  const chatInfo = getChatInfo()

  if (!chatInfo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Select a chat to start messaging</p>
      </div>
    )
  }

  const getChatMessages = () => {
    if (activeChatType === 'direct') {
      return conversations.filter(msg => 
        msg.senderId === activeChat || msg.receiverId === activeChat
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    
    // For groups, would filter group messages
    return []
  }

  const chatMessages = getChatMessages()

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setActiveChat(null, null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={chatInfo.avatar} />
              <AvatarFallback>
                {chatInfo.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="font-semibold">{chatInfo.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{chatInfo.username}</span>
                {chatInfo.isOnline && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
                {chatInfo.type === 'group' && (
                  <Badge variant="secondary" className="text-xs">Group</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Info className="mr-2 h-4 w-4" />
                  View Info
                </DropdownMenuItem>
                {chatInfo.type === 'group' && (
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4" />
                    Members
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isOwn = msg.senderId === currentUser?.id
              const isFileMessage = msg.messageType === 'file'
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {isFileMessage ? (
                    <FileMessage message={msg} isOwn={isOwn} />
                  ) : (
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {!isOwn && (
                        <div className="text-xs font-medium mb-1 opacity-70">
                          {msg.sender?.displayName}
                        </div>
                      )}
                      <div className="text-sm">{msg.content}</div>
                      <div className="text-xs mt-1 opacity-70 flex items-center gap-2">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                        {isOwn && (
                          <span className="capitalize">
                            {msg.status === 'pending' && '⏳'}
                            {msg.status === 'sent' && '✓'}
                            {msg.status === 'delivered' && '✓✓'}
                            {msg.status === 'read' && '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t bg-background p-4">
        <div className="flex items-end gap-2">
          <FileUpload
            receiverId={activeChat!}
            groupId={activeChatType === 'group' ? activeChat : undefined}
            onError={(error) => console.error('File upload error:', error)}
          />
          
          <div className="flex-1">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setIsTyping(e.target.value.length > 0)
              }}
              onKeyPress={handleKeyPress}
              className="min-h-[40px]"
            />
          </div>
          
          {isTyping ? (
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon">
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}