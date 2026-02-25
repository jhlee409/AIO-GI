/**
 * API Route: Notify Admin of Concurrent Login
 * Saves concurrent login record to Firestore and optionally sends email
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jhlee409@gmail.com';
const AUTO_LOGOUT_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds (자동 로그아웃 시간)

// Gmail SMTP 설정 (선택사항)
let transporter: nodemailer.Transporter | null = null;

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });
}

export async function POST(request: NextRequest) {
    try {
        const { email, newSession, existingSessions } = await request.json();

        if (!email || !newSession || !existingSessions) {
            return NextResponse.json(
                { error: 'Missing required data' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        
        // Get user information from users collection
        const usersRef = adminDb.collection('users');
        let userSnapshot = await usersRef
            .where('이메일', '==', email)
            .limit(1)
            .get();

        if (userSnapshot.empty) {
            userSnapshot = await usersRef
                .where('email', '==', email)
                .limit(1)
                .get();
        }

        let userName = email;
        let userHospital = '';
        
        if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            userName = userData['이름'] || userData['name'] || email;
            userHospital = userData['병원'] || userData['병원명'] || userData['hospital'] || '';
        }

        // Calculate overlap time (time between first login and new login)
        const firstLoginTime = new Date(Math.min(
            ...existingSessions.map((s: any) => new Date(s.loginTime).getTime()),
            new Date(newSession.loginTime).getTime()
        ));
        const newLoginTime = new Date(newSession.loginTime);
        const overlapDuration = newLoginTime.getTime() - firstLoginTime.getTime();

        // 겹친 시간이 자동 로그아웃 시간을 초과하지 않으면 보고하지 않음
        // (한 데스크탑을 켜놓고 다른 데스크탑에서 작업하는 경우를 고려)
        if (overlapDuration <= AUTO_LOGOUT_TIMEOUT) {
            return NextResponse.json({
                success: true,
                message: 'Overlap duration does not exceed auto logout timeout. Report not created.',
                overlapDuration: overlapDuration,
                autoLogoutTimeout: AUTO_LOGOUT_TIMEOUT
            });
        }

        // Extract hostname from session data
        const getHostname = (session: any): string => {
            return session.hostname || 'Unknown';
        };

        // Save concurrent login record to Firestore
        const concurrentLoginsRef = adminDb.collection('concurrent_logins');
        const recordData = {
            email,
            name: userName,
            hospital: userHospital,
            detectedAt: new Date(),
            newSession: {
                sessionId: newSession.sessionId,
                loginTime: newLoginTime,
                ipAddress: newSession.ipAddress,
                userAgent: newSession.userAgent,
                hostname: getHostname(newSession)
            },
            existingSessions: existingSessions.map((session: any) => ({
                sessionId: session.sessionId,
                loginTime: new Date(session.loginTime),
                lastActivity: new Date(session.lastActivity),
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                hostname: getHostname(session)
            })),
            overlapDuration: overlapDuration, // milliseconds
            totalConcurrentSessions: existingSessions.length + 1
        };

        await concurrentLoginsRef.add(recordData);

        // Optional: Send email if configured
        if (transporter) {
            try {
                // Format existing sessions info for email
                const existingSessionsInfo = existingSessions.map((session: any, index: number) => {
                    const loginTime = new Date(session.loginTime);
                    const lastActivity = new Date(session.lastActivity);
                    return `
${index + 1}. 기존 세션:
   - 세션 ID: ${session.sessionId}
   - 로그인 시간: ${loginTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
   - 마지막 활동: ${lastActivity.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
   - IP 주소: ${session.ipAddress}
   - 호스트명: ${getHostname(session)}
   - User-Agent: ${session.userAgent.substring(0, 100)}...`;
                }).join('\n');

                const emailSubject = `[동시 접속 알림] ${userName}(${email}) 사용자의 동시 접속이 감지되었습니다`;
                const emailBody = `
동시 접속이 감지되었습니다.

사용자 정보:
- 이름: ${userName}
- 병원: ${userHospital || '정보 없음'}
- 이메일: ${email}
- 감지 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

새로운 접속 정보:
- 세션 ID: ${newSession.sessionId}
- 로그인 시간: ${newLoginTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
- IP 주소: ${newSession.ipAddress}
- 호스트명: ${getHostname(newSession)}
- User-Agent: ${newSession.userAgent.substring(0, 100)}...

기존 활성 세션 (${existingSessions.length}개):
${existingSessionsInfo}

주의: 동일한 계정이 여러 기기에서 동시에 사용되고 있습니다.
`;

                await transporter.sendMail({
                    from: process.env.GMAIL_USER,
                    to: ADMIN_EMAIL,
                    subject: emailSubject,
                    text: emailBody,
                    html: emailBody.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')
                });

                console.log(`Concurrent login notification sent to ${ADMIN_EMAIL} for user ${email}`);
            } catch (emailError: any) {
                console.error('Email sending error:', emailError);
                // Continue even if email fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Concurrent login recorded successfully'
        });
    } catch (error: any) {
        console.error('Concurrent login notification error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send notification' },
            { status: 500 }
        );
    }
}

