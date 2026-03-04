/**
 * Hook for calculating accumulated watch time
 * Fetches and aggregates video watch times from Firestore for report generation
 */
import { getAdminDb } from '@/lib/firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

export interface AccumulatedWatchTime {
    totalPercentage: number;
    duration: number;
    category?: string;
    videoUrl?: string;
    /** 가장 최근 시청 기록의 lastUpdated (24시간 이내 변경 감지용) */
    lastUpdated?: Date;
}

export async function calculateAccumulatedWatchTime(
    userEmails: Array<{ email: string; userName: string }>,
    adminDb: Firestore
): Promise<Map<string, Map<string, AccumulatedWatchTime>>> {
    const watchTimeMap = new Map<string, Map<string, AccumulatedWatchTime>>();

    if (userEmails.length === 0) {
        console.log('[calculateAccumulatedWatchTime] No user emails provided.');
        return watchTimeMap;
    }

    try {
        const watchTimeRef = adminDb.collection('video_watch_times');

        for (const { email } of userEmails) {
            const userWatchTimes = new Map<string, AccumulatedWatchTime>();
            try {
                // First, try to get all records for this email
                const userWatchTimeQuery = await watchTimeRef
                    .where('email', '==', email)
                    .get();

                console.log(`[calculateAccumulatedWatchTime] User email: ${email}, Found ${userWatchTimeQuery.docs.length} records`);
                
                // Debug: Show all records found
                if (userWatchTimeQuery.docs.length > 0) {
                    console.log(`[calculateAccumulatedWatchTime] Records for ${email}:`);
                    userWatchTimeQuery.docs.forEach((doc, idx) => {
                        const data = doc.data();
                        console.log(`  [${idx}] ID: ${doc.id}, videoTitle: "${data.videoTitle}", category: "${data.category}", sessionType: "${data.sessionType}", watchedTime: ${data.watchedTime}, duration: ${data.duration}`);
                    });
                } else {
                    // Try to find any records with similar email (case-insensitive)
                    console.log(`[calculateAccumulatedWatchTime] No records found for ${email}, checking all records...`);
                    const allRecords = await watchTimeRef.limit(100).get();
                    console.log(`[calculateAccumulatedWatchTime] Total records in collection: ${allRecords.docs.length}`);
                    if (allRecords.docs.length > 0) {
                        console.log(`[calculateAccumulatedWatchTime] Sample records (first 5):`);
                        allRecords.docs.slice(0, 5).forEach((doc, idx) => {
                            const data = doc.data();
                            console.log(`  [${idx}] email: "${data.email}", videoTitle: "${data.videoTitle}", category: "${data.category}"`);
                        });
                    }
                }

                const recordsByKey = new Map<string, Array<{
                    watchedTime: number;
                    duration: number;
                    category?: string;
                    videoUrl?: string;
                    lastUpdated?: Date;
                }>>();

                console.log(`[calculateAccumulatedWatchTime] Processing ${userWatchTimeQuery.docs.length} records for ${email}`);
                
                userWatchTimeQuery.docs.forEach(doc => {
                    const data = doc.data();
                    const videoTitle = data.videoTitle || '';
                    const watchedTime = data.watchedTime || 0;
                    const duration = data.duration || 0;
                    const videoUrl = data.videoUrl || '';
                    const watchCategory = data.category || '';
                    const sessionType = data.sessionType || 'final';

                    console.log(`[calculateAccumulatedWatchTime] Record:`, {
                        videoTitle,
                        watchedTime,
                        duration,
                        videoUrl,
                        category: watchCategory,
                        sessionType
                    });

                    if (duration > 0 && sessionType === 'final') {
                        const keys: string[] = [];

                        if (videoTitle) {
                            // 원본 videoTitle 추가
                            keys.push(videoTitle);
                            // 소문자 버전도 추가 (매칭을 위해)
                            const videoTitleLower = videoTitle.toLowerCase().trim();
                            if (videoTitleLower !== videoTitle) {
                                keys.push(videoTitleLower);
                            }
                            if (watchCategory) {
                                keys.push(`${watchCategory}::${videoTitle}`);
                                keys.push(`${watchCategory}::${videoTitleLower}`);
                            }
                        }
                        if (videoUrl) {
                            keys.push(videoUrl);

                            try {
                                const urlParts = videoUrl.split('/');
                                const fileNameWithParams = urlParts[urlParts.length - 1] || '';
                                // URL 파라미터 제거 (예: Complication_Sedation.mp4?GoogleAccessId=...)
                                const fileName = fileNameWithParams.split('?')[0];
                                
                                // 확장자 제거
                                const fileNameWithoutExt = fileName.replace(/\.(mp4|avi|mov|wmv|flv|webm)$/i, '');
                                
                                // 파일명 자체를 키로 추가 (Complication_Sedation 등)
                                if (fileNameWithoutExt) {
                                    keys.push(fileNameWithoutExt);
                                    keys.push(fileNameWithoutExt.toLowerCase().trim());
                                    if (watchCategory) {
                                        keys.push(`${watchCategory}::${fileNameWithoutExt}`);
                                        keys.push(`${watchCategory}::${fileNameWithoutExt.toLowerCase().trim()}`);
                                    }
                                }
                                
                                // 코드 형식인 경우 (A1, B1 등)
                                const codeFromUrl = fileNameWithoutExt;
                                if (codeFromUrl && /^[A-Z]\d+$/i.test(codeFromUrl)) {
                                    keys.push(codeFromUrl);
                                    if (watchCategory) {
                                        keys.push(`${watchCategory}::${codeFromUrl}`);
                                    }
                                }
                            } catch (e) {
                                console.error('[calculateAccumulatedWatchTime] Error parsing videoUrl:', e);
                            }
                        }
                        
                        console.log(`[calculateAccumulatedWatchTime] Generated keys for record (videoTitle: "${videoTitle}", category: "${watchCategory}"):`, keys);

                        const lastUpdatedRaw = data.lastUpdated;
                        const lastUpdated = lastUpdatedRaw?.toDate?.() ?? (lastUpdatedRaw instanceof Date ? lastUpdatedRaw : undefined);

                        keys.forEach(key => {
                            if (!recordsByKey.has(key)) {
                                recordsByKey.set(key, []);
                            }
                            recordsByKey.get(key)!.push({
                                watchedTime,
                                duration,
                                category: watchCategory,
                                videoUrl,
                                lastUpdated
                            });
                        });
                    }
                });

                recordsByKey.forEach((records, key) => {
                    if (records.length > 0) {
                        const duration = records[0].duration;
                        let totalPercentage = 0;
                        let maxLastUpdated: Date | undefined;

                        records.forEach(record => {
                            if (record.duration > 0) {
                                const sessionPercentage = (record.watchedTime / record.duration) * 100;
                                totalPercentage += sessionPercentage;
                            }
                            if (record.lastUpdated && (!maxLastUpdated || record.lastUpdated > maxLastUpdated)) {
                                maxLastUpdated = record.lastUpdated;
                            }
                        });

                        // Cap total percentage at 100%
                        totalPercentage = Math.min(totalPercentage, 100);

                        console.log(`[calculateAccumulatedWatchTime] Key: "${key}", Records: ${records.length}, Total %: ${totalPercentage}%`);

                        userWatchTimes.set(key, {
                            totalPercentage,
                            duration,
                            category: records[0].category,
                            videoUrl: records[0].videoUrl,
                            lastUpdated: maxLastUpdated
                        });
                    }
                });
                
                console.log(`[calculateAccumulatedWatchTime] Final keys for ${email}:`, Array.from(userWatchTimes.keys()));

                watchTimeMap.set(email, userWatchTimes);
            } catch (userError: any) {
                console.error(`[calculateAccumulatedWatchTime] Error fetching watch times for user ${email}:`, userError);
                watchTimeMap.set(email, new Map());
            }
        }
    } catch (batchError: any) {
        console.error('[calculateAccumulatedWatchTime] Error batch fetching watch times:', batchError);
    }

    return watchTimeMap;
}

