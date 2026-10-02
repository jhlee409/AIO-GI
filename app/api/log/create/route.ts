/**
 * API Route: Create Log File
 * Creates a log file and saves it to Firebase Storage
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
        // These completion files are written only by the 80% watch-time route.
        if (/(?:^|-)(?:PEG|NVUGIB_overview|NVUGIB_Mx_basics_for_residents|EUS_basic|EUS_SET|EUS_case)-Completed$/i.test(fileName)) {
            return NextResponse.json({ error: 'Video completion must be recorded by watch time' }, { status: 403 });
        }

        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const file = bucket.file(`log/${fileName}`);

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
            path: `log/${fileName}`
        });
    } catch (error) {
        console.error('Error creating log file:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create log file' },
            { status: 500 }
        );
    }
}

