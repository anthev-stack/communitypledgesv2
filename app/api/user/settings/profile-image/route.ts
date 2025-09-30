import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const profileImage = formData.get('profileImage') as File | null

    if (!profileImage || profileImage.size === 0) {
      return NextResponse.json(
        { message: 'No image provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(profileImage.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload a PNG, JPG, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (profileImage.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'File too large. Please upload an image smaller than 5MB.' },
        { status: 400 }
      )
    }

    // Handle profile image upload
    const bytes = await profileImage.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = profileImage.name.split('.').pop()
    const filename = `${session.user.id}-${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    // Write file
    await writeFile(filepath, buffer)
    
    // Update image path
    const imagePath = `/uploads/profiles/${filename}`

    // Update user's profile image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imagePath },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile image:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}



