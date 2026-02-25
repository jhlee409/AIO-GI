/**
 * API Route: Save Video Watch Time on Logout
 * Converts all 'checking' sessions to 'final' sessions when user logs out
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        let email: string | null = null;

        // JSON 또는 FormData 형식 모두 지원
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            const body = await request.json();
            email = body.email;
        } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            email = formData.get('email') as string;
        } else {
            // 기본적으로 JSON으로 시도
            try {
                const body = await request.json();
                email = body.email;
            } catch {
                // JSON 파싱 실패 시 FormData로 시도
                const formData = await request.formData();
                email = formData.get('email') as string;
            }
        }

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const watchTimeRef = adminDb.collection('video_watch_times');

        // Find all 'checking' sessions for this user
        const checkingSessions = await watchTimeRef
            .where('email', '==', email)
            .where('sessionType', '==', 'checking')
            .get();

        if (checkingSessions.empty) {
            return NextResponse.json({
                success: true,
                message: 'No active sessions to save',
                savedCount: 0
            });
        }

        // Convert each 'checking' session to 'final' session
        const batch = adminDb.batch();
        let savedCount = 0;

        checkingSessions.docs.forEach(doc => {
            const data = doc.data();
            const watchedTime = data.watchedTime || 0;
            const duration = data.duration || 0;

            // Only save if there's meaningful watch time
            if (watchedTime > 0 && duration > 0) {
                // Create a new 'final' record for this session
                const newFinalRef = watchTimeRef.doc();
                batch.set(newFinalRef, {
                    email: data.email,
                    position: data.position || '',
                    name: data.name || '',
                    hospital: data.hospital || '',
                    videoUrl: data.videoUrl || '',
                    videoTitle: data.videoTitle || '',
                    category: data.category || '',
                    duration: duration,
                    watchedTime: watchedTime,
                    lastUpdated: new Date(),
                    logCreated: data.logCreated || false,
                    sessionType: 'final'
                });

                // Delete the 'checking' session
                batch.delete(doc.ref);
                savedCount++;
            } else {
                // If no meaningful watch time, just delete the checking session
                batch.delete(doc.ref);
            }
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: `Saved ${savedCount} video watch sessions`,
            savedCount
        });
    } catch (error: any) {
        console.error('Error saving watch time on logout:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save watch time on logout' },
            { status: 500 }
        );
    }
}

