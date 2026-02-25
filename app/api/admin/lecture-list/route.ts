/**
 * API Route: Lecture List Management
 * CRUD operations for lecture list data in Firestore
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const LECTURE_LIST_COLLECTION = 'lecture_list';

/** 중복 판별용 키: 카테고리 + 강의제목 (필드명 차이 무시) */
function getDuplicateKey(item: Record<string, unknown>): string {
    const category = String(
        item['카테고리'] ?? item['카테고리명'] ?? item['category'] ?? item['Category'] ?? ''
    ).trim();
    const title = String(
        item['강의제목'] ?? item['제목'] ?? item['title'] ?? item['Title'] ?? ''
    ).trim();
    return `${category}\n${title}`;
}

// GET: Fetch all lecture list items (중복은 한 건만 남기고 나머지 자동 삭제)
export async function GET() {
    try {
        const adminDb = getAdminDb();
        const snapshot = await adminDb.collection(LECTURE_LIST_COLLECTION).get();
        const allItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as { id: string;[key: string]: unknown }[];

        const seenKeyToId = new Map<string, string>();
        const duplicateIds: string[] = [];

        for (const item of allItems) {
            const key = getDuplicateKey(item);
            if (seenKeyToId.has(key)) {
                duplicateIds.push(item.id);
            } else {
                seenKeyToId.set(key, item.id);
            }
        }

        if (duplicateIds.length > 0) {
            const BATCH_SIZE = 500;
            for (let i = 0; i < duplicateIds.length; i += BATCH_SIZE) {
                const chunk = duplicateIds.slice(i, i + BATCH_SIZE);
                const batch = adminDb.batch();
                for (const id of chunk) {
                    batch.delete(adminDb.collection(LECTURE_LIST_COLLECTION).doc(id));
                }
                await batch.commit();
            }
        }

        const items = allItems.filter(item => !duplicateIds.includes(item.id));

        return NextResponse.json({ items });
    } catch (error: any) {
        console.error('Error fetching lecture list:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch lecture list' },
            { status: 500 }
        );
    }
}

// POST: Save lecture list items (from Excel upload)
export async function POST(request: NextRequest) {
    try {
        const { items } = await request.json();

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Items array is required' },
                { status: 400 }
            );
        }

        // Get existing items to avoid duplicates
        const adminDb = getAdminDb();
        const existingSnapshot = await adminDb.collection(LECTURE_LIST_COLLECTION).get();
        const existingItems = new Set(
            existingSnapshot.docs.map(doc => JSON.stringify(doc.data()))
        );

        // Batch write for better performance
        const batch = adminDb.batch();
        let addedCount = 0;

        for (const item of items) {
            // Create a unique key based on item data to check for duplicates
            const itemKey = JSON.stringify(item);

            if (!existingItems.has(itemKey)) {
                const docRef = adminDb.collection(LECTURE_LIST_COLLECTION).doc();
                batch.set(docRef, {
                    ...item,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                existingItems.add(itemKey);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            added: addedCount,
            total: items.length
        });
    } catch (error: any) {
        console.error('Error saving lecture list:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save lecture list' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a lecture list item
export async function DELETE(request: NextRequest) {
    try {
        const { itemId } = await request.json();

        if (!itemId) {
            return NextResponse.json(
                { error: 'Item ID is required' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        await adminDb.collection(LECTURE_LIST_COLLECTION).doc(itemId).delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting lecture list item:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete lecture list item' },
            { status: 500 }
        );
    }
}

