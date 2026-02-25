/**
 * API Route: User Session Management
 * Tracks user sessions and detects concurrent logins
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

interface SessionData {
    email: string;
    sessionId: string;
    loginTime: Date;
    lastActivity: Date;
    ipAddress: string;
    userAgent: string;
    hostname?: string;
    isActive: boolean;
}

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
            // Check for existing active sessions
            const existingSessions = await sessionsRef
                .where('email', '==', email)
                .where('isActive', '==', true)
                .get();

            const activeSessions: SessionData[] = [];
            const now = new Date();

            existingSessions.forEach(doc => {
                const data = doc.data();
                // Check if session is still active (within last 30 minutes)
                const lastActivity = data.lastActivity?.toDate ? data.lastActivity.toDate() : new Date(data.lastActivity);
                const timeDiff = now.getTime() - lastActivity.getTime();

                if (timeDiff < 30 * 60 * 1000) { // 30 minutes
                    activeSessions.push({
                        email: data.email,
                        sessionId: data.sessionId,
                        loginTime: data.loginTime?.toDate ? data.loginTime.toDate() : new Date(data.loginTime),
                        lastActivity: lastActivity,
                        ipAddress: data.ipAddress,
                        userAgent: data.userAgent,
                        hostname: data.hostname || 'Unknown',
                        isActive: true
                    });
                } else {
                    // Mark old session as inactive
                    doc.ref.update({ isActive: false });
                }
            });

            // Create new session
            const newSessionId = uuidv4();
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

            // If there are active sessions, notify admin
            if (activeSessions.length > 0) {
                // Trigger email notification (fire and forget)
                fetch(`${request.nextUrl.origin}/api/admin/notify-concurrent-login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        newSession: {
                            sessionId: newSessionId,
                            loginTime: loginTime.toISOString(),
                            ipAddress,
                            userAgent,
                            hostname: sessionHostname
                        },
                        existingSessions: activeSessions.map(s => ({
                            ...s,
                            loginTime: s.loginTime.toISOString(),
                            lastActivity: s.lastActivity.toISOString()
                        }))
                    })
                }).catch(err => {
                    console.error('Failed to send concurrent login notification:', err);
                });
            }

            return NextResponse.json({
                success: true,
                sessionId: newSessionId,
                hasConcurrentSessions: activeSessions.length > 0
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

