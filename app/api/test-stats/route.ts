import { NextResponse } from 'next/server'
import { status } from 'minecraft-server-util'
import * as Gamedig from 'gamedig'

export async function GET() {
  try {
    // Test with a public Minecraft server
    const minecraftTest = await status('mc.hypixel.net', 25565, { timeout: 5000 })
    
    return NextResponse.json({
      success: true,
      minecraft: {
        online: true,
        players: {
          online: minecraftTest.players.online,
          max: minecraftTest.players.max
        },
        version: minecraftTest.version.name,
        motd: minecraftTest.motd.clean
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
