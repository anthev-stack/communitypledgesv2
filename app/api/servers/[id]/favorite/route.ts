import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverId = params.id;

    // Check if server exists
    const server = await prisma.server.findUnique({
      where: { id: serverId }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId: serverId
        }
      }
    });

    if (existingFavorite) {
      return NextResponse.json({ error: 'Server already favorited' }, { status: 400 });
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        serverId: serverId
      }
    });

    return NextResponse.json({
      success: true,
      favorite
    });

  } catch (error) {
    console.error('Error favoriting server:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverId = params.id;

    // Remove favorite
    const deletedFavorite = await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        serverId: serverId
      }
    });

    return NextResponse.json({
      success: true,
      deleted: deletedFavorite.count > 0
    });

  } catch (error) {
    console.error('Error unfavoriting server:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

