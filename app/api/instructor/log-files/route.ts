/**
 * API Route: Get Log Files from Firebase Storage
 * Gets list of log file names from log folder in Firebase Storage
 */
import { NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const [files] = await bucket.getFiles({ prefix: 'log/' });

        const fileNames = files
            .map(file => {
                const fileName = file.name.split('/').pop() || file.name;
                return fileName;
            })
            .filter(fileName => fileName && fileName.length > 0);

        return NextResponse.json({ fileNames });
    } catch (error: any) {
        console.error('Error fetching log files:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch log files' },
            { status: 500 }
        );
    }
}

