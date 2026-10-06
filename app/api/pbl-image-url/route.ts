/**
 * API Route: Get PBL Image URL from Firebase Storage
 * Gets the download URL for a specific PBL image file
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    const access = await requireUser(request);
    if (access instanceof NextResponse) return access;
    try {
        const imageName = request.nextUrl.searchParams.get('imageName');
        const folder = request.nextUrl.searchParams.get('folder') || 'PBL_F2_01';
        if (!/^PBL_F2_(?:0[1-9]|1[0-4])$/.test(folder) || !imageName || /[\\/\x00-\x1f]/.test(imageName) || imageName.includes('..')) {
            return NextResponse.json({ error: 'Invalid image name or folder' }, { status: 400 });
        }
        
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
        const checkExtension = async (ext: string) => {
            const filePath = `PBL/images/${folder}/${imageName}${ext}`;
            const file = bucket.file(filePath);
            try {
                const [exists] = await file.exists();
                if (exists) {
                    console.log('Found image file:', filePath);
                    return file;
                }
            } catch (checkError: any) {
                console.warn(`Error checking file existence for ${filePath}:`, checkError.message);
            }
            return null;
        };
        // Most images use .jpg. If it is absent, check the remaining formats
        // concurrently while retaining the existing extension priority.
        let foundFile = await checkExtension(extensions[0]);
        if (!foundFile) {
            const alternatives = await Promise.all(extensions.slice(1).map(checkExtension));
            foundFile = alternatives.find(file => file !== null) || null;
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
        // Signing failure must not make training images public.
        const [url] = await foundFile.getSignedUrl({
            action: 'read',
            expires: Date.now() + 3600 * 1000,
        });

        return NextResponse.json({ url }, { headers: { 'Cache-Control': 'private, max-age=300' } });
    } catch (error: any) {
        console.error('Error fetching PBL image URL:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch image URL' },
            { status: 500 }
        );
    }
}

