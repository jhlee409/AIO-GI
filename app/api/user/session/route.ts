/**
 * API Route: User Session Management
 * Tracks user sessions for activity and logout cleanup
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        let body: { email?: string; action?: string; sessionId?: string; hostname?: string };
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: '요청 본문이 올바른 JSON이 아닙니다.' },
                { status: 400 }
            );
        }
        const { email, action, sessionId, hostname } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const sessionsRef = adminDb.collection('user_sessions');

        // Get client IP and User-Agent
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const sessionHostname = hostname || 'Unknown';

        if (action === 'create') {
            // Create new session
            const newSessionId = uuidv4();
            const now = new Date();
            const loginTime = now;

            await sessionsRef.add({
                email,
                sessionId: newSessionId,
                loginTime: loginTime,
                lastActivity: loginTime,
                ipAddress,
                userAgent,
                hostname: sessionHostname,
                isActive: true
            });

            return NextResponse.json({
                success: true,
                sessionId: newSessionId
            });
        } else if (action === 'update') {
            if (!sessionId) {
                return NextResponse.json(
                    { error: 'Session ID is required' },
                    { status: 400 }
                );
            }

            // Update last activity
            const sessionDoc = await sessionsRef
                .where('sessionId', '==', sessionId)
                .where('email', '==', email)
                .limit(1)
                .get();

            if (!sessionDoc.empty) {
                await sessionDoc.docs[0].ref.update({
                    lastActivity: new Date()
                });
            }

            return NextResponse.json({ success: true });
        } else if (action === 'delete') {
            if (sessionId) {
                const sessionDoc = await sessionsRef
                    .where('sessionId', '==', sessionId)
                    .where('email', '==', email)
                    .limit(1)
                    .get();

                if (!sessionDoc.empty) {
                    await sessionDoc.docs[0].ref.update({
                        isActive: false,
                        logoutTime: new Date()
                    });
                }
            } else {
                // Delete all sessions for this user
                const userSessions = await sessionsRef
                    .where('email', '==', email)
                    .where('isActive', '==', true)
                    .get();

                const batch = adminDb.batch();
                userSessions.forEach(doc => {
                    batch.update(doc.ref, {
                        isActive: false,
                        logoutTime: new Date()
                    });
                });
                await batch.commit();
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Session management error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to manage session' },
            { status: 500 }
        );
    }
}

