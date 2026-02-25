/**
 * API Route: Send EMT Video Upload Email to Instructors
 * 사용자 확인 후 교육자들에게 이메일을 전송
 */
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { extractErrorMessage } from '@/lib/error-handler';

// Gmail SMTP 설정
let transporter: nodemailer.Transporter | null = null;

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });
}

export async function POST(request: NextRequest) {
    try {
        console.log('[emt-send-email] Request received');
        const bodyData = await request.json();
        const { instructors, subject, body } = bodyData;
        
        console.log('[emt-send-email] Request data:', {
            instructorsCount: instructors?.length,
            hasSubject: !!subject,
            hasBody: !!body,
            transporterConfigured: !!transporter
        });

        if (!instructors || !Array.isArray(instructors) || instructors.length === 0) {
            return NextResponse.json(
                { error: 'Instructors list is required' },
                { status: 400 }
            );
        }

        if (!subject || !body) {
            return NextResponse.json(
                { error: 'Subject and body are required' },
                { status: 400 }
            );
        }

        if (!transporter) {
            return NextResponse.json(
                { error: 'Email service is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.' },
                { status: 500 }
            );
        }

        // 모든 교육자 이메일 주소 추출
        const instructorEmails = instructors
            .map(inst => inst.email)
            .filter(email => email && email.trim());

        if (instructorEmails.length === 0) {
            return NextResponse.json(
                { error: 'No valid instructor emails found' },
                { status: 400 }
            );
        }

        // BCC로 모든 교육자에게 이메일 전송
        try {
            const emailOptions: any = {
                from: process.env.GMAIL_USER,
                subject: subject,
                text: body,
                html: body.replace(/\n/g, '<br>')
            };

            // 교육자가 1명인 경우와 여러 명인 경우 처리
            if (instructorEmails.length === 1) {
                emailOptions.to = instructorEmails[0];
            } else {
                emailOptions.to = instructorEmails[0]; // 첫 번째 이메일을 받는 사람으로 설정
                emailOptions.bcc = instructorEmails.slice(1); // 나머지는 BCC
            }

            console.log(`[emt-send-email] Sending email to ${instructorEmails.length} instructors`);
            console.log(`[emt-send-email] To: ${emailOptions.to}`);
            if (emailOptions.bcc && emailOptions.bcc.length > 0) {
                console.log(`[emt-send-email] BCC: ${emailOptions.bcc.join(', ')}`);
            }

            await transporter.sendMail(emailOptions);

            console.log(`[emt-send-email] Email sent successfully to ${instructorEmails.length} instructors`);
            console.log(`[emt-send-email] Recipients: ${instructorEmails.join(', ')}`);

            return NextResponse.json({
                success: true,
                message: `이메일이 ${instructorEmails.length}명의 교육자에게 전송되었습니다.`,
                sentCount: instructorEmails.length
            });
        } catch (emailError: any) {
            const errorMessage = extractErrorMessage(emailError, 'Failed to send email');
            console.error('[emt-send-email] Email sending error:', {
                message: errorMessage,
                code: emailError.code,
                responseCode: emailError.responseCode,
                response: emailError.response,
                command: emailError.command,
                stack: emailError.stack
            });
            return NextResponse.json(
                { error: `이메일 전송 실패: ${errorMessage}` },
                { status: 500 }
            );
        }
    } catch (error: any) {
        const errorMessage = extractErrorMessage(error, 'Failed to process email request');
        console.error('[emt-send-email] Error:', errorMessage);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

