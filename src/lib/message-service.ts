import { useChatStore } from '@/lib/store'
import { OfflineQueue } from '@/lib/encryption'
import { TransportSelector } from '@/lib/connectivity'
import { Message, GroupMessage } from '@/lib/store'

export class MessageService {
  private static instance: MessageService
  private retryInterval: NodeJS.Timeout | null = null
  
  private constructor() {
    this.initializeOfflineSync()
  }
  
  static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService()
    }
    return MessageService.instance
  }
  
  private initializeOfflineSync(): void {
    // Process offline queue every 5 seconds when online
    this.retryInterval = setInterval(() => {
      this.processOfflineQueue()
    }, 5000)
  }
  
  // Send a message with offline-first approach
  async sendMessage(
    content: string,
    receiverId: string,
    messageType: 'text' | 'image' | 'file' | 'location' = 'text',
    groupId?: string
  ): Promise<Message | GroupMessage> {
    const { currentUser } = useChatStore.getState()
    if (!currentUser) throw new Error('User not authenticated')
    
    // Create message object
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      messageType,
      senderId: currentUser.id,
      status: 'pending' as const,
      transportMode: 'auto' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    let message: Message | GroupMessage
    
    if (groupId) {
      // Group message
      message = {
        ...messageData,
        groupId,
        receiverId: '' // Group messages don't have receiverId
      } as GroupMessage
    } else {
      // Direct message
      message = {
        ...messageData,
        receiverId
      } as Message
    }
    
    // Store locally first (offline-first)
    if (groupId) {
      useChatStore.getState().addGroup?.(message as any) // Would need proper group message handling
    } else {
      useChatStore.getState().addMessage(message as Message)
    }
    
    // Add to offline queue for syncing
    OfflineQueue.add({
      type: groupId ? 'group_message' : 'message',
      data: message,
      targetId: groupId || receiverId
    })
    
    // Try to send immediately if online
    await this.attemptMessageSend(message)
    
    return message
  }
  
  // Attempt to send a message via appropriate transport
  private async attemptMessageSend(message: Message | GroupMessage): Promise<boolean> {
    const transport = TransportSelector.selectTransport(
      this.getMessageSize(message),
      'normal'
    )
    
    try {
      if (transport === 'internet') {
        return await this.sendViaInternet(message)
      } else if (transport === 'mesh') {
        return await this.sendViaMesh(message)
      }
      return false
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    }
  }
  
  // Send message via internet (WebSocket/HTTP)
  private async sendViaInternet(message: Message | GroupMessage): Promise<boolean> {
    try {
      const isGroup = 'groupId' in message
      const endpoint = isGroup ? '/api/messages/group' : '/api/messages/direct'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })
      
      if (response.ok) {
        // Update message status
        this.updateMessageStatus(message.id, 'sent')
        return true
      }
      return false
    } catch (error) {
      console.error('Internet send failed:', error)
      return false
    }
  }
  
  // Send message via mesh network
  private async sendViaMesh(message: Message | GroupMessage): Promise<boolean> {
    try {
      // In a real implementation, this would use WebRTC, Bluetooth, or Wi-Fi Direct
      // For now, simulate mesh sending
      console.log('Sending via mesh:', message)
      
      // Simulate mesh network delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500))
      
      // Update message status
      this.updateMessageStatus(message.id, 'sent')
      return true
    } catch (error) {
      console.error('Mesh send failed:', error)
      return false
    }
  }
  
  // Update message status in store
  private updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): void {
    const store = useChatStore.getState()
    
    // Try to update in conversations first
    const messageIndex = store.conversations.findIndex(msg => msg.id === messageId)
    if (messageIndex !== -1) {
      const updatedMessage = { ...store.conversations[messageIndex], status }
      store.updateMessage(messageId, { status })
      return
    }
    
    // Try to update in group messages (would need proper implementation)
    // store.updateGroupMessage?.(messageId, { status })
  }
  
  // Process offline queue and retry failed messages
  private async processOfflineQueue(): Promise<void> {
    const { isOnline } = useChatStore.getState()
    if (!isOnline) return
    
    const queue = OfflineQueue.getQueue()
    const maxRetries = 3
    
    for (const operation of queue) {
      if (operation.retryCount >= maxRetries) {
        // Remove operations that have exceeded max retries
        OfflineQueue.remove(operation.id)
        continue
      }
      
      try {
        const message = operation.data
        const success = await this.attemptMessageSend(message)
        
        if (success) {
          // Remove successful operation from queue
          OfflineQueue.remove(operation.id)
        } else {
          // Increment retry count and update next retry time
          operation.retryCount++
          operation.nextRetryAt = new Date(Date.now() + Math.pow(2, operation.retryCount) * 1000)
          OfflineQueue.saveQueue(queue)
        }
      } catch (error) {
        console.error('Queue processing error:', error)
        operation.retryCount++
        operation.nextRetryAt = new Date(Date.now() + Math.pow(2, operation.retryCount) * 1000)
        OfflineQueue.saveQueue(queue)
      }
    }
  }
  
  // Get message size for transport selection
  private getMessageSize(message: Message | GroupMessage): number {
    // Rough estimation of message size in bytes
    const jsonSize = JSON.stringify(message).length
    return jsonSize
  }
  
  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    this.updateMessageStatus(messageId, 'read')
    
    // Try to sync read status
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      })
    } catch (error) {
      // Add to offline queue if it fails
      OfflineQueue.add({
        type: 'mark_read',
        data: { messageId },
        targetId: messageId
      })
    }
  }
  
  // Get message history for a chat
  async getMessageHistory(
    chatId: string, 
    chatType: 'direct' | 'group',
    limit: number = 50,
    before?: string
  ): Promise<Message[]> {
    try {
      const params = new URLSearchParams({
        chatId,
        chatType,
        limit: limit.toString()
      })
      
      if (before) {
        params.append('before', before)
      }
      
      const response = await fetch(`/api/messages/history?${params}`)
      if (response.ok) {
        const messages = await response.json()
        return messages
      }
    } catch (error) {
      console.error('Failed to fetch message history:', error)
    }
    
    // Fallback to local messages
    const { conversations } = useChatStore.getState()
    return conversations
      .filter(msg => 
        (chatType === 'direct' && (msg.senderId === chatId || msg.receiverId === chatId)) ||
        (chatType === 'group' && 'groupId' in msg && (msg as any).groupId === chatId)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }
  
  // Delete message
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/messages/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      })
      
      if (response.ok) {
        useChatStore.getState().deleteMessage(messageId)
        return true
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
    
    // Delete locally anyway
    useChatStore.getState().deleteMessage(messageId)
    
    // Add to offline queue to sync deletion
    OfflineQueue.add({
      type: 'delete_message',
      data: { messageId },
      targetId: messageId
    })
    
    return true
  }
  
  // Cleanup
  destroy(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval)
    }
  }
}