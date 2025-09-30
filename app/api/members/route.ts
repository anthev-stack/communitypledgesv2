import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {

    // Get all users with basic stats only
    const members = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        servers: {
          where: {
            isActive: true
          },
          select: {
            id: true
          }
        },
        _count: {
          select: {
            pledges: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to include basic stats only
    const membersWithStats = members.map(member => ({
      id: member.id,
      name: member.name,
      image: member.image,
      createdAt: member.createdAt.toISOString(),
      serverCount: member.servers.length,
      pledgeCount: member._count.pledges
    }));

    return NextResponse.json({
      success: true,
      members: membersWithStats
    });

  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
