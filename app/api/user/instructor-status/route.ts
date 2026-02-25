/**
 * API Route: Check Instructor Status
 * Checks if the current user is an instructor based on email
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        // Firebase Admin SDK 초기화 (lazy initialization)
        const adminDb = getAdminDb();

        const email = request.nextUrl.searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Search for user in users collection by email (fallback to patients for backward compatibility)
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
            return NextResponse.json({ isInstructor: false });
        }

        userData = snapshot.docs[0].data();
        const isInstructor = userData['교육자'] === 'yes' || userData['instructor'] === 'yes';
        return NextResponse.json({ isInstructor });
    } catch (error: any) {
        console.error('Error checking instructor status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check instructor status' },
            { status: 500 }
        );
    }
}

