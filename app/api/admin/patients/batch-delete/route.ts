/**
 * API Route: Batch Delete Users
 * Delete multiple users at once
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const USERS_COLLECTION = 'users';

export async function POST(request: NextRequest) {
    try {
        const { userIds, requesterEmail } = await request.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { error: 'User IDs array is required' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();

        // Protect jhlee409@gmail.com record
        const isRequesterProtected = requesterEmail?.toLowerCase() === 'jhlee409@gmail.com';
        const filteredIds: string[] = [];

        for (const userId of userIds) {
            const docRef = adminDb.collection(USERS_COLLECTION).doc(userId);
            const doc = await docRef.get();
            if (doc.exists) {
                const data = doc.data();
                const email = String(data?.['이메일'] || data?.['email'] || data?.['Email'] || '').toLowerCase().trim();
                if (email === 'jhlee409@gmail.com' && !isRequesterProtected) {
                    continue;
                }
            }
            filteredIds.push(userId);
        }

        // Batch delete for better performance
        const batch = adminDb.batch();
        
        for (const userId of filteredIds) {
            const docRef = adminDb.collection(USERS_COLLECTION).doc(userId);
            batch.delete(docRef);
        }

        await batch.commit();

        return NextResponse.json({ 
            success: true, 
            deleted: filteredIds.length
        });
    } catch (error: any) {
        console.error('Error batch deleting users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete users' },
            { status: 500 }
        );
    }
}

