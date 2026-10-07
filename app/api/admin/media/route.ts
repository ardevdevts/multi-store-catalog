import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/session'
import { storeImage } from '@/lib/media-storage'
import { mediaAltSchema } from '@/lib/api-validators'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    const session = await requireApiAuth(request)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const alt = formData.get('alt') as string
        // Validate alt with Zod
        const parsedAlt = mediaAltSchema.safeParse({ alt })
        if (!parsedAlt.success) {
            return NextResponse.json({ error: 'Invalid input', issues: parsedAlt.error.issues }, { status: 400 })
        }

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // MinIO when reachable, database blob otherwise
        const stored = await storeImage(buffer, file.name, file.type)

        return NextResponse.json({
            url: stored.url,
            alt: parsedAlt.data.alt || file.name,
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    const session = await requireApiAuth(request)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const [media, totalDocs] = await Promise.all([
            prisma.media.findMany({
                skip,
                take: limit,
                orderBy: { id: 'desc' },
            }),
            prisma.media.count(),
        ])

        return NextResponse.json({
            docs: media,
            totalDocs,
            limit,
            totalPages: Math.ceil(totalDocs / limit),
            page,
        })
    } catch (error) {
        console.error('Error fetching media:', error)
        return NextResponse.json(
            { error: 'Failed to fetch media' },
            { status: 500 }
        )
    }
}
