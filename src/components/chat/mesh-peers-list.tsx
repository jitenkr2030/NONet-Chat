'use client'

import { useState } from 'react'
import { useChatStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  User, 
  Wifi, 
  Radio, 
  Signal,
  MoreVertical,
  MessageSquare,
  QrCode,
  Share
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MeshPeersList() {
  const [searchQuery, setSearchQuery] = useState('')
  const { meshPeers, setActiveChat } = useChatStore()

  const filteredPeers = meshPeers.filter(peer =>
    peer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    peer.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartChat = (peerId: string) => {
    setActiveChat(peerId, 'direct')
  }

  const getConnectionIcon = (type: string) => {
    return type === 'bluetooth' ? (
      <Wifi className="h-3 w-3 text-blue-500" />
    ) : (
      <Radio className="h-3 w-3 text-green-500" />
    )
  }

  const getSignalStrengthColor = (strength?: number) => {
    if (!strength) return 'text-gray-400'
    if (strength > 70) return 'text-green-500'
    if (strength > 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getHopCountText = (hopCount: number) => {
    return hopCount === 1 ? 'Direct' : `${hopCount} hops`
  }

  if (meshPeers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
        <Radio className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="font-medium mb-1">No Mesh Peers</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enable Bluetooth and Wi-Fi Direct to discover nearby devices
        </p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Turn on Bluetooth</p>
          <p>• Enable Wi-Fi Direct</p>
          <p>• Stay within range of other NoNet users</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mesh peers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Peers List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredPeers.map((peer) => (
            <div
              key={peer.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={peer.avatar} />
                  <AvatarFallback>
                    {peer.displayName?.charAt(0)?.toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{peer.displayName}</h4>
                    {peer.isDirect ? (
                      <Badge variant="secondary" className="text-xs">Direct</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {getHopCountText(peer.hopCount)}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    @{peer.username}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {getConnectionIcon(peer.connectionType)}
                      <span className="capitalize">{peer.connectionType}</span>
                    </div>
                    
                    {peer.signalStrength && (
                      <div className="flex items-center gap-1">
                        <Signal className={`h-3 w-3 ${getSignalStrengthColor(peer.signalStrength)}`} />
                        <span>{peer.signalStrength}%</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <span>Last seen: {new Date(peer.lastSeen).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStartChat(peer.deviceId)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Start Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <QrCode className="mr-2 h-4 w-4" />
                      Show QR Code
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="mr-2 h-4 w-4" />
                      Share Contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Mesh Info */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>Total Peers:</span>
            <Badge variant="secondary" className="text-xs">{meshPeers.length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Direct Connections:</span>
            <Badge variant="secondary" className="text-xs">
              {meshPeers.filter(p => p.isDirect).length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Relay Connections:</span>
            <Badge variant="secondary" className="text-xs">
              {meshPeers.filter(p => !p.isDirect).length}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}