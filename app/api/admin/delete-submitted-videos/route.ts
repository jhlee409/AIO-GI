/**
 * API Route: Delete Submitted Videos
 * Deletes submitted videos for selected users from Firebase Storage
 * Deletes videos from: MT/MT_result, EMT/EMT_result, EMT/EMT_visualization, LHT/LHT_result, SHT/SHT_result
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

interface FileInfo {
    name: string;
    path: string;
    size?: number;
    contentType?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { action, users } = await request.json();

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
        const folders = [
            'Simulator_training/MT/MT_result',
            'Simulator_training/EMT/EMT_result',
            'Simulator_training/EMT/EMT_visualization',
            'Simulator_training/LHT/LHT_result',
            'Simulator_training/SHT/SHT_result'
        ];
        
        // Create a map of user identifiers (position-name combinations)
        const userMap = new Map<string, any>();
        users.forEach((user: any) => {
            const position = String(user['직위'] || user['position'] || '').trim();
            const name = String(user['이름'] || user['성명'] || user['name'] || '').trim();
            
            if (position && name) {
                const key = `${position}-${name}`.toLowerCase();
                userMap.set(key, { position, name });
            }
        });

        const results = {
            deleted: [] as FileInfo[],
            errors: [] as string[],
        };
        let deletedCount = 0;

        // Delete files matching selected users
        for (const folder of folders) {
            try {
                const [files] = await bucket.getFiles({ prefix: `${folder}/` });

                for (const file of files) {
                    try {
                        const fileName = file.name.split('/').pop() || file.name;
                        
                        // Check if file belongs to any selected user
                        // Video file format: {position}-{name}-{type}-{timestamp}.ext
                        let matched = false;
                        
                        for (const [key, user] of userMap.entries()) {
                            // Check if file name starts with position-name pattern
                            if (fileName.toLowerCase().startsWith(key)) {
                                matched = true;
                                break;
                            }
                        }

                        if (matched) {
                            // Get file metadata before deletion
                            const [metadata] = await file.getMetadata();
                            const fileSize = typeof metadata.size === 'string' 
                                ? parseInt(metadata.size, 10) 
                                : (typeof metadata.size === 'number' ? metadata.size : 0);

                            // Delete the file
                            await file.delete();
                            deletedCount++;

                            results.deleted.push({
                                name: fileName,
                                path: file.name,
                                size: fileSize,
                                contentType: metadata.contentType || 'unknown',
                            });
                        }
                    } catch (fileError: any) {
                        const errorMsg = `Failed to delete ${file.name}: ${fileError.message}`;
                        console.error(errorMsg);
                        results.errors.push(errorMsg);
                    }
                }
            } catch (folderError: any) {
                const errorMsg = `Failed to process folder ${folder}: ${folderError.message}`;
                console.error(errorMsg);
                results.errors.push(errorMsg);
            }
        }

        return NextResponse.json({
            success: true,
            deletedCount,
            deletedFiles: results.deleted.length,
            errors: results.errors.length,
        });
    } catch (error: any) {
        console.error('Error deleting submitted videos:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete submitted videos' },
            { status: 500 }
        );
    }
}

