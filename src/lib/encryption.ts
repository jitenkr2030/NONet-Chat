import CryptoJS from 'crypto-js'
import { sha256 } from 'js-sha256'

// Encryption utilities for end-to-end encryption
export class EncryptionService {
  // Generate RSA key pair (simplified for demo)
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    // In a real implementation, you'd use Web Crypto API for proper RSA keys
    const privateKey = CryptoJS.lib.WordArray.random(256).toString()
    const publicKey = sha256(privateKey)
    
    return { publicKey, privateKey }
  }
  
  // AES encryption for message content
  static encryptMessage(content: string, key: string): string {
    const encrypted = CryptoJS.AES.encrypt(content, key).toString()
    return encrypted
  }
  
  // AES decryption for message content
  static decryptMessage(encryptedContent: string, key: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, key)
    return decrypted.toString(CryptoJS.enc.Utf8)
  }
  
  // Generate a shared secret from two public keys
  static generateSharedSecret(privateKey: string, publicKey: string): string {
    // Simplified Diffie-Hellman-like key exchange
    return sha256(privateKey + publicKey)
  }
  
  // Hash function for integrity verification
  static hash(data: string): string {
    return sha256(data)
  }
  
  // Generate device fingerprint
  static generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Device fingerprint', 2, 2)
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')
    
    return sha256(fingerprint)
  }
}

// Local storage encryption
export class SecureStorage {
  private static encryptionKey = 'nonet-chat-secure-key'
  
  static setItem(key: string, value: any): void {
    try {
      const encrypted = EncryptionService.encryptMessage(
        JSON.stringify(value), 
        this.encryptionKey
      )
      localStorage.setItem(`secure_${key}`, encrypted)
    } catch (error) {
      console.error('Failed to encrypt and store data:', error)
    }
  }
  
  static getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`)
      if (!encrypted) return defaultValue || null
      
      const decrypted = EncryptionService.decryptMessage(encrypted, this.encryptionKey)
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Failed to decrypt and retrieve data:', error)
      return defaultValue || null
    }
  }
  
  static removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`)
  }
  
  static clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith('secure_'))
      .forEach(key => localStorage.removeItem(key))
  }
}

// Message queue for offline operations
export class OfflineQueue {
  private static queueKey = 'offline_queue'
  
  static add(operation: any): void {
    const queue = this.getQueue()
    queue.push({
      ...operation,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      retryCount: 0
    })
    this.saveQueue(queue)
  }
  
  static getQueue(): any[] {
    try {
      const queue = localStorage.getItem(this.queueKey)
      return queue ? JSON.parse(queue) : []
    } catch {
      return []
    }
  }
  
  static saveQueue(queue: any[]): void {
    localStorage.setItem(this.queueKey, JSON.stringify(queue))
  }
  
  static remove(id: string): void {
    const queue = this.getQueue()
    const filtered = queue.filter(item => item.id !== id)
    this.saveQueue(filtered)
  }
  
  static clear(): void {
    localStorage.removeItem(this.queueKey)
  }
  
  static getNextOperation(): any | null {
    const queue = this.getQueue()
    return queue.length > 0 ? queue[0] : null
  }
}