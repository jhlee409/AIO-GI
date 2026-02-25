/**
 * API Route: Users Management
 * CRUD operations for user data in Firestore
 * CRITICAL: Only accessible from server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const USERS_COLLECTION = 'users';

// GET: Fetch all users
export async function GET() {
    try {
        const adminDb = getAdminDb();
        let snapshot = await adminDb.collection(USERS_COLLECTION).get();
        
        // If users collection is empty, try patients collection for backward compatibility
        if (snapshot.empty) {
            snapshot = await adminDb.collection('patients').get();
        }
        
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST: Save users (from Excel upload)
export async function POST(request: NextRequest) {
    try {
        const { users } = await request.json();

        if (!users || !Array.isArray(users)) {
            return NextResponse.json(
                { error: 'Users array is required' },
                { status: 400 }
            );
        }

        // Get existing users to avoid duplicates
        const adminDb = getAdminDb();
        const existingSnapshot = await adminDb.collection(USERS_COLLECTION).get();
        const existingUsers = new Set(
            existingSnapshot.docs.map(doc => JSON.stringify(doc.data()))
        );

        // Batch write for better performance
        const batch = adminDb.batch();
        let addedCount = 0;

        for (const user of users) {
            // Create a unique key based on user data to check for duplicates
            const userKey = JSON.stringify(user);
            
            if (!existingUsers.has(userKey)) {
                const docRef = adminDb.collection(USERS_COLLECTION).doc();
                batch.set(docRef, {
                    ...user,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                existingUsers.add(userKey); // Add to set to avoid duplicates in same batch
                addedCount++;
            }
        }

        if (addedCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({ 
            success: true, 
            added: addedCount,
            total: users.length
        });
    } catch (error: any) {
        console.error('Error saving users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save users' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a user
export async function DELETE(request: NextRequest) {
    try {
        const { userId, requesterEmail } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();

        // Protect jhlee409@gmail.com record
        const userDoc = await adminDb.collection(USERS_COLLECTION).doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const userEmail = String(userData?.['이메일'] || userData?.['email'] || userData?.['Email'] || '').toLowerCase().trim();
            if (userEmail === 'jhlee409@gmail.com' && requesterEmail?.toLowerCase() !== 'jhlee409@gmail.com') {
                return NextResponse.json(
                    { error: 'jhlee409@gmail.com 레코드는 해당 계정으로 로그인한 경우에만 삭제할 수 있습니다.' },
                    { status: 403 }
                );
            }
        }

        await adminDb.collection(USERS_COLLECTION).doc(userId).delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete user' },
            { status: 500 }
        );
    }
}

