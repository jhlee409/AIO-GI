/**
 * API Route: Get EGD Dx Training DOCX Content
 * Reads .docx file from Firebase Storage and converts it to text
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';
import mammoth from 'mammoth';

export async function GET(request: NextRequest) {
    try {
        const imageName = request.nextUrl.searchParams.get('imageName');
        const fileNumber = request.nextUrl.searchParams.get('fileNumber'); // '1' or '2'
        const version = request.nextUrl.searchParams.get('version') || 'F1'; // F1 or F2
        
        if (!imageName) {
            return NextResponse.json(
                { error: 'Image name is required' },
                { status: 400 }
            );
        }

        if (!fileNumber) {
            return NextResponse.json(
                { error: 'File number is required (1 or 2)' },
                { status: 400 }
            );
        }

        console.log('Fetching EGD Dx DOCX content:', { imageName, fileNumber, version });

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
        const filePath = `EGD_Dx_training/${version}/instructions/${imageName}_${fileNumber}.docx`;
        const file = bucket.file(filePath);

        // Check if file exists
        let exists: boolean;
        try {
            [exists] = await file.exists();
        } catch (checkError: any) {
            console.error('Error checking file existence:', checkError);
            return NextResponse.json(
                { error: 'Failed to check file existence: ' + checkError.message },
                { status: 500 }
            );
        }

        if (!exists) {
            console.log('File not found:', filePath);
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Download file from Storage
        let buffer: Buffer;
        try {
            [buffer] = await file.download();
        } catch (downloadError: any) {
            console.error('Error downloading file:', downloadError);
            return NextResponse.json(
                { error: 'Failed to download file: ' + downloadError.message },
                { status: 500 }
            );
        }

        // Convert .docx to text using mammoth
        let result;
        try {
            result = await mammoth.extractRawText({ buffer });
        } catch (mammothError: any) {
            console.error('Error converting DOCX to text:', mammothError);
            return NextResponse.json(
                { error: 'Failed to convert DOCX to text: ' + mammothError.message },
                { status: 500 }
            );
        }

        const text = result.value;
        const messages = result.messages;

        return NextResponse.json({ 
            text,
            messages: messages.length > 0 ? messages.map(m => m.message) : []
        });
    } catch (error: any) {
        console.error('Error fetching EGD Dx DOCX content:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch DOCX content' },
            { status: 500 }
        );
    }
}

