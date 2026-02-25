/**
 * API Route: Delete User
 * Uses Firebase Admin SDK to delete a user from Authentication
 * CRITICAL: Only accessible from server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { isSuperAdminEmail, isPrimaryAdminEmail } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
    try {
        const { uid, requesterEmail } = await request.json();

        if (!uid) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const adminAuth = getAdminAuth();
        
        // Get user info to check email
        const user = await adminAuth.getUser(uid);
        
        // Super admin (jhlee409@gmail.com) can never be deleted
        if (user.email && isSuperAdminEmail(user.email)) {
            return NextResponse.json(
                { error: 'Super admin cannot be deleted. This account must always remain in Firebase Authentication.' },
                { status: 403 }
            );
        }

        // Other primary admins can only be deleted by super admin
        if (user.email && isPrimaryAdminEmail(user.email) && !isSuperAdminEmail(requesterEmail)) {
            return NextResponse.json(
                { error: 'Primary admin can only be deleted by super admin (jhlee409@gmail.com).' },
                { status: 403 }
            );
        }

        // Delete user from Firebase Authentication
        await adminAuth.deleteUser(uid);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        
        // Check if error is already our custom error
        if (error.status === 403) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }
        
        return NextResponse.json(
            { error: error.message || 'Failed to delete user' },
            { status: 500 }
        );
    }
}
