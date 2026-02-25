/**
 * Instructor Utilities
 * 공통 메일 수신자 조회 로직
 * 기준: 해당 병원의 사용자 중 '메일수신' 필드가 'yes'인 사용자
 */
import { getAdminDb } from '@/lib/firebase-admin';

export interface InstructorInfo {
    email: string;
    name: string;
}

/**
 * 병원명으로 메일 수신 대상자 조회
 * '메일수신' 필드가 'yes'인 해당 병원 사용자만 반환
 * @param hospital 병원명
 * @returns 수신자 이메일과 이름 배열
 */
export async function findAllInstructorsByHospital(
    hospital: string
): Promise<InstructorInfo[]> {
    const adminDb = getAdminDb();
    const recipients: InstructorInfo[] = [];
    const seenEmails = new Set<string>();
    
    try {
        console.log(`[findAllInstructorsByHospital] Searching for mail recipients (메일수신=yes) in hospital: ${hospital}`);
        
        // users 컬렉션에서 확인 ('병원'과 '병원명' 필드 모두 검색)
        const usersQueries = [
            adminDb.collection('users').where('병원', '==', hospital).get(),
            adminDb.collection('users').where('병원명', '==', hospital).get()
        ];
        
        const usersSnapshots = await Promise.all(usersQueries);
        const allDocs = new Map<string, any>();
        
        for (const snapshot of usersSnapshots) {
            for (const doc of snapshot.docs) {
                if (!allDocs.has(doc.id)) {
                    allDocs.set(doc.id, doc);
                }
            }
        }

        // users 컬렉션이 비어 있으면 patients 컬렉션 폴백
        if (allDocs.size === 0) {
            const patientsQueries = [
                adminDb.collection('patients').where('병원', '==', hospital).get(),
                adminDb.collection('patients').where('병원명', '==', hospital).get()
            ];
            const patientsSnapshots = await Promise.all(patientsQueries);
            for (const snapshot of patientsSnapshots) {
                for (const doc of snapshot.docs) {
                    if (!allDocs.has(doc.id)) {
                        allDocs.set(doc.id, doc);
                    }
                }
            }
        }
        
        console.log(`[findAllInstructorsByHospital] Found ${allDocs.size} document(s) for hospital: ${hospital}`);

        for (const doc of allDocs.values()) {
            const userData = doc.data();
            const shouldReceiveMail = userData['메일수신'] === 'yes';
            
            if (shouldReceiveMail) {
                const email = (userData['이메일'] || userData['email'] || userData['Email'] || userData['EMAIL'] || '').trim().toLowerCase();
                const name = userData['이름'] || userData['성명'] || userData['name'] || '';
                
                if (email && !seenEmails.has(email)) {
                    seenEmails.add(email);
                    recipients.push({ email, name });
                    console.log(`[findAllInstructorsByHospital] Found mail recipient: ${email} (${name})`);
                }
            }
        }
        
        console.log(`[findAllInstructorsByHospital] Total found ${recipients.length} mail recipient(s) for hospital: ${hospital}`);
        console.log(`[findAllInstructorsByHospital] Recipient emails: ${recipients.map(r => r.email).join(', ')}`);
        return recipients;
    } catch (error) {
        console.error('Error finding mail recipients:', error);
        return [];
    }
}

