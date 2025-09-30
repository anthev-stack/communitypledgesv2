import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const discordUrl = searchParams.get('url')

    if (!discordUrl) {
      return NextResponse.json(
        { error: 'Discord URL is required' },
        { status: 400 }
      )
    }

    // Extract invite code from Discord URL
    const inviteCode = extractInviteCode(discordUrl)
    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invalid Discord invite URL' },
        { status: 400 }
      )
    }

    // Fetch Discord invite information
    const discordResponse = await fetch(
      `https://discord.com/api/v10/invites/${inviteCode}?with_counts=true&with_expiration=true`,
      {
        headers: {
          'User-Agent': 'CommunityPledges/1.0',
        },
      }
    )

    if (!discordResponse.ok) {
      if (discordResponse.status === 404) {
        return NextResponse.json(
          { error: 'Discord invite not found or expired' },
          { status: 404 }
        )
      }
      throw new Error(`Discord API error: ${discordResponse.status}`)
    }

    const discordData = await discordResponse.json()

    // Format the response data
    const formattedData = {
      serverName: discordData.guild?.name || 'Unknown Server',
      memberCount: discordData.approximate_member_count || 0,
      onlineMembers: discordData.approximate_presence_count || 0,
      iconUrl: discordData.guild?.icon 
        ? `https://cdn.discordapp.com/icons/${discordData.guild.id}/${discordData.guild.icon}.png?size=128`
        : null,
      bannerUrl: discordData.guild?.banner 
        ? `https://cdn.discordapp.com/banners/${discordData.guild.id}/${discordData.guild.banner}.png?size=512`
        : null,
      features: discordData.guild?.features || [],
      expiresAt: discordData.expires_at || null,
      isActive: true,
    }

    return NextResponse.json({
      success: true,
      data: formattedData,
    })

  } catch (error) {
    console.error('Discord API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch Discord information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function extractInviteCode(url: string): string | null {
  try {
    // Handle various Discord invite URL formats
    const patterns = [
      /discord\.gg\/([a-zA-Z0-9]+)/,
      /discord\.com\/invite\/([a-zA-Z0-9]+)/,
      /discord\.me\/([a-zA-Z0-9]+)/,
      /discord\.li\/([a-zA-Z0-9]+)/,
      /discordapp\.com\/invite\/([a-zA-Z0-9]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting invite code:', error)
    return null
  }
}