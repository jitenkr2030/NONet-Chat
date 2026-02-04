import { Server } from 'socket.io'
import { createServer } from 'http'

const PORT = 3001
const HTTP_PORT = 3002

// Create HTTP server for health checks
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'chat-service',
      timestamp: new Date().toISOString()
    }))
    return
  }
  
  res.writeHead(404)
  res.end()
})

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Store active users and their socket IDs
const activeUsers = new Map<string, string>()
const userSockets = new Map<string, string>()
const rooms = new Map<string, Set<string>>()

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)
  
  // User authentication/registration
  socket.on('register', (userData) => {
    const { userId, username, displayName } = userData
    
    // Store user mapping
    activeUsers.set(userId, socket.id)
    userSockets.set(socket.id, userId)
    
    // Join user to their personal room
    socket.join(`user:${userId}`)
    
    // Notify others that user is online
    socket.broadcast.emit('user_online', { userId, username, displayName })
    
    console.log(`User registered: ${username} (${userId})`)
    
    // Send acknowledgment
    socket.emit('registered', { success: true, userId })
  })
  
  // Direct messaging
  socket.on('send_message', async (messageData) => {
    const { receiverId, content, messageType, tempId } = messageData
    const senderId = userSockets.get(socket.id)
    
    if (!senderId) {
      socket.emit('error', { message: 'User not registered' })
      return
    }
    
    const receiverSocketId = activeUsers.get(receiverId)
    
    // Create message object
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      receiverId,
      content,
      messageType: messageType || 'text',
      status: receiverSocketId ? 'delivered' : 'sent',
      transportMode: 'internet',
      createdAt: new Date().toISOString(),
      tempId // Temporary ID for sender to match
    }
    
    if (receiverSocketId) {
      // User is online, deliver immediately
      io.to(receiverSocketId).emit('new_message', message)
      socket.emit('message_sent', { ...message, status: 'delivered' })
    } else {
      // User is offline, mark as sent
      socket.emit('message_sent', { ...message, status: 'sent' })
    }
    
    // Broadcast to sender's other devices
    socket.to(`user:${senderId}`).emit('message_sync', message)
    
    console.log(`Message sent from ${senderId} to ${receiverId}`)
  })
  
  // Group messaging
  socket.on('send_group_message', async (messageData) => {
    const { groupId, content, messageType, tempId } = messageData
    const senderId = userSockets.get(socket.id)
    
    if (!senderId) {
      socket.emit('error', { message: 'User not registered' })
      return
    }
    
    // Create group message
    const message = {
      id: `group_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      groupId,
      content,
      messageType: messageType || 'text',
      status: 'sent',
      transportMode: 'internet',
      createdAt: new Date().toISOString(),
      tempId
    }
    
    // Send to group room (excluding sender)
    socket.to(`group:${groupId}`).emit('new_group_message', message)
    socket.emit('group_message_sent', { ...message, status: 'sent' })
    
    // Broadcast to sender's other devices
    socket.to(`user:${senderId}`).emit('group_message_sync', message)
    
    console.log(`Group message sent to ${groupId} by ${senderId}`)
  })
  
  // Join group
  socket.on('join_group', (groupId) => {
    socket.join(`group:${groupId}`)
    
    if (!rooms.has(groupId)) {
      rooms.set(groupId, new Set())
    }
    rooms.get(groupId)!.add(socket.id)
    
    console.log(`User ${userSockets.get(socket.id)} joined group ${groupId}`)
  })
  
  // Leave group
  socket.on('leave_group', (groupId) => {
    socket.leave(`group:${groupId}`)
    
    const group = rooms.get(groupId)
    if (group) {
      group.delete(socket.id)
      if (group.size === 0) {
        rooms.delete(groupId)
      }
    }
    
    console.log(`User ${userSockets.get(socket.id)} left group ${groupId}`)
  })
  
  // Typing indicators
  socket.on('typing_start', (data) => {
    const { receiverId, groupId } = data
    const senderId = userSockets.get(socket.id)
    
    if (!senderId) return
    
    if (receiverId) {
      // Direct typing
      const receiverSocketId = activeUsers.get(receiverId)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { userId: senderId, typing: true })
      }
    } else if (groupId) {
      // Group typing
      socket.to(`group:${groupId}`).emit('user_typing', { userId: senderId, typing: true })
    }
  })
  
  socket.on('typing_stop', (data) => {
    const { receiverId, groupId } = data
    const senderId = userSockets.get(socket.id)
    
    if (!senderId) return
    
    if (receiverId) {
      // Direct typing
      const receiverSocketId = activeUsers.get(receiverId)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { userId: senderId, typing: false })
      }
    } else if (groupId) {
      // Group typing
      socket.to(`group:${groupId}`).emit('user_typing', { userId: senderId, typing: false })
    }
  })
  
  // Mark message as read
  socket.on('mark_read', (data) => {
    const { messageId, senderId } = data
    const readerId = userSockets.get(socket.id)
    
    if (!readerId) return
    
    const senderSocketId = activeUsers.get(senderId)
    if (senderSocketId) {
      io.to(senderSocketId).emit('message_read', { messageId, readBy: readerId })
    }
  })
  
  // Get online users
  socket.on('get_online_users', () => {
    const onlineUsers = Array.from(activeUsers.entries()).map(([userId, socketId]) => ({
      userId,
      socketId,
      isOnline: true
    }))
    
    socket.emit('online_users', onlineUsers)
  })
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const userId = userSockets.get(socket.id)
    
    if (userId) {
      // Remove from active users
      activeUsers.delete(userId)
      userSockets.delete(socket.id)
      
      // Remove from all groups
      rooms.forEach((members, groupId) => {
        if (members.has(socket.id)) {
          members.delete(socket.id)
          if (members.size === 0) {
            rooms.delete(groupId)
          }
        }
      })
      
      // Notify others that user is offline
      socket.broadcast.emit('user_offline', { userId })
      
      console.log(`User disconnected: ${userId} (${socket.id})`)
    } else {
      console.log(`Unknown user disconnected: ${socket.id}`)
    }
  })
  
  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error)
  })
})

// Start servers
httpServer.listen(HTTP_PORT, () => {
  console.log(`Chat service HTTP server running on port ${HTTP_PORT}`)
})

io.listen(PORT, () => {
  console.log(`Chat service Socket.IO server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down chat service...')
  httpServer.close()
  io.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Shutting down chat service...')
  httpServer.close()
  io.close()
  process.exit(0)
})