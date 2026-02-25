/**
 * API Route: Delete Users from Firebase Authentication (except admins)
 * Deletes filtered users from Firebase Authentication except admin users
 * Saves deletion record to Realtime Database for recovery
 * CRITICAL: Only accessible from server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminRealtimeDb } from '@/lib/firebase-admin';

import { isSuperAdminEmail, isPrimaryAdminEmail } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
    try {
        const adminAuth = getAdminAuth();
        const body = await request.json();
        const { hospitals, positions, name, userEmails, requesterEmail } = body;
        const isRequesterSuperAdmin = isSuperAdminEmail(requesterEmail);

        const results = {
            deleted: 0,
            failed: 0,
            skipped: 0, // Admin users skipped
            errors: [] as string[],
            deletedUsers: [] as Array<{ uid: string; email: string | undefined; displayName?: string }>,
        };

        // List all Firebase Authentication users and delete all except protected admins
        const usersToDelete: Array<{ uid: string; email: string | undefined; displayName?: string }> = [];
        let nextPageToken: string | undefined;
        do {
            const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
            for (const user of listUsersResult.users) {
                if (user.email && isSuperAdminEmail(user.email)) {
                    results.skipped++;
                    continue;
                }
                if (user.email && isPrimaryAdminEmail(user.email) && !isRequesterSuperAdmin) {
                    results.skipped++;
                    continue;
                }
                usersToDelete.push({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                });
            }
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        // Delete users
        for (const user of usersToDelete) {
            try {
                // Double-check: super admin can never be deleted
                if (user.email && isSuperAdminEmail(user.email)) {
                    results.skipped++;
                    results.errors.push(`${user.email}: Super admin cannot be deleted`);
                    continue;
                }

                await adminAuth.deleteUser(user.uid);
                results.deleted++;
                results.deletedUsers.push(user);
            } catch (err: any) {
                console.error(`Failed to delete user ${user.email || user.uid}:`, err);
                results.failed++;
                results.errors.push(`${user.email || user.uid}: ${err.message || '알 수 없는 오류'}`);
            }
        }

        // Save deletion record to Realtime Database
        if (results.deleted > 0) {
            try {
                const realtimeDb = getAdminRealtimeDb();
                const deletionRecord = {
                    timestamp: new Date().toISOString(),
                    date: new Date().toLocaleDateString('ko-KR'),
                    filters: {
                        hospitals: hospitals || [],
                        positions: positions || [],
                        name: name || '',
                    },
                    deletedCount: results.deleted,
                    deletedUsers: results.deletedUsers,
                    skippedCount: results.skipped,
                    failedCount: results.failed,
                };

                const recordRef = realtimeDb.ref('auth_deletions').push();
                await recordRef.set(deletionRecord);
                console.log(`Deletion record saved with key: ${recordRef.key}`);
            } catch (dbError: any) {
                console.error('Error saving deletion record to Realtime Database:', dbError);
                // Continue even if database save fails
            }
        }

        return NextResponse.json({
            success: true,
            results: {
                deleted: results.deleted,
                failed: results.failed,
                skipped: results.skipped,
                errors: results.errors.slice(0, 10), // Limit errors to first 10
            },
        });
    } catch (error: any) {
        console.error('Error in auth deletion route:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete users from Firebase Authentication' },
            { status: 500 }
        );
    }
}

