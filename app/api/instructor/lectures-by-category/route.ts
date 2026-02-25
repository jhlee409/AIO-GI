/**
 * API Route: Get Lectures by Category
 * Gets lecture titles from lecture_list collection filtered by categories
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { categories } = await request.json();

        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return NextResponse.json(
                { error: 'Categories array is required' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const snapshot = await adminDb.collection('lecture_list').get();
        const items: any[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Find order field name
        const orderFieldName = Object.keys(items[0] || {}).find(key =>
            key === '순서' || key === '순번' || key.toLowerCase() === 'order' || key.toLowerCase() === 'sequence'
        ) || null;

        // Sort items by order field
        if (orderFieldName && items.length > 0) {
            items.sort((a, b) => {
                const valueA = a[orderFieldName];
                const valueB = b[orderFieldName];

                const numA = typeof valueA === 'number' ? valueA : (typeof valueA === 'string' ? parseFloat(valueA) : 0);
                const numB = typeof valueB === 'number' ? valueB : (typeof valueB === 'string' ? parseFloat(valueB) : 0);

                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }

                const strA = String(valueA || '').trim();
                const strB = String(valueB || '').trim();
                return strA.localeCompare(strB, 'ko');
            });
        }

        // Filter by categories and extract lectures
        const lectures: Array<{ category: string; title: string }> = [];

        items.forEach(item => {
            const category = item['카테고리'] || item['카테고리명'] || item['category'] || item['Category'];
            const title = item['강의제목'] || item['제목'] || item['title'] || item['Title'] || '';

            if (category && typeof category === 'string' && categories.includes(category.trim())) {
                if (title && typeof title === 'string') {
                    lectures.push({
                        category: category.trim(),
                        title: title.trim()
                    });
                }
            }
        });

        return NextResponse.json({ lectures });
    } catch (error: any) {
        console.error('Error fetching lectures by category:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch lectures by category' },
            { status: 500 }
        );
    }
}

