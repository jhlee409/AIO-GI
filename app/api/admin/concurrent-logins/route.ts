/**
 * API Route: Get Concurrent Login Records
 * Retrieves concurrent login records for admin panel
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const adminDb = getAdminDb();
        const concurrentLoginsRef = adminDb.collection('concurrent_logins');
        
        // Get all records, ordered by detectedAt descending (newest first)
        const snapshot = await concurrentLoginsRef
            .orderBy('detectedAt', 'desc')
            .get();

        const records = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email,
                name: data.name,
                hospital: data.hospital,
                detectedAt: data.detectedAt?.toDate ? data.detectedAt.toDate().toISOString() : data.detectedAt,
                totalConcurrentSessions: data.totalConcurrentSessions || 0,
                overlapDuration: data.overlapDuration || 0
            };
        });

        return NextResponse.json({ records });
    } catch (error: any) {
        console.error('Error fetching concurrent logins:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch concurrent logins' },
            { status: 500 }
        );
    }
}

// Get detailed record by ID
export async function POST(request: NextRequest) {
    try {
        const { id } = await request.json();
        
        if (!id) {
            return NextResponse.json(
                { error: 'Record ID is required' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const doc = await adminDb.collection('concurrent_logins').doc(id).get();

        if (!doc.exists) {
            return NextResponse.json(
                { error: 'Record not found' },
                { status: 404 }
            );
        }

        const data = doc.data();
        const record = {
            id: doc.id,
            email: data?.email,
            name: data?.name,
            hospital: data?.hospital,
            detectedAt: data?.detectedAt?.toDate ? data.detectedAt.toDate().toISOString() : data?.detectedAt,
            newSession: {
                ...data?.newSession,
                loginTime: data?.newSession?.loginTime?.toDate ? 
                    data.newSession.loginTime.toDate().toISOString() : 
                    (data?.newSession?.loginTime ? new Date(data.newSession.loginTime).toISOString() : null)
            },
            existingSessions: data?.existingSessions?.map((session: any) => ({
                ...session,
                loginTime: session.loginTime?.toDate ? 
                    session.loginTime.toDate().toISOString() : 
                    (session.loginTime ? new Date(session.loginTime).toISOString() : null),
                lastActivity: session.lastActivity?.toDate ? 
                    session.lastActivity.toDate().toISOString() : 
                    (session.lastActivity ? new Date(session.lastActivity).toISOString() : null)
            })) || [],
            overlapDuration: data?.overlapDuration || 0,
            totalConcurrentSessions: data?.totalConcurrentSessions || 0
        };

        return NextResponse.json({ record });
    } catch (error: any) {
        console.error('Error fetching concurrent login details:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch concurrent login details' },
            { status: 500 }
        );
    }
}

// Delete concurrent login record
export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
        
        if (!id) {
            return NextResponse.json(
                { error: 'Record ID is required' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const docRef = adminDb.collection('concurrent_logins').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json(
                { error: 'Record not found' },
                { status: 404 }
            );
        }

        await docRef.delete();

        return NextResponse.json({ success: true, message: 'Record deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting concurrent login record:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete concurrent login record' },
            { status: 500 }
        );
    }
}

