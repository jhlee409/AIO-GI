/**
 * API Route: Get EGD Dx Training Images from Firebase Storage
 * Gets list of image file names from EGD_Dx_training/F1 or F2/images folder in Firebase Storage
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const version = request.nextUrl.searchParams.get('version') || 'F1'; // F1 or F2
        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const [files] = await bucket.getFiles({ prefix: `EGD_Dx_training/${version}/images/` });

        const fileNames = files
            .map(file => {
                const fileName = file.name.split('/').pop() || file.name;
                // 확장자 제거
                const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
                return nameWithoutExtension;
            })
            .filter(fileName => {
                // 빈 문자열 제외
                if (!fileName || fileName.length === 0) return false;
                // "EGD_Dx_training/F1/images/" or "EGD_Dx_training/F2/images/" 제외
                if (fileName.includes('EGD_Dx_training/')) return false;
                // "000" 제외
                if (fileName === '000') return false;
                return true;
            });

        return NextResponse.json({ fileNames });
    } catch (error: any) {
        console.error('Error fetching EGD Dx images:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch EGD Dx images' },
            { status: 500 }
        );
    }
}

