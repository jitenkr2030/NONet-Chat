'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Database,
  Download,
  Upload,
  Trash2,
  QrCode,
  Smartphone,
  Wifi,
  WifiOff,
  Radio,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Info,
  HelpCircle
} from 'lucide-react'
import { useChatStore } from '@/lib/store'
import { AuthService } from '@/lib/auth'
import { BroadcastService } from '@/lib/broadcast-service'
import { ConnectivityService } from '@/lib/connectivity'

interface SettingsDialogProps {
  trigger?: React.ReactNode
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '')
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('nonet-chat-settings')
    return saved ? JSON.parse(saved).notifications ?? true : true
  })
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('nonet-chat-settings')
    return saved ? JSON.parse(saved).soundEnabled ?? true : true
  })
  const [autoDownload, setAutoDownload] = useState(() => {
    const saved = localStorage.getItem('nonet-chat-settings')
    return saved ? JSON.parse(saved).autoDownload ?? false : false
  })
  const [connectivityMode, setConnectivityMode] = useState<'auto' | 'internet' | 'mesh'>(() => {
    const saved = localStorage.getItem('nonet-chat-settings')
    return saved ? JSON.parse(saved).connectivityMode ?? 'auto' : 'auto'
  })
  const [showPreview, setShowPreview] = useState(() => {
    const saved = localStorage.getItem('nonet-chat-settings')
    return saved ? JSON.parse(saved).showPreview ?? true : true
  })
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const { currentUser, theme, setTheme, setSidebarOpen } = useChatStore()
  
  useEffect(() => {
    if (currentUser && displayName !== currentUser.displayName) {
      setDisplayName(currentUser.displayName)
    }
  }, [currentUser])
  
  const saveSettings = () => {
    const settings = {
      notifications,
      soundEnabled,
      autoDownload,
      connectivityMode,
      showPreview
    }
    localStorage.setItem('nonet-chat-settings', JSON.stringify(settings))
    showMessage('Settings saved successfully', 'success')
  }
  
  const updateProfile = async () => {
    try {
      await AuthService.updateProfile({ displayName })
      showMessage('Profile updated successfully', 'success')
    } catch (error) {
      showMessage('Failed to update profile', 'error')
    }
  }
  
  const exportUserData = () => {
    try {
      const data = AuthService.exportUserData()
      setExportData(data)
      showMessage('User data exported successfully', 'success')
    } catch (error) {
      showMessage('Failed to export user data', 'error')
    }
  }
  
  const importUserData = async () => {
    try {
      const success = await AuthService.importUserData(importData)
      if (success) {
        showMessage('User data imported successfully', 'success')
        setImportData('')
      } else {
        showMessage('Failed to import user data', 'error')
      }
    } catch (error) {
      showMessage('Invalid import data', 'error')
    }
  }
  
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      AuthService.signOut()
      localStorage.clear()
      BroadcastService.getInstance().clearAllBroadcasts()
      showMessage('All data cleared successfully', 'success')
      setIsOpen(false)
    }
  }
  
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }
  
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your NoNet Chat preferences and account
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-48 border-r pr-4">
            <div className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
                { id: 'privacy', label: 'Privacy', icon: <Shield className="h-4 w-4" /> },
                { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
                { id: 'connectivity', label: 'Connectivity', icon: <Wifi className="h-4 w-4" /> },
                { id: 'appearance', label: 'Appearance', icon: <Monitor className="h-4 w-4" /> },
                { id: 'data', label: 'Data & Storage', icon: <Database className="h-4 w-4" /> },
                { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 pl-4 overflow-y-auto">
            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                    <CardDescription>Update your profile details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={currentUser?.username} disabled />
                      <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Device ID</Label>
                      <div className="flex items-center gap-2">
                        <Input value={currentUser?.deviceId} disabled className="font-mono text-xs" />
                        <Button variant="outline" size="icon">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button onClick={updateProfile}>Update Profile</Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Privacy Settings</CardTitle>
                    <CardDescription>Control your privacy and security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Online Status</Label>
                        <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Last Seen</Label>
                        <p className="text-sm text-muted-foreground">Show when you were last active</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Read Receipts</Label>
                        <p className="text-sm text-muted-foreground">Let others know you've read their messages</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>End-to-End Encryption</Label>
                        <p className="text-sm text-muted-foreground">Encrypt messages automatically</p>
                      </div>
                      <Switch defaultChecked disabled />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notification Settings</CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications for new messages</p>
                      </div>
                      <Switch 
                        checked={notifications}
                        onCheckedChange={setNotifications}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sound Effects</Label>
                        <p className="text-sm text-muted-foreground">Play sounds for messages and notifications</p>
                      </div>
                      <Switch 
                        checked={soundEnabled}
                        onCheckedChange={setSoundEnabled}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Message Preview</Label>
                        <p className="text-sm text-muted-foreground">Show message content in notifications</p>
                      </div>
                      <Switch 
                        checked={showPreview}
                        onCheckedChange={setShowPreview}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Emergency Alerts</Label>
                        <p className="text-sm text-muted-foreground">Always receive emergency and SOS broadcasts</p>
                      </div>
                      <Switch defaultChecked disabled />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'connectivity' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Connectivity Settings</CardTitle>
                    <CardDescription>Configure how NoNet Chat connects to others</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Connection Mode</Label>
                      <Select value={connectivityMode} onValueChange={(value) => setConnectivityMode(value as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">
                            <div className="flex items-center gap-2">
                              <Wifi className="h-4 w-4" />
                              Auto (Recommended)
                            </div>
                          </SelectItem>
                          <SelectItem value="internet">
                            <div className="flex items-center gap-2">
                              <Wifi className="h-4 w-4" />
                              Internet Only
                            </div>
                          </SelectItem>
                          <SelectItem value="mesh">
                            <div className="flex items-center gap-2">
                              <Radio className="h-4 w-4" />
                              Mesh Only
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Download Media</Label>
                        <p className="text-sm text-muted-foreground">Automatically download images and files</p>
                      </div>
                      <Switch 
                        checked={autoDownload}
                        onCheckedChange={setAutoDownload}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Network Status</Label>
                      <div className="text-sm text-muted-foreground">
                        Current mode will be displayed in the connectivity indicator
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Appearance</CardTitle>
                    <CardDescription>Customize the look and feel</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select value={theme} onValueChange={(value) => setTheme(value as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              System
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'data' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Management</CardTitle>
                    <CardDescription>Manage your data and storage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Export User Data</Label>
                      <Button onClick={exportData} variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                      </Button>
                      {exportData && (
                        <Textarea
                          value={exportData}
                          readOnly
                          className="font-mono text-xs h-20"
                        />
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Import User Data</Label>
                      <Textarea
                        placeholder="Paste exported data here..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        className="font-mono text-xs h-20"
                      />
                      <Button onClick={importUserData} variant="outline" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Import Data
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label className="text-red-600">Danger Zone</Label>
                      <Button 
                        onClick={clearAllData} 
                        variant="destructive" 
                        className="w-full"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Data
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        This will permanently delete all your messages, contacts, and settings
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'about' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About NoNet Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">NoNet Chat</h3>
                        <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                        <p className="text-xs text-muted-foreground">Chat without internet</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Build</span>
                        <span className="text-muted-foreground">2024.01.01</span>
                      </div>
                      <div className="flex justify-between">
                        <span>License</span>
                        <span className="text-muted-foreground">MIT</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• End-to-end encrypted messaging</li>
                        <li>• Mesh network support</li>
                        <li>• Offline-first architecture</li>
                        <li>• Emergency broadcast mode</li>
                        <li>• File and media sharing</li>
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Help
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Info className="mr-2 h-4 w-4" />
                        Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}