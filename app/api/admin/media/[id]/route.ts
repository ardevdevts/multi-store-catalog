import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/session'
import { prisma } from '@/lib/db'
import { deleteStoredImage } from '@/lib/media-storage'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireApiAuth(request)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
        const { id } = await params

        const media = await prisma.media.findUnique({
            where: { id },
        })

        if (!media) {
            return NextResponse.json({ error: 'Media not found' }, { status: 404 })
        }

        // Remove the bytes from whichever backend holds them (MinIO or database)
        await deleteStoredImage(media.url)

        await prisma.media.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting media:', error)
        return NextResponse.json(
            { error: 'Failed to delete media' },
            { status: 500 }
        )
    }
}
