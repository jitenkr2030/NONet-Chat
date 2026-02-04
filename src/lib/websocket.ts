import { io, Socket } from 'socket.io-client'
import { useChatStore } from '@/lib/store'
import { Message, GroupMessage } from '@/lib/store'

export class WebSocketService {
  private static instance: WebSocketService
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  
  private constructor() {}
  
  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }
  
  // Connect to WebSocket server
  connect(userId: string, userData: { username: string; displayName: string }): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket?.connected) {
        resolve(true)
        return
      }
      
      // Connect to chat service via gateway
      this.socket = io('/?XTransformPort=3001', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      })
      
      this.socket.on('connect', () => {
        console.log('Connected to chat service')
        this.reconnectAttempts = 0
        
        // Register user
        this.socket?.emit('register', {
          userId,
          ...userData
        })
        
        resolve(true)
      })
      
      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from chat service:', reason)
        this.handleReconnect()
      })
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        resolve(false)
      })
      
      // Set up event listeners
      this.setupEventListeners()
    })
  }
  
  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
  
  // Handle reconnection logic
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect()
        }
      }, delay)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }
  
  // Set up event listeners for real-time updates
  private setupEventListeners(): void {
    if (!this.socket) return
    
    // New direct message
    this.socket.on('new_message', (message: Message) => {
      const store = useChatStore.getState()
      store.addMessage(message)
      
      // Show notification if not in active chat
      if (store.activeChat !== message.senderId && store.activeChatType !== 'direct') {
        this.showNotification(message.sender?.displayName || 'Someone', message.content)
      }
    })
    
    // Message sent confirmation
    this.socket.on('message_sent', (message: Message) => {
      const store = useChatStore.getState()
      store.updateMessage(message.id, { 
        status: message.status,
        id: message.id // Update with real ID if temp ID was used
      })
    })
    
    // New group message
    this.socket.on('new_group_message', (message: GroupMessage) => {
      // Would need to handle group messages in store
      console.log('New group message:', message)
    })
    
    // Group message sent confirmation
    this.socket.on('group_message_sent', (message: GroupMessage) => {
      console.log('Group message sent:', message)
    })
    
    // User online/offline status
    this.socket.on('user_online', (userData) => {
      console.log('User online:', userData)
      // Update user status in store
    })
    
    this.socket.on('user_offline', (userData) => {
      console.log('User offline:', userData)
      // Update user status in store
    })
    
    // Typing indicators
    this.socket.on('user_typing', (data) => {
      console.log('User typing:', data)
      // Show typing indicator in UI
    })
    
    // Message read receipts
    this.socket.on('message_read', (data) => {
      const store = useChatStore.getState()
      store.updateMessage(data.messageId, { status: 'read' })
    })
    
    // Online users list
    this.socket.on('online_users', (users) => {
      console.log('Online users:', users)
      // Update online users in store
    })
    
    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  }
  
  // Send direct message
  sendMessage(messageData: {
    receiverId: string
    content: string
    messageType?: string
    tempId?: string
  }): boolean {
    if (!this.socket?.connected) {
      console.warn('Cannot send message: not connected')
      return false
    }
    
    this.socket.emit('send_message', messageData)
    return true
  }
  
  // Send group message
  sendGroupMessage(messageData: {
    groupId: string
    content: string
    messageType?: string
    tempId?: string
  }): boolean {
    if (!this.socket?.connected) {
      console.warn('Cannot send group message: not connected')
      return false
    }
    
    this.socket.emit('send_group_message', messageData)
    return true
  }
  
  // Join group
  joinGroup(groupId: string): boolean {
    if (!this.socket?.connected) return false
    
    this.socket.emit('join_group', groupId)
    return true
  }
  
  // Leave group
  leaveGroup(groupId: string): boolean {
    if (!this.socket?.connected) return false
    
    this.socket.emit('leave_group', groupId)
    return true
  }
  
  // Send typing indicator
  sendTypingStart(data: { receiverId?: string; groupId?: string }): boolean {
    if (!this.socket?.connected) return false
    
    this.socket.emit('typing_start', data)
    return true
  }
  
  sendTypingStop(data: { receiverId?: string; groupId?: string }): boolean {
    if (!this.socket?.connected) return false
    
    this.socket.emit('typing_stop', data)
    return true
  }
  
  // Mark message as read
  markAsRead(messageId: string, senderId: string): boolean {
    if (!this.socket?.connected) return false
    
    this.socket.emit('mark_read', { messageId, senderId })
    return true
  }
  
  // Get online users
  getOnlineUsers(): boolean {
    if (!this.socket?.connected) return false
    
    this.socket.emit('get_online_users')
    return true
  }
  
  // Show browser notification
  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.svg',
        badge: '/logo.svg'
      })
    }
  }
  
  // Request notification permission
  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }
  
  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false
  }
  
  // Get socket ID
  getSocketId(): string | null {
    return this.socket?.id || null
  }
}