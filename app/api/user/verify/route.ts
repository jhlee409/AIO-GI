/**
 * API Route: Verify User Credentials
 * Verifies user email and password against users collection
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        let email: string | undefined;
        let password: string | undefined;
        try {
            const body = await request.json();
            email = body?.email;
            password = body?.password;
        } catch {
            return NextResponse.json(
                { error: '요청 본문이 올바른 JSON이 아닙니다.' },
                { status: 400 }
            );
        }

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Search for user in users collection by email (fallback to patients for backward compatibility)
        const adminDb = getAdminDb();
        let userData: any = null;

        // Try users collection first
        const usersRef = adminDb.collection('users');
        let snapshot = await usersRef
            .where('이메일', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) {
            // Try alternative email field names in users collection
            snapshot = await usersRef
                .where('email', '==', email)
                .limit(1)
                .get();
        }

        if (snapshot.empty) {
            // Fallback to patients collection for backward compatibility
            const patientsRef = adminDb.collection('patients');
            snapshot = await patientsRef
                .where('이메일', '==', email)
                .limit(1)
                .get();

            if (snapshot.empty) {
                // Try alternative email field names in patients collection
                snapshot = await patientsRef
                    .where('email', '==', email)
                    .limit(1)
                    .get();
            }
        }

        if (snapshot.empty) {
            return NextResponse.json(
                { error: '등록된 사용자 정보와 일치하지 않습니다. 다시 입력해주세요.' },
                { status: 401 }
            );
        }

        userData = snapshot.docs[0].data();

        // Check password
        const storedPassword = userData['비밀번호'] || userData['password'] || userData['Password'] || userData['PASSWORD'];
        if (!storedPassword || storedPassword !== password) {
            return NextResponse.json(
                { error: '등록된 사용자 정보와 일치하지 않습니다. 다시 입력해주세요.' },
                { status: 401 }
            );
        }

        // Check active status
        const activeStatus = userData['활성상태'] || userData['active'] || userData['Active'] || userData['ACTIVE'];
        if (activeStatus !== 'yes') {
            return NextResponse.json(
                { error: '비활성화된 계정입니다. 관리자에게 문의해주세요.' },
                { status: 403 }
            );
        }

        // Return user information
        return NextResponse.json({
            success: true,
            position: userData['직위'] || userData['position'] || '',
            name: userData['이름'] || userData['name'] || '',
            hospital: userData['병원'] || userData['병원명'] || userData['hospital'] || '',
            email: email,
            isInstructor: userData['교육자'] === 'yes' || userData['instructor'] === 'yes',
            isAdmin: userData['관리자'] === 'yes' || userData['admin'] === 'yes',
        });
    } catch (error: any) {
        console.error('Error verifying user credentials:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify user credentials' },
            { status: 500 }
        );
    }
}

