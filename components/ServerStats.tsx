'use client'

import { useState, useEffect } from 'react'
import { Server, Users, MapPin, Wifi, WifiOff, RefreshCw } from 'lucide-react'

interface ServerStatsProps {
  serverId: string
  gameType: string
  className?: string
}

interface ServerStatsData {
  serverId: string
  serverName: string
  gameType: string
  stats: {
    online: boolean
    players?: {
      online: number
      max: number
    }
    version?: string
    motd?: string
    map?: string
    gamemode?: string
    uptime?: string
    serverType?: string
    error?: string
  }
}

export default function ServerStats({ serverId, gameType, className = '' }: ServerStatsProps) {
  const [stats, setStats] = useState<ServerStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/servers/${serverId}/stats`)
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      } else {
        setError(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      setError('Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [serverId])

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-400 ${className}`}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading stats...</span>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-red-400 ${className}`}>
        <WifiOff className="w-4 h-4" />
        <span>{error || 'Stats unavailable'}</span>
        <button
          onClick={fetchStats}
          className="ml-2 text-emerald-400 hover:text-emerald-300"
          title="Retry"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    )
  }

  const { online, players, version, motd, map, gamemode, uptime, serverType } = stats.stats

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Online/Offline Status */}
      <div className="flex items-center space-x-2">
        {online ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${online ? 'text-green-400' : 'text-red-400'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
        <button
          onClick={fetchStats}
          className="ml-2 text-gray-400 hover:text-gray-300"
          title="Refresh stats"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {online && (
        <div className="space-y-1">
          {/* Players Online */}
          {players && (
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Users className="w-4 h-4" />
              <span>
                {players.online}/{players.max} players
              </span>
            </div>
          )}

          {/* Game-specific stats */}
          {gameType.toLowerCase() === 'minecraft' && (
            <>
              {version && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <Server className="w-4 h-4" />
                  <span>v{version}</span>
                </div>
              )}
            </>
          )}

          {(gameType.toLowerCase().includes('counter-strike') || gameType.toLowerCase().includes('cs2')) && (
            <>
              {map && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{map}</span>
                </div>
              )}
              {gamemode && (
                <div className="text-sm text-gray-300">
                  {gamemode}
                </div>
              )}
            </>
          )}

          {gameType.toLowerCase() === 'rust' && (
            <>
              {map && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{map}</span>
                </div>
              )}
              {uptime && (
                <div className="text-sm text-gray-300">
                  Uptime: {uptime}
                </div>
              )}
            </>
          )}

          {gameType.toLowerCase() === 'ark' && (
            <>
              {map && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{map}</span>
                </div>
              )}
              {serverType && (
                <div className="text-sm text-gray-300">
                  {serverType}
                </div>
              )}
            </>
          )}

          {/* Additional game types */}
          {(gameType.toLowerCase() === 'csgo' || gameType.toLowerCase().includes('counter-strike')) && (
            <>
              {map && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{map}</span>
                </div>
              )}
              {gamemode && (
                <div className="text-sm text-gray-300">
                  {gamemode}
                </div>
              )}
            </>
          )}

          {(gameType.toLowerCase() === 'tf2' || gameType.toLowerCase() === 'team fortress 2') && (
            <>
              {map && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{map}</span>
                </div>
              )}
              {gamemode && (
                <div className="text-sm text-gray-300">
                  {gamemode}
                </div>
              )}
            </>
          )}

          {(gameType.toLowerCase() === 'gmod' || gameType.toLowerCase() === 'garry\'s mod') && (
            <>
              {map && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{map}</span>
                </div>
              )}
              {gamemode && (
                <div className="text-sm text-gray-300">
                  {gamemode}
                </div>
              )}
            </>
          )}

          {gameType.toLowerCase() === 'valheim' && (
            <>
              {map && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{map}</span>
                </div>
              )}
              {gamemode && (
                <div className="text-sm text-gray-300">
                  {gamemode}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
