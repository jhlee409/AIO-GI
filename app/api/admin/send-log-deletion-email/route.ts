/**
 * API Route: Send Log Deletion Email
 * Sends email with CSV attachment to admin
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { csvFileName, csvContent, fileCount } = await request.json();

        if (!csvFileName || !csvContent) {
            return NextResponse.json(
                { error: 'CSV file name and content are required' },
                { status: 400 }
            );
        }

        // Get admin email from environment or use default
        const adminEmail = process.env.ADMIN_EMAIL || 'jhlee409@gmail.com';
        
        // Create email content
        const subject = `[로그 파일 삭제 기록] ${fileCount || 0}개 파일 삭제 완료`;
        const body = `로그 파일 삭제가 완료되었습니다.\n\n` +
            `삭제된 파일 수: ${fileCount || 0}개\n` +
            `삭제 일시: ${new Date().toLocaleString('ko-KR')}\n\n` +
            `삭제 기록은 첨부된 CSV 파일을 참고하세요.\n\n` +
            `파일명: ${csvFileName}`;

        // Create Gmail compose URL with CSV content as attachment
        // Note: Gmail compose URL doesn't support attachments directly
        // We'll include the CSV content in the email body or provide download link
        
        // For now, we'll create a data URL for the CSV file
        const csvDataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
        
        // Create email body with CSV content
        const emailBody = `${body}\n\n=== 삭제 기록 CSV ===\n${csvContent}`;
        
        // Create Gmail compose URL
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(emailBody);
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(adminEmail)}&su=${encodedSubject}&body=${encodedBody}`;

        // Return the Gmail URL and CSV data for client-side handling
        return NextResponse.json({
            success: true,
            gmailUrl,
            csvDataUrl,
            csvFileName,
            adminEmail,
        });
    } catch (error: any) {
        console.error('Error preparing email:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to prepare email' },
            { status: 500 }
        );
    }
}

