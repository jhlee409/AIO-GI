/**
 * API Route: EMT Job Status
 * Returns the current status of an EMT analysis job
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// CORS headers for external access
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}

// Runtime config
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
        return NextResponse.json(
            { error: 'jobId parameter is required' },
            { status: 400, headers: corsHeaders }
        );
    }
    
    try {
        const adminDb = getAdminDb();
        const jobDoc = await adminDb.collection('emtJobs').doc(jobId).get();
        
        if (!jobDoc.exists) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404, headers: corsHeaders }
            );
        }
        
        const jobData = jobDoc.data();
        
        return NextResponse.json({
            jobId,
            status: jobData?.status || 'unknown',
            progress: jobData?.progress || undefined,
            progressMessage: jobData?.progressMessage || undefined,
            createdAt: jobData?.createdAt,
            updatedAt: jobData?.updatedAt,
            completedAt: jobData?.completedAt,
            result: jobData?.result || null,
            error: jobData?.error || null,
        }, {
            headers: corsHeaders,
        });
    } catch (error: any) {
        console.error('[emt-job-status] Error:', {
            message: error.message,
            stack: error.stack?.substring(0, 500),
        });
        
        return NextResponse.json(
            { 
                error: error.message || 'Failed to get job status',
            },
            { 
                status: 500,
                headers: corsHeaders,
            }
        );
    }
}

