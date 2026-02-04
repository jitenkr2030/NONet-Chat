'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Radio,
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group'
import { 
  Radio as Broadcast, 
  AlertTriangle, 
  AlertCircle, 
  Users,
  MapPin,
  Clock,
  Send,
  AlertTriangle as Emergency,
  Wifi,
  WifiOff
} from 'lucide-react'
import { BroadcastService, BroadcastMessage } from '@/lib/broadcast-service'
import { useChatStore } from '@/lib/store'
import { ConnectivityService } from '@/lib/connectivity'

interface BroadcastDialogProps {
  trigger?: React.ReactNode
}

export function BroadcastDialog({ trigger }: BroadcastDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [messageType, setMessageType] = useState<'text' | 'emergency' | 'sos'>('text')
  const [range, setRange] = useState<'nearby' | 'area' | 'global'>('nearby')
  const [expiryHours, setExpiryHours] = useState(1)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message?: string } | null>(null)
  
  const { isOnline, connectionType } = useChatStore()
  const broadcastService = BroadcastService.getInstance()
  const connectivity = ConnectivityService.getInstance().getCurrentStatus()
  
  const handleSendBroadcast = async () => {
    if (!content.trim()) return
    
    setIsSending(true)
    setSendResult(null)
    
    try {
      const result = await broadcastService.sendBroadcast(
        content,
        messageType,
        range,
        expiryHours
      )
      
      if (result.success) {
        setSendResult({ success: true, message: 'Broadcast sent successfully!' })
        setContent('')
        setTimeout(() => {
          setIsOpen(false)
          setSendResult(null)
        }, 2000)
      } else {
        setSendResult({ success: false, message: result.error || 'Failed to send broadcast' })
      }
    } catch (error) {
      setSendResult({ success: false, message: 'An error occurred while sending' })
    } finally {
      setIsSending(false)
    }
  }

  const getMessageTypeIcon = () => {
    switch (messageType) {
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'sos':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Broadcast className="h-5 w-5 text-blue-500" />
    }
  }

  const getTransportInfo = () => {
    if (connectionType === 'internet') {
      return {
        icon: <Wifi className="h-4 w-4 text-green-500" />,
        text: 'Internet Mode',
        description: 'Will reach all users globally'
      }
    } else if (connectionType === 'mesh') {
      return {
        icon: <WifiOff className="h-4 w-4 text-blue-500" />,
        text: 'Mesh Mode',
        description: `Will reach ${connectivity.meshPeers} nearby users`
      }
    } else {
      return {
        icon: <WifiOff className="h-4 w-4 text-red-500" />,
        text: 'Offline Mode',
        description: 'Will be sent when connection is available'
      }
    }
  }

  const transportInfo = getTransportInfo()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start">
            <Broadcast className="mr-2 h-4 w-4" />
            Send Broadcast
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Broadcast className="h-5 w-5" />
            Send Broadcast Message
          </DialogTitle>
          <DialogDescription>
            Send a message to multiple users at once
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Transport Info */}
          <Alert>
            <div className="flex items-center gap-2">
              {transportInfo.icon}
              <div>
                <div className="font-medium">{transportInfo.text}</div>
                <div className="text-sm">{transportInfo.description}</div>
              </div>
            </div>
          </Alert>

          {/* Message Type */}
          <div className="space-y-2">
            <Label>Message Type</Label>
            <RadioGroup value={messageType} onValueChange={(value) => setMessageType(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text" className="flex-1">
                  <div className="font-medium">General Broadcast</div>
                  <div className="text-sm text-muted-foreground">Regular announcement or message</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="emergency" id="emergency" />
                <Label htmlFor="emergency" className="flex-1">
                  <div className="font-medium flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Emergency Alert
                  </div>
                  <div className="text-sm text-muted-foreground">Important emergency information</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sos" id="sos" />
                <Label htmlFor="sos" className="flex-1">
                  <div className="font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    SOS Signal
                  </div>
                  <div className="text-sm text-muted-foreground">Immediate help needed - enables emergency mode</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Range */}
          <div className="space-y-2">
            <Label htmlFor="range">Broadcast Range</Label>
            <Select value={range} onValueChange={(value) => setRange(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearby">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Nearby (100m radius)
                  </div>
                </SelectItem>
                <SelectItem value="area">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Area (1km radius)
                  </div>
                </SelectItem>
                <SelectItem value="global">
                  <div className="flex items-center gap-2">
                    <Broadcast className="h-4 w-4" />
                    Global (all users)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Enter your broadcast message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/500 characters
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label htmlFor="expiry">Expires After</Label>
            <Select value={expiryHours.toString()} onValueChange={(value) => setExpiryHours(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Send Result */}
          {sendResult && (
            <Alert variant={sendResult.success ? 'default' : 'destructive'}>
              <AlertDescription>{sendResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSendBroadcast}
            disabled={!content.trim() || isSending}
            className="w-full"
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send {messageType === 'sos' ? 'SOS' : messageType === 'emergency' ? 'Emergency' : 'Broadcast'}
              </>
            )}
          </Button>

          {/* Warning for SOS */}
          {messageType === 'sos' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> SOS signals will enable emergency mode and notify all users. 
                Use only in real emergencies.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function BroadcastList() {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([])
  const [emergencyMode, setEmergencyMode] = useState(false)
  
  const broadcastService = BroadcastService.getInstance()
  
  useEffect(() => {
    const updateBroadcasts = () => {
      setBroadcasts(broadcastService.getActiveBroadcasts())
      setEmergencyMode(broadcastService.isEmergencyModeActive())
    }
    
    updateBroadcasts()
    
    // Update every 30 seconds
    const interval = setInterval(updateBroadcasts, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getRangeIcon = (range: string) => {
    switch (range) {
      case 'nearby':
        return <MapPin className="h-3 w-3" />
      case 'area':
        return <Users className="h-3 w-3" />
      case 'global':
        return <Broadcast className="h-3 w-3" />
      default:
        return <MapPin className="h-3 w-3" />
    }
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'sos':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  if (broadcasts.length === 0 && !emergencyMode) {
    return null
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Broadcast className="h-5 w-5" />
          Active Broadcasts
          {emergencyMode && (
            <Badge variant="destructive" className="animate-pulse">
              <Emergency className="h-3 w-3 mr-1" />
              Emergency Mode
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {broadcasts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active broadcasts</p>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {broadcasts.map((broadcast) => (
                <div key={broadcast.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getMessageTypeColor(broadcast.messageType)}>
                        {broadcast.messageType.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getRangeIcon(broadcast.range)}
                        <span className="capitalize">{broadcast.range}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(broadcast.createdAt)}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-2">{broadcast.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      From: {broadcast.senderName}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {broadcast.transportMode === 'mesh' ? (
                        <WifiOff className="h-3 w-3" />
                      ) : (
                        <Wifi className="h-3 w-3" />
                      )}
                      <span className="capitalize">{broadcast.transportMode}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}