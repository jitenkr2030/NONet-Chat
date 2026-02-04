import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  displayName: string
  avatar?: string
  publicKey: string
  deviceId: string
  isOnline: boolean
  lastSeen: Date
  connectivityMode: 'auto' | 'internet' | 'mesh'
}

export interface Message {
  id: string
  content: string
  encryptedContent?: string
  messageType: 'text' | 'image' | 'file' | 'location'
  senderId: string
  receiverId: string
  status: 'pending' | 'sent' | 'delivered' | 'read'
  transportMode: 'auto' | 'internet' | 'mesh'
  replyToId?: string
  editedAt?: Date
  deliveredAt?: Date
  readAt?: Date
  createdAt: Date
  updatedAt: Date
  sender?: User
  receiver?: User
}

export interface Group {
  id: string
  name: string
  description?: string
  avatar?: string
  isPublic: boolean
  creatorId: string
  createdAt: Date
  updatedAt: Date
  creator?: User
  members?: GroupMember[]
  messages?: GroupMessage[]
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: 'admin' | 'member'
  joinedAt: Date
  user?: User
  group?: Group
}

export interface GroupMessage {
  id: string
  content: string
  encryptedContent?: string
  messageType: 'text' | 'image' | 'file' | 'location'
  senderId: string
  groupId: string
  status: 'pending' | 'sent' | 'delivered' | 'read'
  transportMode: 'auto' | 'internet' | 'mesh'
  replyToId?: string
  editedAt?: Date
  deliveredAt?: Date
  readAt?: Date
  createdAt: Date
  updatedAt: Date
  sender?: User
  group?: Group
}

export interface MeshPeer {
  id: string
  deviceId: string
  username: string
  displayName: string
  publicKey: string
  lastSeen: Date
  connectionType: 'bluetooth' | 'wifi-direct'
  signalStrength?: number
  isDirect: boolean
  hopCount: number
}

interface ChatState {
  // User state
  currentUser: User | null
  isAuthenticated: boolean
  
  // Connectivity state
  isOnline: boolean
  connectionType: 'internet' | 'mesh' | 'offline'
  meshPeers: MeshPeer[]
  
  // Chat state
  conversations: Message[]
  groups: Group[]
  activeChat: string | null // User ID or Group ID
  activeChatType: 'direct' | 'group' | null
  
  // UI state
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
  
  // Actions
  setCurrentUser: (user: User) => void
  setAuthenticated: (authenticated: boolean) => void
  setOnlineStatus: (online: boolean) => void
  setConnectionType: (type: 'internet' | 'mesh' | 'offline') => void
  addMeshPeer: (peer: MeshPeer) => void
  removeMeshPeer: (deviceId: string) => void
  updateMeshPeer: (deviceId: string, updates: Partial<MeshPeer>) => void
  
  // Message actions
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  deleteMessage: (id: string) => void
  
  // Group actions
  addGroup: (group: Group) => void
  updateGroup: (id: string, updates: Partial<Group>) => void
  leaveGroup: (groupId: string) => void
  
  // UI actions
  setActiveChat: (chatId: string | null, type: 'direct' | 'group' | null) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: string) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      isAuthenticated: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectionType: typeof navigator !== 'undefined' && navigator.onLine ? 'internet' : 'offline',
      meshPeers: [],
      conversations: [],
      groups: [],
      activeChat: null,
      activeChatType: null,
      sidebarOpen: true,
      theme: 'system',
      language: 'en',
      
      // User actions
      setCurrentUser: (user) => set({ currentUser: user }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      
      // Connectivity actions
      setOnlineStatus: (online) => set({ 
        isOnline: online,
        connectionType: online ? 'internet' : 'offline'
      }),
      setConnectionType: (type) => set({ connectionType: type }),
      
      // Mesh peer actions
      addMeshPeer: (peer) => set((state) => ({
        meshPeers: state.meshPeers.some(p => p.deviceId === peer.deviceId)
          ? state.meshPeers.map(p => p.deviceId === peer.deviceId ? peer : p)
          : [...state.meshPeers, peer]
      })),
      removeMeshPeer: (deviceId) => set((state) => ({
        meshPeers: state.meshPeers.filter(p => p.deviceId !== deviceId)
      })),
      updateMeshPeer: (deviceId, updates) => set((state) => ({
        meshPeers: state.meshPeers.map(p => 
          p.deviceId === deviceId ? { ...p, ...updates } : p
        )
      })),
      
      // Message actions
      addMessage: (message) => set((state) => ({
        conversations: [...state.conversations, message]
      })),
      updateMessage: (id, updates) => set((state) => ({
        conversations: state.conversations.map(msg => 
          msg.id === id ? { ...msg, ...updates } : msg
        )
      })),
      deleteMessage: (id) => set((state) => ({
        conversations: state.conversations.filter(msg => msg.id !== id)
      })),
      
      // Group actions
      addGroup: (group) => set((state) => ({
        groups: [...state.groups, group]
      })),
      updateGroup: (id, updates) => set((state) => ({
        groups: state.groups.map(group => 
          group.id === id ? { ...group, ...updates } : group
        )
      })),
      leaveGroup: (groupId) => set((state) => ({
        groups: state.groups.filter(group => group.id !== groupId),
        activeChat: state.activeChat === groupId ? null : state.activeChat
      })),
      
      // UI actions
      setActiveChat: (chatId, chatType) => set({ 
        activeChat: chatId, 
        activeChatType: chatType 
      }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'nonet-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        language: state.language,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

// Connectivity monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useChatStore.getState().setOnlineStatus(true)
  })
  
  window.addEventListener('offline', () => {
    useChatStore.getState().setOnlineStatus(false)
  })
}