'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useChatStore } from '@/lib/store'
import { 
  User, 
  Users, 
  QrCode, 
  Share,
  Plus,
  Search
} from 'lucide-react'

interface NewChatDialogProps {
  onClose: () => void
}

export function NewChatDialog({ onClose }: NewChatDialogProps) {
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct')
  const [searchQuery, setSearchQuery] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const { meshPeers, setActiveChat } = useChatStore()

  const handleCreateGroup = () => {
    // In a real implementation, this would create a group in the database
    console.log('Creating group:', { groupName, groupDescription, isPublic })
    onClose()
  }

  const handleSelectPeer = (peerId: string) => {
    setActiveChat(peerId, 'direct')
    onClose()
  }

  const filteredPeers = meshPeers.filter(peer =>
    peer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    peer.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Tabs value={chatType} onValueChange={(value) => setChatType(value as 'direct' | 'group')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="direct">Direct Chat</TabsTrigger>
        <TabsTrigger value="group">Group Chat</TabsTrigger>
      </TabsList>

      <TabsContent value="direct" className="space-y-4">
        {/* Search for users */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Mesh Peers */}
          {filteredPeers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nearby Users (Mesh)</Label>
              {filteredPeers.map((peer) => (
                <Button
                  key={peer.id}
                  variant="outline"
                  className="w-full justify-start p-3 h-auto"
                  onClick={() => handleSelectPeer(peer.deviceId)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{peer.displayName}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        @{peer.username}
                        <Badge variant="secondary" className="text-xs">
                          {peer.connectionType}
                        </Badge>
                        {peer.signalStrength && (
                          <span className="text-xs">{peer.signalStrength}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* QR Code Option */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Other Options</Label>
            <Button variant="outline" className="w-full justify-start">
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Share className="mr-2 h-4 w-4" />
              Share My QR Code
            </Button>
          </div>

          {filteredPeers.length === 0 && searchQuery === '' && meshPeers.length === 0 && (
            <Alert>
              <AlertDescription>
                No nearby users found. Enable Bluetooth and Wi-Fi Direct to discover mesh peers, or ask someone to share their QR code.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </TabsContent>

      <TabsContent value="group" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Description (Optional)</Label>
            <Textarea
              id="group-description"
              placeholder="What's this group about?"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Group Type</Label>
            <RadioGroup value={isPublic ? 'public' : 'private'} onValueChange={(value) => setIsPublic(value === 'public')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex-1">
                  <div className="font-medium">Private Group</div>
                  <div className="text-sm text-muted-foreground">Only invited members can join</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex-1">
                  <div className="font-medium">Public Group</div>
                  <div className="text-sm text-muted-foreground">Anyone nearby can discover and join</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Add Members (Optional)</Label>
            <div className="text-sm text-muted-foreground">
              You can add members now or after creating the group
            </div>
            {filteredPeers.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {filteredPeers.map((peer) => (
                  <div key={peer.id} className="flex items-center gap-2 p-2 border rounded">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{peer.displayName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            onClick={handleCreateGroup}
            disabled={!groupName.trim()}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}