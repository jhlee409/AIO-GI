/**
 * API Route: Delete Log Files from Firebase Storage
 * Deletes log files for selected users from log and log_EGD_Lesion_Dx folders
 * Also deletes video watch time records for the same users
 * CRITICAL: Only accessible from server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage, getAdminDb } from '@/lib/firebase-admin';

interface FileInfo {
    path: string;
    name: string;
    size: number;
    contentType?: string;
    userEmail?: string;
    userName?: string;
    userPosition?: string;
}

interface DeletionRecord {
    삭제일시: string;
    폴더: string;
    파일명: string;
    파일크기: number;
    사용자이름: string;
    사용자직위: string;
    사용자이메일: string;
}

export async function POST(request: NextRequest) {
    try {
        const { action, users, extraPositions } = await request.json();

        if (action !== 'delete') {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

        if (!users || !Array.isArray(users) || users.length === 0) {
            return NextResponse.json(
                { error: 'Users array is required' },
                { status: 400 }
            );
        }

        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const folders = ['log', 'log_EGD_Lesion_Dx'];

        // Build a list of { position, name, email } entries to match against file names.
        // Each user's actual position is included, plus any extraPositions.
        // "F2" is expanded to also match "F2D" and "F2C" variants.
        const f2VariantMap: Record<string, string[]> = { 'F2': ['F2', 'F2D', 'F2C', 'FCD'] };
        const userEntries: { position: string; name: string; email: string }[] = [];
        const rawExtras: string[] = Array.isArray(extraPositions) ? extraPositions : [];
        const expandedExtras: string[] = [];
        for (const e of rawExtras) {
            const variants = f2VariantMap[e.trim().toUpperCase()];
            if (variants) {
                expandedExtras.push(...variants);
            } else {
                expandedExtras.push(e.trim());
            }
        }

        users.forEach((user: any) => {
            const position = String(user['직위'] || user['position'] || '').trim();
            const name = String(user['이름'] || user['성명'] || user['name'] || '').trim();
            const email = String(user['이메일'] || user['email'] || user['Email'] || user['EMAIL'] || '').trim();

            if (position && name) {
                userEntries.push({ position, name, email });
            }
            const addedPositions = new Set<string>(position ? [position.toUpperCase()] : []);
            for (const extra of expandedExtras) {
                if (name && !addedPositions.has(extra.toUpperCase())) {
                    addedPositions.add(extra.toUpperCase());
                    userEntries.push({ position: extra, name, email });
                }
            }
        });

        const deletedFiles: DeletionRecord[] = [];
        const errors: string[] = [];
        let deletedCount = 0;

        // Delete files matching selected users
        for (const folder of folders) {
            try {
                const [files] = await bucket.getFiles({ prefix: `${folder}/` });

                for (const file of files) {
                    try {
                        const fileName = file.name.split('/').pop() || file.name;

                        let matched = false;
                        let matchedUser: { position: string; name: string; email: string } | null = null;
                        const fileNameLower = fileName.toLowerCase();

                        for (const entry of userEntries) {
                            const positionLower = entry.position.toLowerCase();
                            const nameLower = entry.name.toLowerCase();
                            if (fileNameLower.includes(positionLower) && fileNameLower.includes(nameLower)) {
                                matched = true;
                                matchedUser = entry;
                                break;
                            }
                        }

                        if (matched && matchedUser) {
                            // Get file metadata before deletion
                            const [metadata] = await file.getMetadata();
                            const fileSize = typeof metadata.size === 'string' ? parseInt(metadata.size, 10) : (metadata.size || 0);

                            // Delete file
                            await file.delete();
                            deletedCount++;

                            // Record deletion
                            deletedFiles.push({
                                삭제일시: new Date().toLocaleString('ko-KR'),
                                폴더: folder,
                                파일명: fileName,
                                파일크기: fileSize,
                                사용자이름: matchedUser.name,
                                사용자직위: matchedUser.position,
                                사용자이메일: matchedUser.email,
                            });
                        }
                    } catch (error: any) {
                        errors.push(`Failed to delete ${file.name}: ${error.message}`);
                    }
                }
            } catch (error: any) {
                errors.push(`Failed to access folder ${folder}: ${error.message}`);
            }
        }

        // Delete video watch time records for selected users
        const adminDb = getAdminDb();
        const watchTimeRef = adminDb.collection('video_watch_times');
        let deletedWatchTimeCount = 0;

        const processedEmails = new Set<string>();
        try {
            for (const entry of userEntries) {
                if (entry.email && !processedEmails.has(entry.email)) {
                    processedEmails.add(entry.email);
                    const watchTimeRecords = await watchTimeRef
                        .where('email', '==', entry.email)
                        .get();

                    if (!watchTimeRecords.empty) {
                        const batch = adminDb.batch();
                        watchTimeRecords.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        await batch.commit();
                        deletedWatchTimeCount += watchTimeRecords.size;
                    }
                }
            }
        } catch (error: any) {
            console.error('Error deleting watch time records:', error);
            errors.push(`Failed to delete watch time records: ${error.message}`);
        }

        // Generate CSV file
        const csvContent = generateCSV(deletedFiles);
        const csvFileName = `사용자로그파일삭제기록_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`;

        return NextResponse.json({
            success: true,
            deletedCount,
            deletedFiles: deletedFiles.length,
            deletedWatchTimeRecords: deletedWatchTimeCount,
            errors: errors.length,
            csvFileName,
            csvContent: csvContent, // Include CSV content for download
        });
    } catch (error: any) {
        console.error('Error managing log files:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to manage log files' },
            { status: 500 }
        );
    }
}

function generateCSV(records: DeletionRecord[]): string {
    // UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';

    // CSV header
    const headers = ['삭제일시', '폴더', '파일명', '파일크기', '사용자이름', '사용자직위', '사용자이메일'];

    // CSV rows
    const rows = records.map(record => [
        record.삭제일시,
        record.폴더,
        record.파일명,
        record.파일크기.toString(),
        record.사용자이름,
        record.사용자직위,
        record.사용자이메일,
    ]);

    // Combine header and rows
    const csvLines = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ];

    return BOM + csvLines.join('\n');
}


