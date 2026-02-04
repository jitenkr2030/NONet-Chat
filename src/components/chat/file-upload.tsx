'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon, 
  Video, 
  Music,
  FileText,
  Download,
  Eye,
  Loader2
} from 'lucide-react'
import { FileService, FileUploadResult } from '@/lib/file-service'
import { useChatStore } from '@/lib/store'

interface FileUploadProps {
  receiverId: string
  groupId?: string
  onFileSent?: (messageId: string) => void
  onError?: (error: string) => void
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  messageId?: string
}

export function FileUpload({ receiverId, groupId, onFileSent, onError }: FileUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentUser } = useChatStore()
  
  const fileService = FileService.getInstance()

  const handleFileSelect = async (files: FileList) => {
    const newFiles: UploadingFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file
      const validation = fileService.validateFile(file)
      if (!validation.valid) {
        onError?.(validation.error || 'Invalid file')
        continue
      }
      
      newFiles.push({
        file,
        progress: 0,
        status: 'uploading'
      })
    }
    
    if (newFiles.length === 0) return
    
    setUploadingFiles(prev => [...prev, ...newFiles])
    
    // Upload files
    for (let i = 0; i < newFiles.length; i++) {
      await uploadFile(newFiles[i])
    }
  }

  const uploadFile = async (uploadingFile: UploadingFile) => {
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f === uploadingFile 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        )
      }, 200)
      
      // Upload file
      const result = await fileService.uploadAndSendFile(
        uploadingFile.file,
        receiverId,
        groupId
      )
      
      clearInterval(progressInterval)
      
      if (result.success) {
        setUploadingFiles(prev => 
          prev.map(f => 
            f === uploadingFile 
              ? { ...f, progress: 100, status: 'success', messageId: result.messageId }
              : f
          )
        )
        
        onFileSent?.(result.messageId!)
        
        // Remove successful uploads after 2 seconds
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f !== uploadingFile))
        }, 2000)
        
      } else {
        setUploadingFiles(prev => 
          prev.map(f => 
            f === uploadingFile 
              ? { ...f, status: 'error', error: result.error }
              : f
          )
        )
        
        onError?.(result.error || 'Upload failed')
      }
      
    } catch (error) {
      setUploadingFiles(prev => 
        prev.map(f => 
          f === uploadingFile 
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        )
      )
      
      onError?.('Upload failed')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleFileInputClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const removeUploadingFile = (file: UploadingFile) => {
    setUploadingFiles(prev => prev.filter(f => f !== file))
  }

  const getFileIcon = (file: File) => {
    const category = fileService.getFileCategory(file.type)
    
    switch (category) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-green-500" />
      case 'video':
        return <Video className="h-8 w-8 text-blue-500" />
      case 'audio':
        return <Music className="h-8 w-8 text-purple-500" />
      case 'document':
        return <FileText className="h-8 w-8 text-orange-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        disabled={!currentUser}
      >
        <Upload className="h-5 w-5" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Files</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Upload Area */}
            <Card 
              className={`border-2 border-dashed transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Drop files here or click to browse</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Supports images, videos, documents up to 50MB
                </p>
                <Button onClick={handleFileInputClick}>
                  Select Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                />
              </CardContent>
            </Card>

            {/* Uploading Files */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Uploading</h4>
                {uploadingFiles.map((uploadingFile, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(uploadingFile.file)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">
                            {uploadingFile.file.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {uploadingFile.status === 'uploading' && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {uploadingFile.status === 'success' && (
                              <Badge variant="secondary" className="text-xs">Success</Badge>
                            )}
                            {uploadingFile.status === 'error' && (
                              <Badge variant="destructive" className="text-xs">Error</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeUploadingFile(uploadingFile)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{fileService.formatFileSize(uploadingFile.file.size)}</span>
                          {uploadingFile.error && (
                            <span className="text-red-500">{uploadingFile.error}</span>
                          )}
                        </div>
                        
                        {uploadingFile.status === 'uploading' && (
                          <Progress value={uploadingFile.progress} className="mt-2" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* File Type Info */}
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Supported file types:</p>
              <div className="grid grid-cols-2 gap-1">
                <div>• Images: JPEG, PNG, GIF, WebP</div>
                <div>• Videos: MP4, WebM, OGG</div>
                <div>• Documents: PDF, Word, Excel, Text</div>
                <div>• Maximum size: 50MB per file</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}