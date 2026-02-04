'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Download, 
  Eye, 
  File, 
  Image as ImageIcon, 
  Video, 
  Music,
  FileText,
  Loader2,
  X
} from 'lucide-react'
import { FileService, FileUploadResult } from '@/lib/file-service'

interface FileMessageProps {
  message: {
    id: string
    content: string
    senderId: string
    createdAt: Date
  }
  isOwn: boolean
}

interface ParsedFileData {
  file: FileUploadResult
  category: 'image' | 'video' | 'document' | 'audio' | 'other'
  encrypted: boolean
}

export function FileMessage({ message, isOwn }: FileMessageProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const fileService = FileService.getInstance()
  
  let fileData: ParsedFileData | null = null
  
  try {
    fileData = JSON.parse(message.content)
  } catch {
    return (
      <Card className={`max-w-md ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        <CardContent className="p-3">
          <p className="text-sm">Invalid file data</p>
        </CardContent>
      </Card>
    )
  }
  
  if (!fileData) {
    return null
  }

  const handlePreview = async () => {
    if (fileData.category !== 'image' && fileData.category !== 'video') {
      // For non-previewable files, just download
      handleDownload()
      return
    }
    
    setIsLoading(true)
    
    try {
      const url = await fileService.previewFile(fileData.file)
      setPreviewUrl(url)
      setPreviewOpen(true)
    } catch (error) {
      console.error('Failed to preview file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      await fileService.downloadFile(fileData.file)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  const getFileIcon = () => {
    switch (fileData.category) {
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

  const isPreviewable = fileData.category === 'image' || fileData.category === 'video'

  return (
    <>
      <Card className={`max-w-md ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Thumbnail/Icon */}
            <div className="flex-shrink-0">
              {fileData.file.thumbnailPath ? (
                <img 
                  src={fileData.file.thumbnailPath} 
                  alt="Thumbnail"
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                getFileIcon()
              )}
            </div>
            
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate text-sm">
                {fileData.file.fileName}
              </h4>
              
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs opacity-70">
                  {fileService.formatFileSize(fileData.file.fileSize)}
                </span>
                
                {fileData.encrypted && (
                  <Badge variant="secondary" className="text-xs">
                    🔒 Encrypted
                  </Badge>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2">
                {isPreviewable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handlePreview}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Eye className="h-3 w-3 mr-1" />
                    )}
                    Preview
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate">
                {fileData.file.fileName}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex justify-center">
            {previewUrl ? (
              fileData.category === 'image' ? (
                <img 
                  src={previewUrl} 
                  alt="Preview"
                  className="max-w-full max-h-96 object-contain rounded"
                />
              ) : (
                <video 
                  src={previewUrl} 
                  controls
                  className="max-w-full max-h-96 rounded"
                />
              )
            ) : (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download {fileData.file.fileName}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}