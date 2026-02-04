import { MessageService } from './message-service'
import { EncryptionService } from './encryption'
import { useChatStore } from '@/lib/store'

export interface FileUploadResult {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  filePath: string
  thumbnailPath?: string
  encryptedPath?: string
}

export class FileService {
  private static instance: FileService
  private maxFileSize = 50 * 1024 * 1024 // 50MB
  private supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  private supportedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg']
  private supportedDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
  
  private constructor() {}
  
  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService()
    }
    return FileService.instance
  }
  
  // Validate file before upload
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`
      }
    }
    
    // Check file type
    const allSupportedTypes = [
      ...this.supportedImageTypes,
      ...this.supportedVideoTypes,
      ...this.supportedDocumentTypes
    ]
    
    if (!allSupportedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Unsupported file type'
      }
    }
    
    return { valid: true }
  }
  
  // Get file category
  getFileCategory(mimeType: string): 'image' | 'video' | 'document' | 'audio' | 'other' {
    if (this.supportedImageTypes.includes(mimeType)) return 'image'
    if (this.supportedVideoTypes.includes(mimeType)) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (this.supportedDocumentTypes.includes(mimeType)) return 'document'
    return 'other'
  }
  
  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // Generate thumbnail for images
  async generateImageThumbnail(file: File): Promise<string | null> {
    if (!this.supportedImageTypes.includes(file.type)) {
      return null
    }
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate thumbnail dimensions (max 200x200)
        const maxSize = 200
        let width = img.width
        let height = img.height
        
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to base64
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnail)
      }
      
      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(file)
    })
  }
  
  // Generate thumbnail for videos
  async generateVideoThumbnail(file: File): Promise<string | null> {
    if (!this.supportedVideoTypes.includes(file.type)) {
      return null
    }
    
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      video.addEventListener('loadeddata', () => {
        // Seek to 1 second or 10% of video duration
        const seekTime = Math.min(1, video.duration * 0.1)
        video.currentTime = seekTime
      })
      
      video.addEventListener('seeked', () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnail)
        URL.revokeObjectURL(video.src)
      })
      
      video.addEventListener('error', () => {
        resolve(null)
        URL.revokeObjectURL(video.src)
      })
      
      video.src = URL.createObjectURL(file)
    })
  }
  
  // Upload file and send as message
  async uploadAndSendFile(
    file: File,
    receiverId: string,
    groupId?: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }
      
      // Generate thumbnail if it's an image or video
      let thumbnailPath: string | undefined
      const category = this.getFileCategory(file.type)
      
      if (category === 'image') {
        thumbnailPath = await this.generateImageThumbnail(file)
      } else if (category === 'video') {
        thumbnailPath = await this.generateVideoThumbnail(file)
      }
      
      // Read file as base64
      const fileBase64 = await this.fileToBase64(file)
      
      // Create file metadata
      const fileMetadata: FileUploadResult = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: fileBase64,
        thumbnailPath
      }
      
      // Encrypt file if needed (for sensitive files)
      let encryptedPath: string | undefined
      if (category === 'document' || file.size > 10 * 1024 * 1024) { // 10MB+
        const { currentUser } = useChatStore.getState()
        if (currentUser) {
          try {
            encryptedPath = EncryptionService.encryptMessage(fileBase64, currentUser.publicKey)
          } catch (error) {
            console.warn('Failed to encrypt file:', error)
          }
        }
      }
      
      // Create message content
      const messageContent = JSON.stringify({
        file: fileMetadata,
        category,
        encrypted: !!encryptedPath
      })
      
      // Send message
      const messageService = MessageService.getInstance()
      const message = await messageService.sendMessage(
        messageContent,
        receiverId,
        'file',
        groupId
      )
      
      // Store file locally for offline access
      this.storeFileLocally(fileMetadata)
      
      return {
        success: true,
        messageId: message.id
      }
      
    } catch (error) {
      console.error('File upload error:', error)
      return {
        success: false,
        error: 'Failed to upload file'
      }
    }
  }
  
  // Convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  // Store file locally in IndexedDB for offline access
  private async storeFileLocally(fileMetadata: FileUploadResult): Promise<void> {
    try {
      // Use IndexedDB for file storage
      const request = indexedDB.open('NoNetChatFiles', 1)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' })
        }
      }
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(['files'], 'readwrite')
        const store = transaction.objectStore('files')
        store.put(fileMetadata)
      }
      
    } catch (error) {
      console.error('Failed to store file locally:', error)
    }
  }
  
  // Retrieve file from local storage
  async getFileLocally(fileId: string): Promise<FileUploadResult | null> {
    try {
      const request = indexedDB.open('NoNetChatFiles', 1)
      
      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          const transaction = db.transaction(['files'], 'readonly')
          const store = transaction.objectStore('files')
          const getRequest = store.get(fileId)
          
          getRequest.onsuccess = () => {
            resolve(getRequest.result || null)
          }
          
          getRequest.onerror = () => {
            resolve(null)
          }
        }
        
        request.onerror = () => {
          resolve(null)
        }
      })
      
    } catch (error) {
      console.error('Failed to retrieve file locally:', error)
      return null
    }
  }
  
  // Download file
  async downloadFile(fileMetadata: FileUploadResult): Promise<void> {
    try {
      let fileData = fileMetadata.filePath
      
      // Decrypt if needed
      if (fileMetadata.encryptedPath) {
        const { currentUser } = useChatStore.getState()
        if (currentUser) {
          // In a real implementation, you'd use the appropriate private key
          // For now, just use the unencrypted path
          fileData = fileMetadata.filePath
        }
      }
      
      // Create download link
      const link = document.createElement('a')
      link.href = fileData
      link.download = fileMetadata.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }
  
  // Preview file
  async previewFile(fileMetadata: FileUploadResult): Promise<string | null> {
    try {
      let fileData = fileMetadata.filePath
      
      // Decrypt if needed
      if (fileMetadata.encryptedPath) {
        const { currentUser } = useChatStore.getState()
        if (currentUser) {
          // In a real implementation, you'd use the appropriate private key
          // For now, just use the unencrypted path
          fileData = fileMetadata.filePath
        }
      }
      
      return fileData
      
    } catch (error) {
      console.error('Failed to preview file:', error)
      return null
    }
  }
  
  // Clean up old files
  async cleanupOldFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const request = indexedDB.open('NoNetChatFiles', 1)
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(['files'], 'readwrite')
        const store = transaction.objectStore('files')
        const getRequest = store.getAll()
        
        getRequest.onsuccess = () => {
          const files = getRequest.result
          const now = Date.now()
          
          files.forEach((file: FileUploadResult) => {
            const fileAge = now - new Date(file.id).getTime()
            if (fileAge > maxAge) {
              store.delete(file.id)
            }
          })
        }
      }
      
    } catch (error) {
      console.error('Failed to cleanup old files:', error)
    }
  }
  
  // Get file icon based on type
  getFileIcon(mimeType: string): string {
    const category = this.getFileCategory(mimeType)
    
    switch (category) {
      case 'image':
        return '🖼️'
      case 'video':
        return '🎥'
      case 'audio':
        return '🎵'
      case 'document':
        if (mimeType.includes('pdf')) return '📄'
        if (mimeType.includes('word')) return '📝'
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
        if (mimeType.includes('text')) return '📄'
        return '📄'
      default:
        return '📎'
    }
  }
}