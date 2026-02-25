/**
 * API Route: Get Video Download URL
 * Gets download URL for videos from Firebase Storage
 * Uses Admin SDK to bypass client-side permission issues
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const storagePath = request.nextUrl.searchParams.get('path');

        if (!storagePath) {
            return NextResponse.json(
                { error: 'Storage path is required' },
                { status: 400 }
            );
        }

        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const file = bucket.file(storagePath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Try to generate signed URL
        // In Cloud Functions, this requires the service account to have
        // "Service Account Token Creator" role
        let url: string;
        
        try {
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000, // 1 hour
            });
            url = signedUrl;
        } catch (error: any) {
            // If signed URL fails due to signBlob permission issue
            if (error.message?.includes('signBlob') || error.message?.includes('Permission')) {
                console.error('Signed URL failed due to permissions:', error.message);
                
                // Try to make file public and use public URL as fallback
                // This requires Storage Admin permission but doesn't need signBlob
                try {
                    await file.makePublic();
                    url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
                    console.log('Using public URL as fallback');
                } catch (publicError: any) {
                    // If making public also fails, provide helpful error message
                    throw new Error(
                        `동영상 URL을 생성할 수 없습니다. ` +
                        `Cloud Functions 서비스 계정에 "Service Account Token Creator" 역할을 부여하거나, ` +
                        `Storage 파일을 공개로 설정해주세요. ` +
                        `오류: ${error.message}`
                    );
                }
            } else {
                // Re-throw other errors
                throw error;
            }
        }

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('Error getting video URL:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get video URL' },
            { status: 500 }
        );
    }
}

