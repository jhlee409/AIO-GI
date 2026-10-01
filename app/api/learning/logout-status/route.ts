import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import type { LearningAttempt } from '@/lib/learning-session';
import { evaluateVideoAttempt } from '@/lib/learning-review-status';

type ReviewState = 'complete' | 'incomplete' | 'failed' | 'unknown';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        const identity = await getAdminAuth().verifyIdToken(token);
        const email = identity.email?.toLowerCase();
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 401 });

        const { attempts } = await request.json() as { attempts?: LearningAttempt[] };
        if (!Array.isArray(attempts) || attempts.length > 500) {
            return NextResponse.json({ error: 'Invalid learning attempts' }, { status: 400 });
        }
        const ownAttempts = attempts.filter(item =>
            item && typeof item.key === 'string' && typeof item.label === 'string' &&
            item.email?.toLowerCase() === email && (item.kind === 'log' || item.kind === 'video')
        );
        const videoRecords = ownAttempts.some(item => item.kind === 'video')
            ? await getAdminDb().collection('video_watch_times').where('email', '==', identity.email).get()
            : null;
        const bucket = ownAttempts.some(item => item.kind === 'log') ? getAdminStorage().bucket() : null;

        const results = await Promise.all(ownAttempts.map(async item => {
            let state: ReviewState = 'unknown';
            try {
                if (item.kind === 'video') {
                    state = evaluateVideoAttempt(item, videoRecords?.docs.map(doc => doc.data()) || []);
                } else if (/^(log\/|log_EGD_Lesion_Dx\/)[^/]+$/.test(item.key) && bucket) {
                    const [exists] = await bucket.file(item.key).exists();
                    if (exists) {
                        const [content] = await bucket.file(item.key).download();
                        const storedEmail = /^Email:\s*(.+)$/im.exec(content.toString('utf8'))?.[1]?.trim().toLowerCase();
                        state = storedEmail === email ? 'complete' : 'failed';
                    } else {
                        state = item.completedLocally ? 'failed' : 'incomplete';
                    }
                }
            } catch (error) {
                console.error('Could not verify learning record', item.kind, item.key, error);
            }
            return { kind: item.kind, key: item.key, label: item.label, state };
        }));
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Learning logout review failed', error);
        return NextResponse.json({ error: 'Could not review learning records' }, { status: 500 });
    }
}
