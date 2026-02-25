/**
 * API Route: Get Member File
 * Reads the member Excel file from Firebase Storage or local file system
 */
import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as XLSX from 'xlsx';
import { getAdminStorage } from '@/lib/firebase-admin';

const execAsync = promisify(exec);
const STORAGE_PATH = 'secret/ugi-education-program-member.xlsx';

/**
 * Read file from Firebase Storage or local file system (fallback)
 */
async function readMemberFile(): Promise<Buffer> {
    // Try Firebase Storage first (works in hosting environment)
    try {
        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const file = bucket.file(STORAGE_PATH);
        
        const [exists] = await file.exists();
        if (exists) {
            console.log('Reading member file from Firebase Storage');
            const [buffer] = await file.download();
            return buffer as Buffer;
        }
    } catch (storageError: any) {
        console.warn('Failed to read from Firebase Storage, trying local file system:', storageError.message);
    }
    
    // Fallback to local file system (for local development)
    const filePath = path.join(process.cwd(), 'secret', 'ugi-education-program-member.xlsx');
    if (fs.existsSync(filePath)) {
        console.log('Reading member file from local file system');
        return fs.readFileSync(filePath);
    }
    
    throw new Error('Member file not found in Firebase Storage or local file system');
}

export async function GET(request: NextRequest) {
    try {
        const action = request.nextUrl.searchParams.get('action') || 'download'; // 'open', 'download', or 'read'
        
        // If action is 'read', read the Excel file and return present sheet data
        if (action === 'read') {
            try {
                const fileBuffer = await readMemberFile();
                const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                
                // Check if 'present' sheet exists
                if (!workbook.SheetNames.includes('present')) {
                    return NextResponse.json(
                        { error: 'present 시트를 찾을 수 없습니다.' },
                        { status: 404 }
                    );
                }
                
                // Read the 'present' sheet
                const presentSheet = workbook.Sheets['present'];
                const data = XLSX.utils.sheet_to_json(presentSheet, { defval: '' });
                
                return NextResponse.json({
                    success: true,
                    data: data,
                    sheetName: 'present'
                });
            } catch (readError: any) {
                console.error('Error reading Excel file:', readError);
                return NextResponse.json(
                    { error: readError.message || '엑셀 파일을 읽는 중 오류가 발생했습니다.' },
                    { status: 500 }
                );
            }
        }

        // If action is 'open', try to open the file with system default application (local only)
        if (action === 'open') {
            try {
                // Only works in local development with file system access
                const filePath = path.join(process.cwd(), 'secret', 'ugi-education-program-member.xlsx');
                if (fs.existsSync(filePath)) {
                    const normalizedPath = path.resolve(filePath);
                    
                    if (process.platform === 'win32') {
                        // Windows: use 'start' command with proper escaping
                        const escapedPath = normalizedPath.replace(/"/g, '""');
                        await execAsync(`cmd /c start "" "${escapedPath}"`);
                    } else if (process.platform === 'darwin') {
                        // macOS: use 'open' command
                        await execAsync(`open "${normalizedPath}"`);
                    } else {
                        // Linux: use 'xdg-open' command
                        await execAsync(`xdg-open "${normalizedPath}"`);
                    }
                    
                    return NextResponse.json({
                        success: true,
                        message: 'File opened successfully',
                        filePath: normalizedPath
                    });
                } else {
                    // In hosting environment, fall back to download
                    throw new Error('File system access not available in hosting environment');
                }
            } catch (openError: any) {
                console.error('Error opening file:', openError);
                // If opening fails, fall back to download
                // Continue to download section below
            }
        }

        // Default: download the file
        const fileBuffer = await readMemberFile();
        
        // Return file as response with proper headers
        return new NextResponse(fileBuffer as any, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="ugi-education-program-member.xlsx"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('Error reading member file:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to read member file' },
            { status: 500 }
        );
    }
}

/**
 * API Route: Save Member File
 * Saves the uploaded member Excel file to Firebase Storage and optionally local file system
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json(
                { error: 'File is required' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Save to Firebase Storage (primary storage for hosting environment)
        try {
            const adminStorage = getAdminStorage();
            const bucket = adminStorage.bucket();
            const storageFile = bucket.file(STORAGE_PATH);
            
            await storageFile.save(buffer, {
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                metadata: {
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });
            
            console.log('Member file saved to Firebase Storage');
        } catch (storageError: any) {
            console.error('Error saving to Firebase Storage:', storageError);
            // Continue to try local file system as fallback
        }
        
        // Also save to local file system if available (for local development)
        try {
            const filePath = path.join(process.cwd(), 'secret', 'ugi-education-program-member.xlsx');
            const secretDir = path.join(process.cwd(), 'secret');
            
            if (!fs.existsSync(secretDir)) {
                fs.mkdirSync(secretDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, buffer);
            console.log('Member file saved to local file system');
        } catch (localError: any) {
            console.warn('Error saving to local file system (this is OK in hosting environment):', localError.message);
            // This is expected in hosting environments, so we don't throw an error
        }
        
        return NextResponse.json({
            success: true,
            message: 'Member file saved successfully'
        });
    } catch (error: any) {
        console.error('Error saving member file:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save member file' },
            { status: 500 }
        );
    }
}
