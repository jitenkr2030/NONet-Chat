import { EncryptionService, SecureStorage } from '@/lib/encryption'
import { useChatStore } from '@/lib/store'
import { User } from '@/lib/store'

export class AuthService {
  private static readonly USER_KEY = 'current_user'
  private static readonly KEYS_KEY = 'encryption_keys'
  
  // Create new user identity
  static async createIdentity(
    username: string, 
    displayName: string
  ): Promise<User> {
    // Generate encryption keys
    const { publicKey, privateKey } = EncryptionService.generateKeyPair()
    
    // Generate device ID
    const deviceId = EncryptionService.generateDeviceFingerprint()
    
    // Create user object
    const user: User = {
      id: `user_${Date.now()}`,
      username,
      displayName,
      publicKey,
      deviceId,
      isOnline: navigator.onLine,
      lastSeen: new Date(),
      connectivityMode: 'auto'
    }
    
    // Store user data securely
    SecureStorage.setItem(this.USER_KEY, user)
    
    // Store private key separately with extra security
    SecureStorage.setItem(this.KEYS_KEY, { privateKey })
    
    // Update store
    useChatStore.getState().setCurrentUser(user)
    useChatStore.getState().setAuthenticated(true)
    
    return user
  }
  
  // Load existing user identity
  static async loadIdentity(): Promise<User | null> {
    try {
      const user = SecureStorage.getItem<User>(this.USER_KEY)
      const keys = SecureStorage.getItem<{ privateKey: string }>(this.KEYS_KEY)
      
      if (!user || !keys) {
        return null
      }
      
      // Update store
      useChatStore.getState().setCurrentUser(user)
      useChatStore.getState().setAuthenticated(true)
      
      return user
    } catch (error) {
      console.error('Failed to load user identity:', error)
      return null
    }
  }
  
  // Sign out user
  static signOut(): void {
    // Clear secure storage
    SecureStorage.removeItem(this.USER_KEY)
    SecureStorage.removeItem(this.KEYS_KEY)
    
    // Clear all chat data
    localStorage.clear()
    
    // Reset store
    useChatStore.getState().setCurrentUser(null)
    useChatStore.getState().setAuthenticated(false)
  }
  
  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return useChatStore.getState().isAuthenticated
  }
  
  // Get current user
  static getCurrentUser(): User | null {
    return useChatStore.getState().currentUser
  }
  
  // Update user profile
  static async updateProfile(updates: Partial<User>): Promise<void> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) throw new Error('User not authenticated')
    
    const updatedUser = { ...currentUser, ...updates }
    
    // Update secure storage
    SecureStorage.setItem(this.USER_KEY, updatedUser)
    
    // Update store
    useChatStore.getState().setCurrentUser(updatedUser)
  }
  
  // Generate QR code data for identity sharing
  static generateIdentityQR(): string {
    const user = this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')
    
    const qrData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      publicKey: user.publicKey,
      deviceId: user.deviceId,
      timestamp: Date.now()
    }
    
    return btoa(JSON.stringify(qrData))
  }
  
  // Parse QR code data and verify peer identity
  static async verifyPeerFromQR(qrData: string): Promise<{
    user: Omit<User, 'isOnline' | 'lastSeen' | 'connectivityMode'>
    verified: boolean
  }> {
    try {
      const data = JSON.parse(atob(qrData))
      
      // Verify QR data is recent (within 5 minutes)
      const now = Date.now()
      if (now - data.timestamp > 5 * 60 * 1000) {
        throw new Error('QR code expired')
      }
      
      // Verify required fields
      if (!data.id || !data.username || !data.publicKey || !data.deviceId) {
        throw new Error('Invalid QR code format')
      }
      
      return {
        user: {
          id: data.id,
          username: data.username,
          displayName: data.displayName || data.username,
          publicKey: data.publicKey,
          deviceId: data.deviceId
        },
        verified: true
      }
    } catch (error) {
      console.error('Failed to verify peer QR:', error)
      return {
        user: {
          id: '',
          username: '',
          displayName: '',
          publicKey: '',
          deviceId: ''
        },
        verified: false
      }
    }
  }
  
  // Export user data for backup
  static exportUserData(): string {
    const user = this.getCurrentUser()
    const keys = SecureStorage.getItem<{ privateKey: string }>(this.KEYS_KEY)
    
    if (!user || !keys) {
      throw new Error('No user data to export')
    }
    
    const exportData = {
      user,
      keys: { privateKey: keys.privateKey },
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    // In a real app, you'd encrypt this with a user-provided password
    return btoa(JSON.stringify(exportData))
  }
  
  // Import user data from backup
  static async importUserData(exportData: string, password?: string): Promise<boolean> {
    try {
      const data = JSON.parse(atob(exportData))
      
      // Validate data structure
      if (!data.user || !data.keys || !data.version) {
        throw new Error('Invalid export data')
      }
      
      // Store imported data
      SecureStorage.setItem(this.USER_KEY, data.user)
      SecureStorage.setItem(this.KEYS_KEY, data.keys)
      
      // Update store
      useChatStore.getState().setCurrentUser(data.user)
      useChatStore.getState().setAuthenticated(true)
      
      return true
    } catch (error) {
      console.error('Failed to import user data:', error)
      return false
    }
  }
  
  // Check if username is available (for new identity creation)
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    // In a real implementation, this would check against a server
    // For now, just check local storage
    const user = SecureStorage.getItem<User>(this.USER_KEY)
    return !user || user.username !== username
  }
  
  // Validate username format
  static validateUsername(username: string): boolean {
    // Username should be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }
  
  // Validate display name format
  static validateDisplayName(displayName: string): boolean {
    // Display name should be 1-50 characters
    return displayName.length >= 1 && displayName.length <= 50
  }
}