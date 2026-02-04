import { useChatStore } from '@/lib/store'
import { ConnectivityService } from '@/lib/connectivity'
import { MessageService } from './message-service'

export interface BroadcastMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  messageType: 'text' | 'emergency' | 'sos'
  range: 'nearby' | 'area' | 'global'
  transportMode: 'mesh' | 'internet'
  createdAt: Date
  expiresAt?: Date
}

export class BroadcastService {
  private static instance: BroadcastService
  private activeBroadcasts: Map<string, BroadcastMessage> = new Map()
  private emergencyMode = false
  private broadcastHistory: BroadcastMessage[] = []
  
  private constructor() {
    this.loadBroadcastHistory()
  }
  
  static getInstance(): BroadcastService {
    if (!BroadcastService.instance) {
      BroadcastService.instance = new BroadcastService()
    }
    return BroadcastService.instance
  }
  
  // Send broadcast message
  async sendBroadcast(
    content: string,
    messageType: 'text' | 'emergency' | 'sos' = 'text',
    range: 'nearby' | 'area' | 'global' = 'nearby',
    expiryHours: number = 1
  ): Promise<{ success: boolean; broadcastId?: string; error?: string }> {
    try {
      const { currentUser } = useChatStore.getState()
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' }
      }
      
      // Determine transport mode based on connectivity
      const connectivity = ConnectivityService.getInstance().getCurrentStatus()
      const transportMode = connectivity.connectionType === 'internet' ? 'internet' : 'mesh'
      
      // Create broadcast message
      const broadcast: BroadcastMessage = {
        id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        messageType,
        range,
        transportMode,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000)
      }
      
      // Store locally
      this.activeBroadcasts.set(broadcast.id, broadcast)
      this.broadcastHistory.unshift(broadcast)
      this.saveBroadcastHistory()
      
      // Send via appropriate transport
      if (transportMode === 'internet') {
        await this.sendBroadcastViaInternet(broadcast)
      } else {
        await this.sendBroadcastViaMesh(broadcast)
      }
      
      // Auto-enable emergency mode for SOS messages
      if (messageType === 'sos') {
        this.enableEmergencyMode()
      }
      
      return { success: true, broadcastId: broadcast.id }
      
    } catch (error) {
      console.error('Broadcast send error:', error)
      return { success: false, error: 'Failed to send broadcast' }
    }
  }
  
  // Send broadcast via internet
  private async sendBroadcastViaInternet(broadcast: BroadcastMessage): Promise<void> {
    try {
      const response = await fetch('/api/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcast)
      })
      
      if (!response.ok) {
        throw new Error('Internet broadcast failed')
      }
    } catch (error) {
      console.error('Internet broadcast error:', error)
      throw error
    }
  }
  
  // Send broadcast via mesh network
  private async sendBroadcastViaMesh(broadcast: BroadcastMessage): Promise<void> {
    try {
      // In a real implementation, this would use mesh networking APIs
      // For now, simulate mesh broadcast
      console.log('Sending mesh broadcast:', broadcast)
      
      // Simulate mesh propagation delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500))
      
      // Store in local mesh broadcast storage
      const meshBroadcasts = JSON.parse(localStorage.getItem('mesh_broadcasts') || '[]')
      meshBroadcasts.push(broadcast)
      localStorage.setItem('mesh_broadcasts', JSON.stringify(meshBroadcasts))
      
    } catch (error) {
      console.error('Mesh broadcast error:', error)
      throw error
    }
  }
  
  // Receive broadcast message
  receiveBroadcast(broadcast: BroadcastMessage): void {
    // Check if message has expired
    if (broadcast.expiresAt && new Date() > broadcast.expiresAt) {
      return
    }
    
    // Check if already received
    if (this.activeBroadcasts.has(broadcast.id)) {
      return
    }
    
    // Store and notify
    this.activeBroadcasts.set(broadcast.id, broadcast)
    this.broadcastHistory.unshift(broadcast)
    this.saveBroadcastHistory()
    
    // Show notification for emergency broadcasts
    if (broadcast.messageType === 'emergency' || broadcast.messageType === 'sos') {
      this.showEmergencyNotification(broadcast)
    }
    
    // Auto-enable emergency mode for SOS messages
    if (broadcast.messageType === 'sos') {
      this.enableEmergencyMode()
    }
    
    // Propagate to mesh network if received via internet and vice versa
    this.propagateBroadcast(broadcast)
  }
  
  // Propagate broadcast to other transport
  private async propagateBroadcast(broadcast: BroadcastMessage): Promise<void> {
    const connectivity = ConnectivityService.getInstance().getCurrentStatus()
    
    // If received via internet and mesh is available, propagate to mesh
    if (broadcast.transportMode === 'internet' && connectivity.meshPeers > 0) {
      try {
        await this.sendBroadcastViaMesh({ ...broadcast, transportMode: 'mesh' })
      } catch (error) {
        console.error('Failed to propagate to mesh:', error)
      }
    }
    
    // If received via mesh and internet is available, propagate to internet
    if (broadcast.transportMode === 'mesh' && connectivity.isOnline) {
      try {
        await this.sendBroadcastViaInternet({ ...broadcast, transportMode: 'internet' })
      } catch (error) {
        console.error('Failed to propagate to internet:', error)
      }
    }
  }
  
  // Enable emergency mode
  enableEmergencyMode(): void {
    this.emergencyMode = true
    localStorage.setItem('emergency_mode', 'true')
    
    // Show emergency UI
    this.showEmergencyModeUI()
    
    // Auto-disable after 1 hour
    setTimeout(() => {
      this.disableEmergencyMode()
    }, 60 * 60 * 1000)
  }
  
  // Disable emergency mode
  disableEmergencyMode(): void {
    this.emergencyMode = false
    localStorage.removeItem('emergency_mode')
    this.hideEmergencyModeUI()
  }
  
  // Check if emergency mode is active
  isEmergencyModeActive(): boolean {
    return this.emergencyMode || localStorage.getItem('emergency_mode') === 'true'
  }
  
  // Get active broadcasts
  getActiveBroadcasts(): BroadcastMessage[] {
    const now = new Date()
    return Array.from(this.activeBroadcasts.values())
      .filter(broadcast => !broadcast.expiresAt || broadcast.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  
  // Get broadcast history
  getBroadcastHistory(limit: number = 50): BroadcastMessage[] {
    return this.broadcastHistory
      .filter(broadcast => !broadcast.expiresAt || broadcast.expiresAt > new Date())
      .slice(0, limit)
  }
  
  // Clear expired broadcasts
  clearExpiredBroadcasts(): void {
    const now = new Date()
    const expiredIds: string[] = []
    
    this.activeBroadcasts.forEach((broadcast, id) => {
      if (broadcast.expiresAt && broadcast.expiresAt <= now) {
        expiredIds.push(id)
      }
    })
    
    expiredIds.forEach(id => this.activeBroadcasts.delete(id))
    this.broadcastHistory = this.broadcastHistory.filter(
      broadcast => !broadcast.expiresAt || broadcast.expiresAt > now
    )
    
    this.saveBroadcastHistory()
  }
  
  // Get broadcast statistics
  getBroadcastStats(): {
    totalSent: number
    activeCount: number
    emergencyCount: number
    sosCount: number
  } {
    const activeBroadcasts = this.getActiveBroadcasts()
    
    return {
      totalSent: this.broadcastHistory.length,
      activeCount: activeBroadcasts.length,
      emergencyCount: activeBroadcasts.filter(b => b.messageType === 'emergency').length,
      sosCount: activeBroadcasts.filter(b => b.messageType === 'sos').length
    }
  }
  
  // Show emergency notification
  private showEmergencyNotification(broadcast: BroadcastMessage): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(
        broadcast.messageType === 'sos' ? '🚨 SOS Alert' : '⚠️ Emergency Broadcast',
        {
          body: `${broadcast.senderName}: ${broadcast.content}`,
          icon: '/logo.svg',
          badge: '/logo.svg',
          tag: `emergency-${broadcast.id}`,
          requireInteraction: broadcast.messageType === 'sos'
        }
      )
      
      if (broadcast.messageType === 'sos') {
        // Auto-close SOS notification after 5 minutes
        setTimeout(() => notification.close(), 5 * 60 * 1000)
      }
    }
  }
  
  // Show emergency mode UI
  private showEmergencyModeUI(): void {
    // In a real implementation, this would update the UI
    console.log('Emergency mode activated')
    document.body.classList.add('emergency-mode')
  }
  
  // Hide emergency mode UI
  private hideEmergencyModeUI(): void {
    console.log('Emergency mode deactivated')
    document.body.classList.remove('emergency-mode')
  }
  
  // Save broadcast history to localStorage
  private saveBroadcastHistory(): void {
    try {
      // Keep only last 100 broadcasts in localStorage
      const limitedHistory = this.broadcastHistory.slice(0, 100)
      localStorage.setItem('broadcast_history', JSON.stringify(limitedHistory))
    } catch (error) {
      console.error('Failed to save broadcast history:', error)
    }
  }
  
  // Load broadcast history from localStorage
  private loadBroadcastHistory(): void {
    try {
      const saved = localStorage.getItem('broadcast_history')
      if (saved) {
        this.broadcastHistory = JSON.parse(saved).map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
          expiresAt: b.expiresAt ? new Date(b.expiresAt) : undefined
        }))
      }
    } catch (error) {
      console.error('Failed to load broadcast history:', error)
    }
    
    // Load emergency mode state
    if (localStorage.getItem('emergency_mode') === 'true') {
      this.emergencyMode = true
    }
    
    // Clear expired broadcasts on load
    this.clearExpiredBroadcasts()
  }
  
  // Get mesh broadcasts from other devices
  getMeshBroadcasts(): BroadcastMessage[] {
    try {
      const meshBroadcasts = JSON.parse(localStorage.getItem('mesh_broadcasts') || '[]')
      return meshBroadcasts.map((b: any) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        expiresAt: b.expiresAt ? new Date(b.expiresAt) : undefined
      }))
    } catch (error) {
      console.error('Failed to load mesh broadcasts:', error)
      return []
    }
  }
  
  // Clear all broadcast data
  clearAllBroadcasts(): void {
    this.activeBroadcasts.clear()
    this.broadcastHistory = []
    localStorage.removeItem('broadcast_history')
    localStorage.removeItem('mesh_broadcasts')
    this.disableEmergencyMode()
  }
}