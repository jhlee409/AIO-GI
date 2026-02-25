/**
 * API Route: Get EGD Dx Training Image URL from Firebase Storage
 * Gets the download URL for a specific image file
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const imageName = request.nextUrl.searchParams.get('imageName');
        const version = request.nextUrl.searchParams.get('version') || 'F1'; // F1 or F2
        
        if (!imageName) {
            return NextResponse.json(
                { error: 'Image name is required' },
                { status: 400 }
            );
        }

        console.log('Fetching EGD Dx image URL:', { imageName, version });

        let adminStorage;
        try {
            adminStorage = getAdminStorage();
        } catch (initError: any) {
            console.error('Failed to initialize Firebase Admin Storage:', initError);
            return NextResponse.json(
                { error: 'Failed to initialize storage service: ' + initError.message },
                { status: 500 }
            );
        }

        const bucket = adminStorage.bucket();
        
        // 일반적인 이미지 확장자들 시도
        const extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'];
        let foundFile = null;
        
        for (const ext of extensions) {
            const filePath = `EGD_Dx_training/${version}/images/${imageName}${ext}`;
            const file = bucket.file(filePath);
            try {
                const [exists] = await file.exists();
                if (exists) {
                    foundFile = file;
                    console.log('Found image file:', filePath);
                    break;
                }
            } catch (checkError: any) {
                console.warn(`Error checking file existence for ${filePath}:`, checkError.message);
                continue;
            }
        }
        
        if (!foundFile) {
            console.error('Image not found for:', { imageName, version });
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        // Get signed URL (valid for 1 hour)
        let url: string;
        try {
            const [signedUrl] = await foundFile.getSignedUrl({
                action: 'read',
                expires: Date.now() + 3600 * 1000, // 1 hour
            });
            url = signedUrl;
        } catch (signedUrlError: any) {
            console.error('Error generating signed URL:', signedUrlError);
            // Fallback: try to make file public and use public URL
            try {
                await foundFile.makePublic();
                url = `https://storage.googleapis.com/${bucket.name}/${foundFile.name}`;
                console.log('Using public URL as fallback');
            } catch (publicError: any) {
                console.error('Error making file public:', publicError);
                throw new Error(`Failed to generate image URL: ${signedUrlError.message}`);
            }
        }

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('Error fetching EGD Dx image URL:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch image URL' },
            { status: 500 }
        );
    }
}

