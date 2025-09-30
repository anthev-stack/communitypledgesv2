import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { status } from 'minecraft-server-util'

// Real server stats fetching
async function fetchServerStats(gameType: string, ip?: string, port?: number) {
  if (!ip) {
    return {
      online: false,
      error: 'Server IP not configured'
    }
  }

  // Set default port based on game type if not provided
  let finalPort = port
  if (!finalPort) {
    if (gameType.toLowerCase() === 'minecraft') {
      finalPort = 25565
    } else if (gameType.toLowerCase().includes('counter-strike') || gameType.toLowerCase().includes('cs2')) {
      finalPort = 27015
    } else if (gameType.toLowerCase() === 'rust') {
      finalPort = 28015
    } else if (gameType.toLowerCase() === 'ark') {
      finalPort = 27015
    } else {
      finalPort = 27015 // Default for most games
    }
  }

  try {
    const timeout = 5000 // 5 second timeout

    if (gameType.toLowerCase() === 'minecraft') {
      try {
        const response = await status(ip, finalPort, { timeout })
        
        return {
          online: true,
          players: {
            online: response.players.online,
            max: response.players.max
          },
          version: response.version.name || 'Unknown',
          motd: response.motd.clean || 'Welcome to our server!'
        }
      } catch (error) {
        console.error(`Minecraft server query failed for ${ip}:${finalPort}:`, error)
        return {
          online: false,
          error: `Server is offline or unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    } else {
      // For non-Minecraft games, try to use a simple TCP connection test
      try {
        const net = require('net')
        
        const isOnline = await new Promise((resolve) => {
          const socket = new net.Socket()
          const timeout = setTimeout(() => {
            socket.destroy()
            resolve(false)
          }, 5000)

          socket.connect(finalPort, ip, () => {
            clearTimeout(timeout)
            socket.destroy()
            resolve(true)
          })

          socket.on('error', () => {
            clearTimeout(timeout)
            resolve(false)
          })
        })

        if (isOnline) {
          // Server is online but we can't get detailed stats
          return {
            online: true,
            players: {
              online: 0,
              max: 0
            },
            map: 'Unknown',
            gamemode: gameType,
            note: 'Server is online but detailed stats are not available'
          }
        } else {
          return {
            online: false,
            error: 'Server is offline or unreachable'
          }
        }
      } catch (error) {
        console.error(`Server connection test failed for ${ip}:${finalPort}:`, error)
        return {
          online: false,
          error: `Server is offline or unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }

  } catch (error) {
    console.error('Error fetching server stats:', error)
    return {
      online: false,
      error: `Failed to connect to server: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serverId = params.id

    // Get server details
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: {
        id: true,
        name: true,
        gameType: true,
        serverIp: true,
        serverPort: true
      }
    })

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      )
    }

    // Fetch live stats
    const stats = await fetchServerStats(server.gameType, server.serverIp || undefined, server.serverPort || undefined)

    return NextResponse.json({
      serverId: server.id,
      serverName: server.name,
      gameType: server.gameType,
      stats
    })

  } catch (error) {
    console.error('Error fetching server stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch server stats' },
      { status: 500 }
    )
  }
}