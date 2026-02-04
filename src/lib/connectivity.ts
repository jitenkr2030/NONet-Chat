import { useChatStore } from '@/lib/store'

export interface ConnectivityStatus {
  isOnline: boolean
  connectionType: 'internet' | 'mesh' | 'offline'
  internetQuality: 'excellent' | 'good' | 'poor' | 'none'
  meshPeers: number
  signalStrength: number
}

export class ConnectivityService {
  private static instance: ConnectivityService
  private meshPeers: Map<string, any> = new Map()
  private internetCheckInterval: NodeJS.Timeout | null = null
  private meshScanInterval: NodeJS.Timeout | null = null
  private callbacks: ((status: ConnectivityStatus) => void)[] = []
  
  private constructor() {
    this.initializeConnectivityMonitoring()
  }
  
  static getInstance(): ConnectivityService {
    if (!ConnectivityService.instance) {
      ConnectivityService.instance = new ConnectivityService()
    }
    return ConnectivityService.instance
  }
  
  private initializeConnectivityMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => this.handleConnectivityChange())
    window.addEventListener('offline', () => this.handleConnectivityChange())
    
    // Start periodic internet quality checks
    this.startInternetQualityCheck()
    
    // Start mesh network scanning
    this.startMeshScanning()
    
    // Initial status check
    this.handleConnectivityChange()
  }
  
  private async handleConnectivityChange(): void {
    const isOnline = navigator.onLine
    const connectionType = await this.detectConnectionType()
    const internetQuality = await this.assessInternetQuality()
    
    const status: ConnectivityStatus = {
      isOnline,
      connectionType,
      internetQuality,
      meshPeers: this.meshPeers.size,
      signalStrength: this.calculateAverageSignalStrength()
    }
    
    // Update store
    const store = useChatStore.getState()
    store.setOnlineStatus(isOnline)
    store.setConnectionType(connectionType)
    
    // Notify callbacks
    this.callbacks.forEach(callback => callback(status))
  }
  
  private async detectConnectionType(): Promise<'internet' | 'mesh' | 'offline'> {
    if (!navigator.onLine) {
      return this.meshPeers.size > 0 ? 'mesh' : 'offline'
    }
    
    // Check if we have actual internet connectivity
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      })
      return response.ok ? 'internet' : 'mesh'
    } catch {
      return this.meshPeers.size > 0 ? 'mesh' : 'offline'
    }
  }
  
  private async assessInternetQuality(): Promise<'excellent' | 'good' | 'poor' | 'none'> {
    if (!navigator.onLine) return 'none'
    
    try {
      const startTime = Date.now()
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      const latency = Date.now() - startTime
      
      if (!response.ok) return 'none'
      
      if (latency < 200) return 'excellent'
      if (latency < 500) return 'good'
      if (latency < 2000) return 'poor'
      return 'none'
    } catch {
      return 'none'
    }
  }
  
  private startInternetQualityCheck(): void {
    this.internetCheckInterval = setInterval(() => {
      this.handleConnectivityChange()
    }, 10000) // Check every 10 seconds
  }
  
  private startMeshScanning(): void {
    this.meshScanInterval = setInterval(() => {
      this.scanForMeshPeers()
    }, 15000) // Scan every 15 seconds
  }
  
  private async scanForMeshPeers(): Promise<void> {
    // Simulate mesh peer discovery
    // In a real implementation, this would use WebRTC, Bluetooth API, or Wi-Fi Direct
    const mockPeers = this.generateMockPeers()
    
    mockPeers.forEach(peer => {
      if (!this.meshPeers.has(peer.deviceId)) {
        this.meshPeers.set(peer.deviceId, peer)
        useChatStore.getState().addMeshPeer(peer)
      }
    })
    
    // Clean up old peers
    const now = Date.now()
    this.meshPeers.forEach((peer, deviceId) => {
      if (now - new Date(peer.lastSeen).getTime() > 60000) { // 1 minute timeout
        this.meshPeers.delete(deviceId)
        useChatStore.getState().removeMeshPeer(deviceId)
      }
    })
  }
  
  private generateMockPeers(): any[] {
    // Generate mock mesh peers for demonstration
    const peerCount = Math.floor(Math.random() * 3)
    const peers = []
    
    for (let i = 0; i < peerCount; i++) {
      peers.push({
        id: `peer_${Date.now()}_${i}`,
        deviceId: `device_${Math.random().toString(36).substr(2, 9)}`,
        username: `user_${Math.random().toString(36).substr(2, 5)}`,
        displayName: `Peer ${i + 1}`,
        publicKey: `key_${Math.random().toString(36).substr(2, 16)}`,
        lastSeen: new Date(),
        connectionType: Math.random() > 0.5 ? 'bluetooth' : 'wifi-direct',
        signalStrength: Math.floor(Math.random() * 100),
        isDirect: Math.random() > 0.3,
        hopCount: Math.random() > 0.7 ? 2 : 1
      })
    }
    
    return peers
  }
  
  private calculateAverageSignalStrength(): number {
    if (this.meshPeers.size === 0) return 0
    
    let totalStrength = 0
    this.meshPeers.forEach(peer => {
      totalStrength += peer.signalStrength || 0
    })
    
    return Math.floor(totalStrength / this.meshPeers.size)
  }
  
  // Public API
  public onConnectivityChange(callback: (status: ConnectivityStatus) => void): void {
    this.callbacks.push(callback)
  }
  
  public removeConnectivityCallback(callback: (status: ConnectivityStatus) => void): void {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }
  
  public getCurrentStatus(): ConnectivityStatus {
    return {
      isOnline: navigator.onLine,
      connectionType: 'offline', // Will be updated by async detection
      internetQuality: 'none',
      meshPeers: this.meshPeers.size,
      signalStrength: this.calculateAverageSignalStrength()
    }
  }
  
  public forceConnectivityCheck(): void {
    this.handleConnectivityChange()
  }
  
  public destroy(): void {
    if (this.internetCheckInterval) {
      clearInterval(this.internetCheckInterval)
    }
    if (this.meshScanInterval) {
      clearInterval(this.meshScanInterval)
    }
    this.callbacks = []
    this.meshPeers.clear()
  }
}

// Transport selector for choosing best communication method
export class TransportSelector {
  static selectTransport(
    messageSize: number = 0,
    urgency: 'low' | 'normal' | 'high' = 'normal',
    recipientDistance?: number
  ): 'internet' | 'mesh' | 'hybrid' {
    const connectivity = ConnectivityService.getInstance().getCurrentStatus()
    
    // If no internet available, use mesh
    if (connectivity.connectionType === 'offline') {
      return connectivity.meshPeers > 0 ? 'mesh' : 'internet' // Will fail but try anyway
    }
    
    // If internet quality is poor and mesh is available, use mesh for small messages
    if (
      connectivity.internetQuality === 'poor' && 
      connectivity.meshPeers > 0 && 
      messageSize < 1024 * 1024 // 1MB
    ) {
      return 'mesh'
    }
    
    // For urgent messages, prefer internet if available
    if (urgency === 'high' && connectivity.isOnline) {
      return 'internet'
    }
    
    // For large files, prefer internet if available
    if (messageSize > 5 * 1024 * 1024 && connectivity.isOnline) { // 5MB
      return 'internet'
    }
    
    // Default hybrid approach
    return connectivity.isOnline ? 'internet' : 'mesh'
  }
  
  static shouldRetryWithAlternative(
    failedTransport: 'internet' | 'mesh',
    errorType: 'timeout' | 'connection' | 'server' | 'unknown'
  ): boolean {
    // Don't retry server errors with alternative transport
    if (errorType === 'server') return false
    
    // For connection issues, try alternative
    if (errorType === 'connection') return true
    
    // For timeouts, it depends on the transport
    if (errorType === 'timeout') {
      return failedTransport === 'internet' // Retry mesh timeouts with internet
    }
    
    // For unknown errors, try alternative
    return true
  }
}