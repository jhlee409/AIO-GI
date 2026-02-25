/**
 * API Route: Get CPX DOCX Content
 * Reads .docx file from Firebase Storage and converts it to text
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';
import mammoth from 'mammoth';

export async function GET(request: NextRequest) {
    try {
        const caseNumber = request.nextUrl.searchParams.get('caseNumber');
        
        if (!caseNumber) {
            return NextResponse.json(
                { error: 'Case number is required' },
                { status: 400 }
            );
        }

        // Format case number to 2 digits (e.g., "1" -> "01")
        const formattedCaseNumber = caseNumber.padStart(2, '0');
        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const filePath = `AI_patient_Hx_taking/case/${formattedCaseNumber}.docx`;
        const file = bucket.file(filePath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Download file from Storage
        const [buffer] = await file.download();

        // Convert .docx to text using mammoth
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;

        // Get messages if any
        const messages = result.messages;

        return NextResponse.json({ 
            text,
            messages: messages.length > 0 ? messages.map(m => m.message) : []
        });
    } catch (error: any) {
        console.error('Error fetching CPX DOCX content:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch DOCX content' },
            { status: 500 }
        );
    }
}

