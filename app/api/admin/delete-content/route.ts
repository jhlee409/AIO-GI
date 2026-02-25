/**
 * API Route: Delete Content
 * Deletes content from both Firestore and Firebase Storage
 * CRITICAL: Only accessible from server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { id, storagePath } = await request.json();

        if (!id || !storagePath) {
            return NextResponse.json(
                { error: 'Content ID and storage path are required' },
                { status: 400 }
            );
        }

        // Delete from Firestore
        const adminDb = getAdminDb();
        await adminDb.collection('contents').doc(id).delete();

        // Delete from Storage
        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        await bucket.file(storagePath).delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting content:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete content' },
            { status: 500 }
        );
    }
}
