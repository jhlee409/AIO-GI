/**
 * API Route: Track Video Watch Time
 * Tracks video watch time and creates log file when 80% threshold is reached
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { getWatchTimeCompletionLogItem, WATCH_TIME_COMPLETION_THRESHOLD_PERCENT } from '@/lib/report-watch-time';
import { requireUser } from '@/lib/api-auth';

const safeLogPart = (value: string) => value.replace(/[\\/\x00-\x1f]/g, '_').trim();

export async function POST(request: NextRequest) {
    const access = await requireUser(request);
    if (access instanceof NextResponse) return access;
    try {
        const { 
            email, 
            position, 
            name, 
            hospital,
            videoUrl,
            videoTitle,
            category,
            duration, // 총 동영상 길이 (초)
            watchedTime, // 시청한 시간 (초)
            trackingMethod,
            attemptId,
            action // 'update' or 'check'
        } = await request.json();

        console.log('[watch-time API] Received request:', {
            email,
            position,
            name,
            hospital,
            videoTitle,
            category,
            action,
            watchedTime,
            duration,
            videoUrl
        });

        if (typeof email !== 'string' || email.toLowerCase() !== access.email.toLowerCase()) {
            return NextResponse.json({ error: 'Watch time identity does not match the signed-in user' }, { status: 403 });
        }
        if (typeof videoUrl !== 'string' || !videoUrl || typeof duration !== 'number' ||
            !Number.isFinite(duration) || duration <= 0 || typeof watchedTime !== 'number' ||
            !Number.isFinite(watchedTime) || watchedTime < 0 || (action !== 'check' && action !== 'update')) {
            console.error('[watch-time API] Missing required fields:', {
                email: !!email,
                videoUrl: !!videoUrl,
                duration,
                watchedTime
            });
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const watchTimeRef = adminDb.collection('video_watch_times');
        let sessionRef: ReturnType<typeof watchTimeRef.doc> | null = null;
        
        const threshold = duration * WATCH_TIME_COMPLETION_THRESHOLD_PERCENT / 100;
        const shouldCreateLog = watchedTime >= threshold;
        const completionLogItem = getWatchTimeCompletionLogItem(videoTitle);

        if (action === 'update') {
            // 'update'는 종료(X/메뉴 변경/언마운트 등) 시 최종 저장이며, 각 시청 세션을 별도 레코드로 저장한다.
            // 리포트 생성 시에는 calculateAccumulatedWatchTime에서 여러 세션 중 MAX % 만 반영한다.
            const finalData = {
                email,
                position: position || '',
                name: name || '',
                hospital: hospital || '',
                videoUrl,
                videoTitle: videoTitle || '',
                category: category || '',
                duration,
                watchedTime,
                trackingMethod: trackingMethod || 'current-time-v1',
                attemptId: attemptId || '',
                lastUpdated: new Date(),
                logCreated: false,
                sessionType: 'final' // 최종 저장된 세션임을 표시
            };
            
            console.log('[watch-time API] Saving final session:', finalData);
            const docRef = await watchTimeRef.add(finalData);
            sessionRef = docRef;
            console.log('[watch-time API] Final session saved with ID:', docRef.id);
            
            // Verify the saved data
            const savedDoc = await docRef.get();
            const savedData = savedDoc.data();
            console.log('[watch-time API] Verified saved data:', savedData);
        } else {
            // 'check'는 주기적 체크이므로, 기존 레코드를 업데이트 (진행 중인 세션 추적)
            const existingRecord = await watchTimeRef
                .where('email', '==', email)
                .where('videoUrl', '==', videoUrl)
                .where('sessionType', '==', 'checking') // 진행 중인 세션만 찾기
                .limit(1)
                .get();

            if (existingRecord.empty) {
                // 진행 중인 세션이 없으면 새로 생성
                sessionRef = await watchTimeRef.add({
                    email,
                    position: position || '',
                    name: name || '',
                    hospital: hospital || '',
                    videoUrl,
                    videoTitle: videoTitle || '',
                    category: category || '',
                    duration,
                    watchedTime,
                    trackingMethod: trackingMethod || 'current-time-v1',
                    attemptId: attemptId || '',
                    lastUpdated: new Date(),
                    logCreated: false,
                    sessionType: 'checking' // 진행 중인 세션임을 표시
                });
            } else {
                // 진행 중인 세션이 있으면 업데이트 (더 큰 경우에만)
                const doc = existingRecord.docs[0];
                sessionRef = doc.ref;
                const currentData = doc.data();
                
                if (watchedTime > (currentData.watchedTime || 0)) {
                    await doc.ref.update({
                        watchedTime,
                        trackingMethod: trackingMethod || currentData.trackingMethod || 'current-time-v1',
                        attemptId: attemptId || currentData.attemptId || '',
                        lastUpdated: new Date()
                    });
                }
            }
        }

        // If 80% threshold reached and log not created yet, create log file
        if (shouldCreateLog && !completionLogItem && sessionRef) {
                const record = (await sessionRef.get()).data();
                if (!record?.logCreated) {
                    // Create log file
                    const fileName = `${safeLogPart(position || 'Unknown')}-${safeLogPart(name || 'Unknown')}-${safeLogPart(videoTitle || category || 'VIDEO')}`;
                    const logContent = `Position: ${position || 'Unknown'}
Name: ${name || 'Unknown'}
Hospital: ${hospital || 'Unknown'}
Email: ${email}
Category: ${category || 'Unknown'}
Video Title: ${videoTitle || 'Unknown'}
Video URL: ${videoUrl}
Duration: ${duration} seconds
Watched Time: ${watchedTime} seconds (${((watchedTime / duration) * 100).toFixed(2)}%)
Tracking Method: ${trackingMethod || 'current-time-v1'}
Action: Video Play
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                    const adminStorage = getAdminStorage();
                    const bucket = adminStorage.bucket();
                    const file = bucket.file(`log/${fileName}`);

                    const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
                    const buffer = Buffer.concat([utf8BOM, Buffer.from(logContent, 'utf-8')]);

                    const [exists] = await file.exists();
                    if (!exists) {
                        await file.save(buffer, {
                            metadata: {
                                contentType: 'text/plain; charset=utf-8',
                            },
                        });
                    }

                    // Mark log as created
                    await sessionRef.update({ logCreated: true });
                }
        }

        // These lectures used to write a log as soon as playback began.
        // Only a persisted 80% viewing may create a reportable completion log.
        if (completionLogItem && shouldCreateLog) {
            const fileName = `${safeLogPart(position || 'Unknown')}-${safeLogPart(name || 'Unknown')}-${completionLogItem}-Completed`;
            const file = getAdminStorage().bucket().file(`log/${fileName}`);
            const [exists] = await file.exists();
            if (!exists) {
                const logContent = `Position: ${position || 'Unknown'}
Name: ${name || 'Unknown'}
Hospital: ${hospital || 'Unknown'}
Email: ${email}
Category: ${category || 'Unknown'}
Item: ${completionLogItem}
Video Title: ${videoTitle}
Duration: ${duration} seconds
Watched Time: ${watchedTime} seconds (${((watchedTime / duration) * 100).toFixed(2)}%)
Action: Video 80% Completed
Timestamp: ${new Date().toISOString()}`;
                const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
                await file.save(Buffer.concat([utf8BOM, Buffer.from(logContent, 'utf-8')]), {
                    metadata: { contentType: 'text/plain; charset=utf-8' },
                });
            }
            await sessionRef?.update({ logCreated: true });
        }

        return NextResponse.json({
            success: true,
            watchedTime,
            duration,
            percentage: (watchedTime / duration) * 100,
            thresholdReached: shouldCreateLog
        });
    } catch (error) {
        console.error('Error tracking watch time:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to track watch time' },
            { status: 500 }
        );
    }
}

