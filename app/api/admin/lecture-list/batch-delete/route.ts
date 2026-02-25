/**
 * API Route: Batch Delete Lecture List Items
 * Delete multiple lecture list items at once
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const LECTURE_LIST_COLLECTION = 'lecture_list';

export async function POST(request: NextRequest) {
    try {
        const { itemIds } = await request.json();

        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return NextResponse.json(
                { error: 'Item IDs array is required' },
                { status: 400 }
            );
        }

        // Batch delete
        const adminDb = getAdminDb();
        const batch = adminDb.batch();
        itemIds.forEach((itemId: string) => {
            const docRef = adminDb.collection(LECTURE_LIST_COLLECTION).doc(itemId);
            batch.delete(docRef);
        });

        await batch.commit();

        return NextResponse.json({ 
            success: true,
            deleted: itemIds.length
        });
    } catch (error: any) {
        console.error('Error batch deleting lecture list items:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete lecture list items' },
            { status: 500 }
        );
    }
}

