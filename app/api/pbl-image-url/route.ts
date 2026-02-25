/**
 * API Route: Get PBL Image URL from Firebase Storage
 * Gets the download URL for a specific PBL image file
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const imageName = request.nextUrl.searchParams.get('imageName');
        const folder = request.nextUrl.searchParams.get('folder') || 'PBL_F2_01';
        
        if (!imageName) {
            return NextResponse.json(
                { error: 'Image name is required' },
                { status: 400 }
            );
        }

        console.log('Fetching PBL image URL:', { imageName, folder });

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
            const filePath = `PBL/images/${folder}/${imageName}${ext}`;
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
            // 확장자 없이도 시도
            const filePath = `PBL/images/${folder}/${imageName}`;
            const file = bucket.file(filePath);
            try {
                const [exists] = await file.exists();
                if (exists) {
                    foundFile = file;
                    console.log('Found image file (no extension):', filePath);
                }
            } catch (checkError: any) {
                console.warn(`Error checking file existence for ${filePath}:`, checkError.message);
            }
        }
        
        if (!foundFile) {
            console.error('Image not found:', imageName);
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
        console.error('Error fetching PBL image URL:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch image URL' },
            { status: 500 }
        );
    }
}

