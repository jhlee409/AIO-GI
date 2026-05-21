/**
 * Cleanup API: Delete test watch time records for a specific email + videoTitle
 * DELETE /api/video/watch-time/cleanup?email=xxx&videoTitle=xxx
 *
 * Safety: both `email` and `videoTitle` are required to prevent accidental
 * mass deletion. Only matches records whose stored videoTitle (case-insensitive)
 * exactly equals the provided videoTitle.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const email = searchParams.get('email');
        const videoTitle = searchParams.get('videoTitle');

        if (!email || !videoTitle) {
            return NextResponse.json(
                { error: 'Both `email` and `videoTitle` query parameters are required.' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const watchTimeRef = adminDb.collection('video_watch_times');

        const snapshot = await watchTimeRef.where('email', '==', email).get();
        const target = videoTitle.toLowerCase().trim();

        const toDelete = snapshot.docs.filter(doc => {
            const stored = String(doc.data().videoTitle || '').toLowerCase().trim();
            return stored === target;
        });

        if (toDelete.length === 0) {
            return NextResponse.json({
                email,
                videoTitle,
                deleted: 0,
                message: 'No matching records found.'
            });
        }

        const deletedSummary = toDelete.map(doc => ({
            id: doc.id,
            sessionType: doc.data().sessionType,
            watchedTime: doc.data().watchedTime,
            duration: doc.data().duration
        }));

        const batch = adminDb.batch();
        toDelete.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return NextResponse.json({
            email,
            videoTitle,
            deleted: toDelete.length,
            records: deletedSummary
        });
    } catch (error: any) {
        console.error('[watch-time cleanup] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete watch time records' },
            { status: 500 }
        );
    }
}
