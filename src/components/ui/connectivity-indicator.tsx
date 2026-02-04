'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { useChatStore } from '@/lib/store'
import { ConnectivityService, ConnectivityStatus } from '@/lib/connectivity'
import { 
  Wifi, 
  WifiOff, 
  Radio, 
  Users, 
  Signal,
  AlertTriangle
} from 'lucide-react'

export function ConnectivityIndicator() {
  const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus | null>(null)
  const { isOnline, connectionType, meshPeers } = useChatStore()

  useEffect(() => {
    const connectivityService = ConnectivityService.getInstance()
    
    // Set initial status after a small delay to avoid synchronous setState
    const timer = setTimeout(() => {
      setConnectivityStatus(connectivityService.getCurrentStatus())
    }, 0)
    
    // Listen for connectivity changes
    const handleConnectivityChange = (status: ConnectivityStatus) => {
      setConnectivityStatus(status)
    }
    
    connectivityService.onConnectivityChange(handleConnectivityChange)
    
    return () => {
      clearTimeout(timer)
      connectivityService.removeConnectivityCallback(handleConnectivityChange)
    }
  }, [])

  const getStatusColor = () => {
    if (!connectivityStatus) return 'secondary'
    
    if (connectivityStatus.connectionType === 'internet') {
      switch (connectivityStatus.internetQuality) {
        case 'excellent': return 'default'
        case 'good': return 'secondary'
        case 'poor': return 'outline'
        default: return 'destructive'
      }
    }
    
    if (connectivityStatus.connectionType === 'mesh') {
      return connectivityStatus.meshPeers > 0 ? 'secondary' : 'destructive'
    }
    
    return 'destructive'
  }

  const getStatusText = () => {
    if (!connectivityStatus) return 'Checking...'
    
    if (connectivityStatus.connectionType === 'internet') {
      switch (connectivityStatus.internetQuality) {
        case 'excellent': return 'Excellent Internet'
        case 'good': return 'Good Internet'
        case 'poor': return 'Poor Internet'
        default: return 'No Internet'
      }
    }
    
    if (connectivityStatus.connectionType === 'mesh') {
      return `Mesh Network (${connectivityStatus.meshPeers} peers)`
    }
    
    return 'Offline'
  }

  const getStatusIcon = () => {
    if (!connectivityStatus) return <AlertTriangle className="h-3 w-3" />
    
    if (connectivityStatus.connectionType === 'internet') {
      switch (connectivityStatus.internetQuality) {
        case 'excellent':
        case 'good':
          return <Wifi className="h-3 w-3" />
        case 'poor':
          return <Wifi className="h-3 w-3" />
        default:
          return <WifiOff className="h-3 w-3" />
      }
    }
    
    if (connectivityStatus.connectionType === 'mesh') {
      return <Radio className="h-3 w-3" />
    }
    
    return <WifiOff className="h-3 w-3" />
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">NoNet Chat</h1>
            
            <Badge variant={getStatusColor()} className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </Badge>

            {connectivityStatus?.connectionType === 'mesh' && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{meshPeers} peers</span>
                {connectivityStatus.signalStrength > 0 && (
                  <>
                    <Signal className="h-3 w-3 ml-2" />
                    <span>{connectivityStatus.signalStrength}%</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {connectivityStatus?.connectionType === 'mesh' && (
              <Badge variant="outline" className="text-xs">
                <Radio className="h-3 w-3 mr-1" />
                Mesh Mode
              </Badge>
            )}
            
            {connectivityStatus?.connectionType === 'internet' && (
              <Badge variant="outline" className="text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                Internet Mode
              </Badge>
            )}
            
            {!connectivityStatus?.isOnline && connectivityStatus.meshPeers === 0 && (
              <Badge variant="destructive" className="text-xs">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}