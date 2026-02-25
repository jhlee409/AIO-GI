/**
 * API Route: Track Video Watch Time
 * Tracks video watch time and creates log file when 80% threshold is reached
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
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

        if (!email || !videoUrl || !duration || watchedTime === undefined) {
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
        
        const threshold = duration * 0.8; // 80% threshold
        const shouldCreateLog = watchedTime >= threshold;

        if (action === 'update') {
            // 'update'는 페이지 이동 시 최종 저장이므로, 각 시청 세션을 별도 레코드로 저장
            // 리포트 생성 시 모든 세션의 %를 합산하기 위함
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
                lastUpdated: new Date(),
                logCreated: shouldCreateLog,
                sessionType: 'final' // 최종 저장된 세션임을 표시
            };
            
            console.log('[watch-time API] Saving final session:', finalData);
            const docRef = await watchTimeRef.add(finalData);
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
                await watchTimeRef.add({
                    email,
                    position: position || '',
                    name: name || '',
                    hospital: hospital || '',
                    videoUrl,
                    videoTitle: videoTitle || '',
                    category: category || '',
                    duration,
                    watchedTime,
                    lastUpdated: new Date(),
                    logCreated: shouldCreateLog,
                    sessionType: 'checking' // 진행 중인 세션임을 표시
                });
            } else {
                // 진행 중인 세션이 있으면 업데이트 (더 큰 경우에만)
                const doc = existingRecord.docs[0];
                const currentData = doc.data();
                
                if (watchedTime > (currentData.watchedTime || 0)) {
                    await doc.ref.update({
                        watchedTime,
                        lastUpdated: new Date(),
                        logCreated: shouldCreateLog || currentData.logCreated
                    });
                }
            }
        }

        // If 80% threshold reached and log not created yet, create log file
        if (shouldCreateLog && action === 'check') {
            const existingRecord = await watchTimeRef
                .where('email', '==', email)
                .where('videoUrl', '==', videoUrl)
                .limit(1)
                .get();

            if (!existingRecord.empty) {
                const record = existingRecord.docs[0].data();
                if (!record.logCreated) {
                    // Create log file
                    const fileName = `${position || 'Unknown'}-${name || 'Unknown'}-${category || 'VIDEO'}`;
                    const logContent = `Position: ${position || 'Unknown'}
Name: ${name || 'Unknown'}
Hospital: ${hospital || 'Unknown'}
Email: ${email}
Category: ${category || 'Unknown'}
Video Title: ${videoTitle || 'Unknown'}
Video URL: ${videoUrl}
Duration: ${duration} seconds
Watched Time: ${watchedTime} seconds (${((watchedTime / duration) * 100).toFixed(2)}%)
Action: Video Play
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                    const adminStorage = getAdminStorage();
                    const bucket = adminStorage.bucket();
                    const file = bucket.file(`log/${fileName}`);

                    const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
                    const buffer = Buffer.concat([utf8BOM, Buffer.from(logContent, 'utf-8')]);

                    await file.save(buffer, {
                        metadata: {
                            contentType: 'text/plain; charset=utf-8',
                        },
                    });

                    // Mark log as created
                    await existingRecord.docs[0].ref.update({ logCreated: true });
                }
            }
        }

        return NextResponse.json({
            success: true,
            watchedTime,
            duration,
            percentage: (watchedTime / duration) * 100,
            thresholdReached: shouldCreateLog
        });
    } catch (error: any) {
        console.error('Error tracking watch time:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to track watch time' },
            { status: 500 }
        );
    }
}

