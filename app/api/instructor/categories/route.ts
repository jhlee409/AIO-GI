/**
 * API Route: Get Lecture List Categories
 * Gets unique categories from lecture_list collection in order
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const adminDb = getAdminDb();
        const snapshot = await adminDb.collection('lecture_list').get();
        const items: any[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Find order field name (순서 or 순번 or order)
        const orderFieldName = items.length > 0
            ? Object.keys(items[0] || {}).find(key =>
                key === '순서' || key === '순번' || key.toLowerCase() === 'order' || key.toLowerCase() === 'sequence'
            ) || null
            : null;

        // Sort items by order field
        if (orderFieldName && items.length > 0) {
            items.sort((a, b) => {
                const valueA = a[orderFieldName];
                const valueB = b[orderFieldName];

                // Try to parse as number first
                const numA = typeof valueA === 'number' ? valueA : (typeof valueA === 'string' ? parseFloat(valueA) : 0);
                const numB = typeof valueB === 'number' ? valueB : (typeof valueB === 'string' ? parseFloat(valueB) : 0);

                // If both are valid numbers, compare numerically
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }

                // Otherwise, compare as strings
                const strA = String(valueA || '').trim();
                const strB = String(valueB || '').trim();
                return strA.localeCompare(strB, 'ko');
            });
        }

        // Extract categories in order (preserve order, remove duplicates)
        const categories: string[] = [];
        const seenCategories = new Set<string>();

        items.forEach(item => {
            // Try different possible field names for category
            const category = item['카테고리'] || item['카테고리명'] || item['category'] || item['Category'];

            if (category && typeof category === 'string') {
                const trimmedCategory = category.trim();
                if (trimmedCategory && !seenCategories.has(trimmedCategory)) {
                    seenCategories.add(trimmedCategory);
                    categories.push(trimmedCategory);
                }
            }
        });

        return NextResponse.json({
            categories: categories,
        });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

