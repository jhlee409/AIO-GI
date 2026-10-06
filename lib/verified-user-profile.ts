import { getAdminDb } from '@/lib/firebase-admin';

export interface VerifiedUserProfile {
    position: string;
    name: string;
    hospital: string;
}

export async function getVerifiedUserProfile(email: string): Promise<VerifiedUserProfile | null> {
    const db = getAdminDb();
    for (const collection of ['users', 'patients']) {
        for (const field of ['이메일', 'email']) {
            const snapshot = await db.collection(collection).where(field, '==', email).limit(1).get();
            if (snapshot.empty) continue;
            const data = snapshot.docs[0].data();
            return {
                position: String(data['직위'] || data['position'] || '').trim(),
                name: String(data['이름'] || data['name'] || '').trim(),
                hospital: String(data['병원'] || data['병원명'] || data['hospital'] || '').trim(),
            };
        }
    }
    return null;
}
