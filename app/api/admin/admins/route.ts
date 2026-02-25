/**
 * API Route: Manage Admins
 * Add or remove admin users
 * CRITICAL: Only accessible from server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { PRIMARY_ADMIN_EMAILS, isPrimaryAdminEmail } from '@/lib/auth-server';

/**
 * Get all admins
 */
export async function GET(request: NextRequest) {
    try {
        const adminDb = getAdminDb();
        const adminsSnapshot = await adminDb.collection('admins').get();
        
        const admins = [...PRIMARY_ADMIN_EMAILS]; // Always include primary admins
        adminsSnapshot.forEach(doc => {
            const email = doc.id;
            if (!isPrimaryAdminEmail(email)) {
                admins.push(email);
            }
        });

        return NextResponse.json({ admins });
    } catch (error: any) {
        console.error('Error fetching admins:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch admins' },
            { status: 500 }
        );
    }
}

/**
 * Add a new admin
 */
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Valid email is required' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if already a primary admin
        if (isPrimaryAdminEmail(normalizedEmail)) {
            return NextResponse.json(
                { error: 'This email is already a primary admin' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const adminDoc = adminDb.collection('admins').doc(normalizedEmail);
        const existingDoc = await adminDoc.get();

        if (existingDoc.exists) {
            return NextResponse.json(
                { error: 'This email is already an admin' },
                { status: 400 }
            );
        }

        // Verify that the user exists in Firebase Authentication
        try {
            const adminAuth = getAdminAuth();
            await adminAuth.getUserByEmail(normalizedEmail);
        } catch (error: any) {
            return NextResponse.json(
                { error: 'User not found in Firebase Authentication. Please ensure the user has signed up first.' },
                { status: 404 }
            );
        }

        // Add to admins collection
        await adminDoc.set({
            email: normalizedEmail,
            addedAt: new Date().toISOString(),
            addedBy: 'system', // Could be enhanced to track who added
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Admin added successfully',
            email: normalizedEmail
        });
    } catch (error: any) {
        console.error('Error adding admin:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add admin' },
            { status: 500 }
        );
    }
}

/**
 * Remove an admin
 */
export async function DELETE(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Valid email is required' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Prevent deletion of primary admin
        if (isPrimaryAdminEmail(normalizedEmail)) {
            return NextResponse.json(
                { error: 'Primary admin cannot be deleted' },
                { status: 403 }
            );
        }

        const adminDb = getAdminDb();
        const adminDoc = adminDb.collection('admins').doc(normalizedEmail);
        const existingDoc = await adminDoc.get();

        if (!existingDoc.exists) {
            return NextResponse.json(
                { error: 'This email is not an admin' },
                { status: 404 }
            );
        }

        // Remove from admins collection
        await adminDoc.delete();

        return NextResponse.json({ 
            success: true, 
            message: 'Admin removed successfully',
            email: normalizedEmail
        });
    } catch (error: any) {
        console.error('Error removing admin:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to remove admin' },
            { status: 500 }
        );
    }
}

