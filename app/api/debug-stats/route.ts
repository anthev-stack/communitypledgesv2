import { NextRequest, NextResponse } from 'next/server'
import { status } from 'minecraft-server-util'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ip = searchParams.get('ip')
  const port = parseInt(searchParams.get('port') || '25565')
  const gameType = searchParams.get('gameType') || 'minecraft'

  if (!ip) {
    return NextResponse.json({ error: 'IP parameter required' }, { status: 400 })
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
    console.log(`Testing connection to ${ip}:${finalPort} (${gameType})`)

    if (gameType.toLowerCase() === 'minecraft') {
      const result = await status(ip, finalPort, { timeout: 5000 })
      return NextResponse.json({
        success: true,
        gameType: 'minecraft',
        data: {
          online: true,
          players: {
            online: result.players.online,
            max: result.players.max
          },
          version: result.version.name,
          motd: result.motd.clean
        }
      })
    } else {
      // For non-Minecraft games, try a simple TCP connection test
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
        return NextResponse.json({
          success: true,
          gameType: gameType,
          data: {
            online: true,
            players: {
              online: 0,
              max: 0
            },
            map: 'Unknown',
            gamemode: gameType,
            note: 'Server is online but detailed stats are not available'
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Server is offline or unreachable',
          gameType,
          ip,
          port
        })
      }
    }
  } catch (error) {
    console.error(`Connection test failed for ${ip}:${finalPort}:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      gameType,
      ip,
      port: finalPort
    })
  }
}