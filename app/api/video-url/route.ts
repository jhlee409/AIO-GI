import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';
import { requireUser } from '@/lib/api-auth';
import { isCourseVideoPath } from '@/lib/course-storage-access';

export async function GET(request: NextRequest) {
    const access = await requireUser(request);
    if (access instanceof NextResponse) return access;

    const storagePath = request.nextUrl.searchParams.get('path');
    if (!storagePath) {
        return NextResponse.json({ error: 'Storage path is required' }, { status: 400 });
    }
    if (!isCourseVideoPath(storagePath)) {
        return NextResponse.json({ error: 'Video path is not allowed' }, { status: 403 });
    }

    try {
        const file = getAdminStorage().bucket().file(storagePath);
        const [exists] = await file.exists();
        if (!exists) return NextResponse.json({ error: 'File not found' }, { status: 404 });

        // A signing failure must never change the object's public ACL.
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000,
        });
        return NextResponse.json({ url }, { headers: { 'Cache-Control': 'private, max-age=300' } });
    } catch (error) {
        console.error('Error getting video URL:', error);
        return NextResponse.json({ error: 'Failed to get video URL' }, { status: 500 });
    }
}
