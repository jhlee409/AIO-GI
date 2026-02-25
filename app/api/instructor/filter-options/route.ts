/**
 * API Route: Get Filter Options
 * Gets unique hospitals and positions from users collection
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const adminDb = getAdminDb();
        let snapshot = await adminDb.collection('users').get();

        // If users collection is empty, try patients collection for backward compatibility
        if (snapshot.empty) {
            snapshot = await adminDb.collection('patients').get();
        }
        const hospitals = new Set<string>();
        const positions = new Set<string>();

        const ALL_POSITIONS = ['R3', 'F1', 'F2'];
        ALL_POSITIONS.forEach(p => positions.add(p));

        const f2Variants = ['F2', 'F2D', 'F2C', 'FCD'];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const hospital = data['병원'] || data['병원명'] || data['hospital'];
            let position = data['직위'] || data['position'];

            if (hospital && typeof hospital === 'string') {
                hospitals.add(hospital);
            }
            if (position && typeof position === 'string') {
                if (f2Variants.includes(position.toUpperCase())) {
                    position = 'F2';
                }
                positions.add(position);
            }
        });

        return NextResponse.json({
            hospitals: Array.from(hospitals).sort(),
            positions: Array.from(positions).sort(),
        });
    } catch (error: any) {
        console.error('Error fetching filter options:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch filter options' },
            { status: 500 }
        );
    }
}

