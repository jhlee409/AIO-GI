/**
 * API Route: Create EGD Lesion Dx Log File
 * Creates a log file and saves it to Firebase Storage in log_EGD_Lesion_Dx folder
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';
import { requireUser } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
    const access = await requireUser(request);
    if (access instanceof NextResponse) return access;
    try {
        const { fileName, content } = await request.json();

        if (typeof fileName !== 'string' || !fileName || fileName.length > 200 || /[\\/\x00-\x1f]/.test(fileName) ||
            typeof content !== 'string' || !content) {
            return NextResponse.json(
                { error: 'Valid file name and content are required' },
                { status: 400 }
            );
        }
        const logEmail = /^Email:\s*(.+)$/im.exec(content)?.[1]?.trim();
        if (!logEmail || logEmail.toLowerCase() !== access.email.toLowerCase()) {
            return NextResponse.json({ error: 'Log identity does not match the signed-in user' }, { status: 403 });
        }

        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const file = bucket.file(`log_EGD_Lesion_Dx/${fileName}`);

        // Create file content (can be text, JSON, etc.)
        const fileContent = content;
        
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
            path: `log_EGD_Lesion_Dx/${fileName}`
        });
    } catch (error: any) {
        console.error('Error creating EGD Lesion Dx log file:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create log file' },
            { status: 500 }
        );
    }
}

