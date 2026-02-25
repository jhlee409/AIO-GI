/**
 * API Route: Get Login Background Image URL
 * Gets the download URL for the login background image from Firebase Storage
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const filePath = 'templates/login_background.png';
        const file = bucket.file(filePath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            console.error('Login background image not found:', filePath);
            return NextResponse.json(
                { error: 'Background image not found' },
                { status: 404 }
            );
        }

        // Get signed URL (valid for 1 year for login background)
        let url: string;
        try {
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
            });
            url = signedUrl;
        } catch (signedUrlError: any) {
            console.error('Error generating signed URL:', signedUrlError);
            // Fallback: try to make file public and use public URL
            try {
                await file.makePublic();
                url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
                console.log('Using public URL as fallback');
            } catch (publicError: any) {
                console.error('Error making file public:', publicError);
                throw new Error(`Failed to generate image URL: ${signedUrlError.message}`);
            }
        }

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('Error fetching login background URL:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch background image URL' },
            { status: 500 }
        );
    }
}

