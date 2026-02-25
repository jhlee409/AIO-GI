/**
 * Cleanup EMT Visualization Files
 * Deletes files in Simulator_training/EMT/EMT_visualization folder that are older than 3 hours
 * This endpoint should be called periodically (e.g., every hour) via Cloud Scheduler or cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
    try {
        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        
        // Security: Check for authorization header or secret token
        const authHeader = request.headers.get('authorization');
        const secretToken = process.env.CLEANUP_SECRET_TOKEN;
        
        // If secret token is set, require it
        if (secretToken && authHeader !== `Bearer ${secretToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: corsHeaders }
            );
        }
        
        const visualizationFolder = 'Simulator_training/EMT/EMT_visualization/';
        const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000); // 3 hours in milliseconds
        
        console.log(`[cleanup-emt-visualization] Starting cleanup at ${new Date().toISOString()}`);
        console.log(`[cleanup-emt-visualization] Deleting files older than ${new Date(threeHoursAgo).toISOString()}`);
        
        // List all files in the visualization folder
        const [files] = await bucket.getFiles({
            prefix: visualizationFolder,
        });
        
        console.log(`[cleanup-emt-visualization] Found ${files.length} files in ${visualizationFolder}`);
        
        const deletedFiles: string[] = [];
        const failedDeletions: Array<{ file: string; error: string }> = [];
        let skippedFiles = 0;
        
        // Check each file's creation time
        for (const file of files) {
            try {
                // Get file metadata
                const [metadata] = await file.getMetadata();
                const timeCreated = metadata.timeCreated 
                    ? new Date(metadata.timeCreated).getTime() 
                    : null;
                
                if (!timeCreated) {
                    console.warn(`[cleanup-emt-visualization] File ${file.name} has no timeCreated metadata, skipping`);
                    skippedFiles++;
                    continue;
                }
                
                // Check if file is older than 3 hours
                if (timeCreated < threeHoursAgo) {
                    try {
                        await file.delete();
                        deletedFiles.push(file.name);
                        console.log(`[cleanup-emt-visualization] Deleted: ${file.name} (created: ${new Date(timeCreated).toISOString()})`);
                    } catch (deleteError: any) {
                        const errorMsg = deleteError.message || 'Unknown error';
                        failedDeletions.push({ file: file.name, error: errorMsg });
                        console.error(`[cleanup-emt-visualization] Failed to delete ${file.name}:`, errorMsg);
                    }
                } else {
                    skippedFiles++;
                }
            } catch (metadataError: any) {
                const errorMsg = metadataError.message || 'Unknown error';
                failedDeletions.push({ file: file.name, error: `Failed to get metadata: ${errorMsg}` });
                console.error(`[cleanup-emt-visualization] Error getting metadata for ${file.name}:`, errorMsg);
            }
        }
        
        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            folder: visualizationFolder,
            totalFiles: files.length,
            deletedCount: deletedFiles.length,
            skippedCount: skippedFiles,
            failedCount: failedDeletions.length,
            deletedFiles: deletedFiles.slice(0, 100), // Limit to first 100 for response size
            failedDeletions: failedDeletions.slice(0, 100), // Limit to first 100 for response size
            cutoffTime: new Date(threeHoursAgo).toISOString(),
        };
        
        console.log(`[cleanup-emt-visualization] Cleanup completed:`, {
            totalFiles: result.totalFiles,
            deletedCount: result.deletedCount,
            skippedCount: result.skippedCount,
            failedCount: result.failedCount,
        });
        
        return NextResponse.json(result, { headers: corsHeaders });
    } catch (error: any) {
        console.error('[cleanup-emt-visualization] Error:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error.message || 'Failed to cleanup visualization files',
                timestamp: new Date().toISOString(),
            },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function POST(request: NextRequest) {
    // POST method also supported for cron jobs
    return GET(request);
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, { headers: corsHeaders });
}
