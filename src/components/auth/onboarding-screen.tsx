'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthService } from '@/lib/auth'
import { useChatStore } from '@/lib/store'
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Shield, 
  MessageCircle, 
  Radio,
  AlertCircle,
  CheckCircle,
  Smartphone
} from 'lucide-react'

export function OnboardingScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const { setAuthenticated } = useChatStore()

  const handleCreateIdentity = async () => {
    setError('')
    
    // Validation
    if (!AuthService.validateUsername(username)) {
      setError('Username must be 3-20 characters, alphanumeric and underscores only')
      return
    }
    
    if (!AuthService.validateDisplayName(displayName)) {
      setError('Display name must be 1-50 characters')
      return
    }
    
    setIsLoading(true)
    
    try {
      await AuthService.createIdentity(username, displayName)
      setAuthenticated(true)
    } catch (error) {
      setError('Failed to create identity. Please try again.')
      console.error('Identity creation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: <Wifi className="h-5 w-5" />,
      title: 'Internet Mode',
      description: 'Connect globally when internet is available'
    },
    {
      icon: <WifiOff className="h-5 w-5" />,
      title: 'Mesh Network',
      description: 'Chat offline via Bluetooth and Wi-Fi Direct'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'End-to-End Encryption',
      description: 'Your messages are private and secure'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'No Phone Required',
      description: 'Create identity without phone number'
    },
    {
      icon: <Radio className="h-5 w-5" />,
      title: 'Emergency Mode',
      description: 'Broadcast messages during network outages'
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: 'Offline First',
      description: 'Messages work even without connection'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <MessageCircle className="h-12 w-12 text-primary" />
              <div className="absolute -top-1 -right-1">
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">NoNet Chat</h1>
          <p className="text-muted-foreground text-lg">
            Chat without internet. Works online and offline.
          </p>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create">Create Identity</TabsTrigger>
            <TabsTrigger value="about">About NoNet Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Create Your Identity
                </CardTitle>
                <CardDescription>
                  Choose a username and display name to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="john_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is how others will see you
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleCreateIdentity} 
                  disabled={isLoading || !username || !displayName}
                  className="w-full"
                >
                  {isLoading ? 'Creating Identity...' : 'Create Identity & Start Chatting'}
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  <p>Your identity is stored locally on this device only.</p>
                  <p>No phone number or email required.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>Why NoNet Chat?</CardTitle>
                <CardDescription>
                  A messaging app that works everywhere, every time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="text-primary mt-0.5">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Perfect for:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Internet Shutdowns</Badge>
                    <Badge variant="secondary">Emergency Response</Badge>
                    <Badge variant="secondary">Remote Areas</Badge>
                    <Badge variant="secondary">Campus Networks</Badge>
                    <Badge variant="secondary">Privacy Advocates</Badge>
                    <Badge variant="secondary">Journalists</Badge>
                  </div>
                </div>

                <Alert className="mt-4">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Privacy First:</strong> All messages are end-to-end encrypted. 
                    Your data never leaves your device unless you choose to share it.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}