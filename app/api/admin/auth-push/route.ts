/**
 * API Route: Push Users to Firebase Authentication
 * Adds users from table to Firebase Authentication
 * CRITICAL: Only accessible from server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

interface UserData {
    email?: string;
    password?: string;
    이메일?: string;
    비밀번호?: string;
    [key: string]: any;
}

export async function POST(request: NextRequest) {
    try {
        const adminAuth = getAdminAuth();
        const { users } = await request.json();

        if (!users || !Array.isArray(users)) {
            return NextResponse.json(
                { error: 'Users array is required' },
                { status: 400 }
            );
        }

        const results = {
            success: 0,
            alreadyExists: 0, // Already registered users
            failed: 0, // Actual errors
            errors: [] as string[],
        };

        // Add new users
        for (const userData of users) {
            try {
                // Find email field (이메일 or email)
                const emailRaw = userData['이메일'] || userData['email'] || userData['Email'] || userData['EMAIL'];
                const email = emailRaw != null ? String(emailRaw).trim() : '';

                // Find password field (비밀번호 or password) - Excel often stores numbers as number type
                const passwordRaw = userData['비밀번호'] || userData['password'] || userData['Password'] || userData['PASSWORD'];
                const password = passwordRaw != null ? String(passwordRaw).trim() : '';

                if (!email || !password) {
                    results.failed++;
                    results.errors.push(`이메일 또는 비밀번호가 없는 사용자: ${JSON.stringify(userData)}`);
                    continue;
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    results.failed++;
                    results.errors.push(`잘못된 이메일 형식: ${email}`);
                    continue;
                }

                // Validate password length (Firebase requires at least 6 characters)
                if (password.length < 6) {
                    results.failed++;
                    results.errors.push(`비밀번호가 너무 짧습니다 (최소 6자, 입력값 길이: ${password.length}자): ${email}`);
                    continue;
                }

                // Create user in Firebase Authentication
                try {
                    await adminAuth.createUser({
                        email: email,
                        password: password,
                        emailVerified: false,
                    });
                    results.success++;
                } catch (error: any) {
                    // If user already exists, count separately (not as failure)
                    if (error.code === 'auth/email-already-exists') {
                        results.alreadyExists++;
                    } else {
                        throw error;
                    }
                }
            } catch (error: any) {
                results.failed++;
                const email = userData['이메일'] || userData['email'] || userData['Email'] || userData['EMAIL'] || '알 수 없음';
                results.errors.push(`${email}: ${error.message || '알 수 없는 오류'}`);
            }
        }

        return NextResponse.json({
            success: true,
            results: {
                success: results.success,
                alreadyExists: results.alreadyExists,
                failed: results.failed,
                errors: results.errors.slice(0, 10), // Limit errors to first 10
            },
        });
    } catch (error: any) {
        console.error('Error pushing users to Firebase Auth:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to push users to Firebase Authentication' },
            { status: 500 }
        );
    }
}

