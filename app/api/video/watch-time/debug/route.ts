/**
 * Debug API: Check if watch time data exists in Firestore
 * GET /api/video/watch-time/debug?email=xxx&videoTitle=xxx
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const email = searchParams.get('email');
        const videoTitle = searchParams.get('videoTitle');

        if (!email) {
            return NextResponse.json(
                { error: 'Email parameter is required' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const watchTimeRef = adminDb.collection('video_watch_times');

        // Get all records for this email
        const query = watchTimeRef.where('email', '==', email);
        
        if (videoTitle) {
            // If videoTitle is provided, filter by it
            const snapshot = await query.get();
            const filteredDocs = snapshot.docs.filter(doc => {
                const data = doc.data();
                const title = (data.videoTitle || '').toLowerCase();
                return title.includes(videoTitle.toLowerCase());
            });

            return NextResponse.json({
                email,
                videoTitle,
                totalRecords: filteredDocs.length,
                records: filteredDocs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || doc.data().lastUpdated
                }))
            });
        } else {
            // Get all records for this email
            const snapshot = await query.get();
            
            return NextResponse.json({
                email,
                totalRecords: snapshot.docs.length,
                records: snapshot.docs.map(doc => ({
                    id: doc.id,
                    videoTitle: doc.data().videoTitle,
                    category: doc.data().category,
                    watchedTime: doc.data().watchedTime,
                    duration: doc.data().duration,
                    sessionType: doc.data().sessionType,
                    lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || doc.data().lastUpdated
                }))
            });
        }
    } catch (error: any) {
        console.error('[watch-time debug] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch watch time data' },
            { status: 500 }
        );
    }
}

