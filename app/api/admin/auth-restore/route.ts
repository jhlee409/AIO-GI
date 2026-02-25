/**
 * API Route: Restore Deleted Users to Firebase Authentication
 * Restores users from Realtime Database deletion records
 * CRITICAL: Only accessible from server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminRealtimeDb, getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const adminAuth = getAdminAuth();
        const realtimeDb = getAdminRealtimeDb();
        const body = await request.json();
        const { recordKey } = body;

        if (!recordKey) {
            return NextResponse.json(
                { error: 'Record key is required' },
                { status: 400 }
            );
        }

        // Get deletion record from Realtime Database
        const recordRef = realtimeDb.ref(`auth_deletions/${recordKey}`);
        const snapshot = await recordRef.once('value');
        const record = snapshot.val();

        if (!record) {
            return NextResponse.json(
                { error: 'Deletion record not found' },
                { status: 404 }
            );
        }

        const results = {
            restored: 0,
            failed: 0,
            errors: [] as string[],
        };

        // Restore users
        if (record.deletedUsers && Array.isArray(record.deletedUsers)) {
            const adminDb = getAdminDb();
            
            for (const userData of record.deletedUsers) {
                try {
                    // Check if user already exists
                    try {
                        await adminAuth.getUserByEmail(userData.email);
                        // User already exists, skip
                        continue;
                    } catch (error: any) {
                        // User doesn't exist, create it
                        if (error.code === 'auth/user-not-found') {
                            // Try to get password from users collection (fallback to patients for backward compatibility)
                            let password: string | undefined;
                            try {
                                let usersSnapshot = await adminDb.collection('users')
                                    .where('이메일', '==', userData.email)
                                    .limit(1)
                                    .get();
                                
                                if (usersSnapshot.empty) {
                                    // Try alternative email field names in users collection
                                    usersSnapshot = await adminDb.collection('users')
                                        .where('email', '==', userData.email)
                                        .limit(1)
                                        .get();
                                }
                                
                                if (usersSnapshot.empty) {
                                    // Fallback to patients collection
                                    usersSnapshot = await adminDb.collection('patients')
                                        .where('이메일', '==', userData.email)
                                        .limit(1)
                                        .get();
                                    
                                    if (usersSnapshot.empty) {
                                        usersSnapshot = await adminDb.collection('patients')
                                            .where('email', '==', userData.email)
                                            .limit(1)
                                            .get();
                                    }
                                }
                                
                                if (!usersSnapshot.empty) {
                                    const userDataFromDb = usersSnapshot.docs[0].data();
                                    password = userDataFromDb['비밀번호'] || userDataFromDb['password'] || userDataFromDb['Password'] || userDataFromDb['PASSWORD'];
                                }
                            } catch (dbError) {
                                console.warn(`Could not fetch password for ${userData.email}:`, dbError);
                            }

                            // If no password found, generate a temporary one
                            if (!password) {
                                // Generate a temporary password (user will need to reset)
                                password = `Temp${Math.random().toString(36).slice(-8)}!`;
                            }

                            // Create user with email and password
                            await adminAuth.createUser({
                                email: userData.email,
                                displayName: userData.displayName,
                                password: password,
                                emailVerified: false,
                            });
                            results.restored++;
                        } else {
                            throw error;
                        }
                    }
                } catch (err: any) {
                    console.error(`Failed to restore user ${userData.email}:`, err);
                    results.failed++;
                    results.errors.push(`${userData.email}: ${err.message || '알 수 없는 오류'}`);
                }
            }
        }

        // Mark record as restored
        await recordRef.update({
            restored: true,
            restoredAt: new Date().toISOString(),
            restoredCount: results.restored,
        });

        return NextResponse.json({
            success: true,
            results: {
                restored: results.restored,
                failed: results.failed,
                errors: results.errors.slice(0, 10),
            },
        });
    } catch (error: any) {
        console.error('Error in auth restore route:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to restore users from Firebase Authentication' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const realtimeDb = getAdminRealtimeDb();
        const recordsRef = realtimeDb.ref('auth_deletions');
        const snapshot = await recordsRef.orderByChild('timestamp').limitToLast(50).once('value');
        const records = snapshot.val();

        const recordsList = records ? Object.keys(records).map(key => ({
            key,
            ...records[key],
        })).reverse() : [];

        return NextResponse.json({
            success: true,
            records: recordsList,
        });
    } catch (error: any) {
        console.error('Error fetching deletion records:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch deletion records' },
            { status: 500 }
        );
    }
}

