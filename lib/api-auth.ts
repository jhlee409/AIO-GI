import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { isAdminEmail } from '@/lib/auth-server';

export interface ApiUser {
    uid: string;
    email: string;
}

export interface InstructorUser extends ApiUser {
    isAdmin: boolean;
    hospital: string;
}

const unauthorized = () => NextResponse.json({ error: 'Authentication required' }, { status: 401 });
const forbidden = () => NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

export async function requireUser(request: NextRequest, bodyToken?: string | null): Promise<ApiUser | NextResponse> {
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] || bodyToken;
    if (!token) return unauthorized();
    try {
        const decoded = await getAdminAuth().verifyIdToken(token);
        if (!decoded.email) return unauthorized();
        return { uid: decoded.uid, email: decoded.email.trim() };
    } catch {
        return unauthorized();
    }
}

export async function requireAdmin(request: NextRequest): Promise<ApiUser | NextResponse> {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;
    return await isAdminEmail(user.email) ? user : forbidden();
}

export async function requireInstructor(request: NextRequest): Promise<InstructorUser | NextResponse> {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;
    if (await isAdminEmail(user.email)) return { ...user, isAdmin: true, hospital: '' };

    const db = getAdminDb();
    const emailCandidates = [...new Set([user.email, user.email.toLowerCase()])];
    for (const collection of ['users', 'patients']) {
        for (const field of ['이메일', 'email', 'Email', 'EMAIL']) {
            for (const email of emailCandidates) {
                const snapshot = await db.collection(collection).where(field, '==', email).limit(1).get();
                if (snapshot.empty) continue;
                const data = snapshot.docs[0].data();
                if (data['교육자'] !== 'yes' && data['instructor'] !== 'yes') return forbidden();
                const hospital = String(data['병원'] || data['병원명'] || data['hospital'] || '').trim();
                if (!hospital) return NextResponse.json({ error: 'Hospital information is required' }, { status: 403 });
                return { ...user, isAdmin: false, hospital };
            }
        }
    }
    return forbidden();
}
