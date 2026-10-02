/**
 * Hook for calculating accumulated watch time
 * Fetches and aggregates video watch times from Firestore for report generation
 */
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
        return watchTimeMap;
    }

    try {
        const watchTimeRef = adminDb.collection('video_watch_times');

        // Keep Firestore load bounded while fetching independent users in parallel.
        for (let offset = 0; offset < userEmails.length; offset += 8) {
            const batch = userEmails.slice(offset, offset + 8);
            const results = await Promise.all(batch.map(async ({ email }) => {
                const userWatchTimes = new Map<string, AccumulatedWatchTime>();
                try {
                    const userWatchTimeQuery = await watchTimeRef
                        .where('email', '==', email)
                        .get();

                    const recordsByKey = new Map<string, Array<{
                        watchedTime: number;
                        duration: number;
                        category?: string;
                        videoUrl?: string;
                        lastUpdated?: Date;
                    }>>();

                    userWatchTimeQuery.docs.forEach(doc => {
                        const data = doc.data();
                        const videoTitle = data.videoTitle || '';
                        const watchedTime = data.watchedTime || 0;
                        const duration = data.duration || 0;
                        const videoUrl = data.videoUrl || '';
                        const watchCategory = data.category || '';
                        const sessionType = data.sessionType || 'final';

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
                            // MAX 방식: 여러 'final' 레코드 중 가장 높은 시청 %를 사용.
                            // Why: 같은 동영상을 반복 재생할 때 SUM 방식은 같은 구간을 중복 카운트해
                            //      실제로 보지 않은 분량까지 누적되는 문제가 있었음.
                            let maxPercentage = 0;
                            let maxLastUpdated: Date | undefined;

                            records.forEach(record => {
                                if (record.duration > 0) {
                                    const sessionPercentage = (record.watchedTime / record.duration) * 100;
                                    if (sessionPercentage > maxPercentage) {
                                        maxPercentage = sessionPercentage;
                                    }
                                }
                                if (record.lastUpdated && (!maxLastUpdated || record.lastUpdated > maxLastUpdated)) {
                                    maxLastUpdated = record.lastUpdated;
                                }
                            });

                            const totalPercentage = Math.min(maxPercentage, 100);

                            userWatchTimes.set(key, {
                                totalPercentage,
                                duration,
                                category: records[0].category,
                                videoUrl: records[0].videoUrl,
                                lastUpdated: maxLastUpdated
                            });
                        }
                    });
                
                    return { email, userWatchTimes };
                } catch (userError: any) {
                    console.error(`[calculateAccumulatedWatchTime] Error fetching watch times for user ${email}:`, userError);
                    return { email, userWatchTimes: new Map<string, AccumulatedWatchTime>() };
                }
            }));
            // Preserve the original user order for callers that iterate the Map.
            results.forEach(({ email, userWatchTimes }) => watchTimeMap.set(email, userWatchTimes));
        }
    } catch (batchError: any) {
        console.error('[calculateAccumulatedWatchTime] Error batch fetching watch times:', batchError);
    }

    return watchTimeMap;
}

