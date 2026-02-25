/**
 * API Route: Get Instructor Login History
 * Returns login history for all instructors for the past month
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isPrimaryAdminEmail } from '@/lib/auth-server';

interface LoginHistory {
    email: string;
    name: string;
    hospital: string;
    loginTime: Date;
    lastActivity?: Date;
    logoutTime?: Date;
    ipAddress: string;
    userAgent: string;
    hostname?: string;
    sessionId: string;
    isActive: boolean;
}

export async function GET(request: NextRequest) {
    try {
        const adminDb = getAdminDb();
        
        // Get all instructors from users collection (fall back to patients if users is empty)
        let snapshot = await adminDb.collection('users').get();
        if (snapshot.empty) {
            snapshot = await adminDb.collection('patients').get();
        }

        const instructors: Array<{ email: string; name: string; hospital: string }> = [];
        const seenEmails = new Set<string>();

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            const isInstructor = userData['교육자'] === 'yes' || userData['instructor'] === 'yes';
            
            if (isInstructor) {
                const email = (userData['이메일'] || userData['email'] || userData['Email'] || userData['EMAIL'] || '').trim().toLowerCase();
                const name = userData['이름'] || userData['성명'] || userData['name'] || '';
                const hospital = userData['병원'] || userData['병원명'] || userData['hospital'] || '';
                
                if (email && isPrimaryAdminEmail(email)) {
                    continue;
                }
                
                if (email && !seenEmails.has(email) && name) {
                    instructors.push({ email, name, hospital });
                    seenEmails.add(email);
                }
            }
        }

        // Get login history for the past month
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const sessionsRef = adminDb.collection('user_sessions');
        const sessionsSnapshot = await sessionsRef
            .where('loginTime', '>=', oneMonthAgo)
            .orderBy('loginTime', 'desc')
            .get();

        // Create a map of instructor email to their info
        const instructorMap = new Map<string, { name: string; hospital: string }>();
        instructors.forEach(inst => {
            instructorMap.set(inst.email.toLowerCase(), { name: inst.name, hospital: inst.hospital });
        });

        // Filter sessions to only include instructors and format the data
        const loginHistory: LoginHistory[] = [];
        const now = new Date();
        const INACTIVE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
        
        for (const doc of sessionsSnapshot.docs) {
            const sessionData = doc.data();
            const email = (sessionData.email || '').toLowerCase();
            
            // Skip primary admin
            if (isPrimaryAdminEmail(email)) {
                continue;
            }
            
            if (instructorMap.has(email)) {
                const instructorInfo = instructorMap.get(email)!;
                const loginTime = sessionData.loginTime?.toDate ? sessionData.loginTime.toDate() : new Date(sessionData.loginTime);
                const lastActivity = sessionData.lastActivity?.toDate ? sessionData.lastActivity.toDate() : undefined;
                const logoutTime = sessionData.logoutTime?.toDate ? sessionData.logoutTime.toDate() : undefined;

                // Recalculate isActive based on lastActivity (not the stored isActive field)
                // Session is active if:
                // 1. No logoutTime exists
                // 2. lastActivity exists and is within 30 minutes
                // 3. Stored isActive is true (as a fallback check)
                let calculatedIsActive = false;
                if (!logoutTime && lastActivity) {
                    const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
                    calculatedIsActive = timeSinceLastActivity < INACTIVE_THRESHOLD_MS;
                } else if (!logoutTime && sessionData.isActive) {
                    // If no lastActivity but isActive is true, keep it as is (edge case)
                    calculatedIsActive = sessionData.isActive;
                }

                loginHistory.push({
                    email: sessionData.email,
                    name: instructorInfo.name,
                    hospital: instructorInfo.hospital,
                    loginTime,
                    lastActivity,
                    logoutTime,
                    ipAddress: sessionData.ipAddress || 'unknown',
                    userAgent: sessionData.userAgent || 'unknown',
                    hostname: sessionData.hostname || 'Unknown',
                    sessionId: sessionData.sessionId || '',
                    isActive: calculatedIsActive
                });
            }
        }

        // Group by instructor email - include all instructors, even those without login history
        const historyByInstructor = new Map<string, {
            instructor: { email: string; name: string; hospital: string };
            sessions: LoginHistory[];
        }>();

        // First, initialize all instructors with empty sessions
        for (const instructor of instructors) {
            historyByInstructor.set(instructor.email.toLowerCase(), {
                instructor: {
                    email: instructor.email,
                    name: instructor.name,
                    hospital: instructor.hospital
                },
                sessions: []
            });
        }

        // Then, add login history for instructors who have sessions
        for (const history of loginHistory) {
            const email = history.email.toLowerCase();
            if (historyByInstructor.has(email)) {
                historyByInstructor.get(email)!.sessions.push(history);
            }
        }

        // Convert to array and sort by name
        const result = Array.from(historyByInstructor.values()).sort((a, b) => 
            a.instructor.name.localeCompare(b.instructor.name, 'ko')
        );

        return NextResponse.json({
            instructors: result.map(item => item.instructor),
            history: result
        });
    } catch (error: any) {
        console.error('Error fetching instructor login history:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch instructor login history' },
            { status: 500 }
        );
    }
}

