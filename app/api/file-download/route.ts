/**
 * API Route: Download File from Firebase Storage
 * Downloads file from Firebase Storage and streams it to the client
 * This avoids CORS issues by handling the download server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const storagePath = request.nextUrl.searchParams.get('path');
        const fileName = request.nextUrl.searchParams.get('fileName') || storagePath?.split('/').pop() || 'download';

        if (!storagePath) {
            return NextResponse.json(
                { error: 'Storage path is required' },
                { status: 400 }
            );
        }

        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const file = bucket.file(storagePath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Get file metadata
        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType || 'application/octet-stream';

        // Download file from Storage
        const [buffer] = await file.download();

        // Return file as response with proper headers
        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('Error downloading file:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to download file' },
            { status: 500 }
        );
    }
}

