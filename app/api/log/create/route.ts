/**
 * API Route: Create Log File
 * Creates a log file and saves it to Firebase Storage
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { fileName, content } = await request.json();

        if (!fileName || !content) {
            return NextResponse.json(
                { error: 'File name and content are required' },
                { status: 400 }
            );
        }

        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const file = bucket.file(`log/${fileName}`);

        // Create file content (can be text, JSON, etc.)
        const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        
        // UTF-8 BOM 추가하여 한글 깨짐 방지
        const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
        const buffer = Buffer.concat([utf8BOM, Buffer.from(fileContent, 'utf-8')]);

        // Save file to Storage
        await file.save(buffer, {
            metadata: {
                contentType: 'text/plain; charset=utf-8',
            },
        });

        return NextResponse.json({ 
            success: true,
            path: `log/${fileName}`
        });
    } catch (error: any) {
        console.error('Error creating log file:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create log file' },
            { status: 500 }
        );
    }
}

