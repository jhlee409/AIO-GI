/**
 * API Route: Check Instructors by Hospital
 * 특정 병원에 등록된 교육자 목록을 확인하는 임시 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { findAllInstructorsByHospital } from '@/lib/instructor-utils';
import { getAdminDb } from '@/lib/firebase-admin';
import { isAdminEmail } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const hospital = searchParams.get('hospital');
        const name = searchParams.get('name'); // 이름으로 검색

        // 이름으로 검색하는 경우
        if (name) {
            const adminDb = getAdminDb();
            let usersSnapshot = await adminDb.collection('users').get();
            
            if (usersSnapshot.empty) {
                usersSnapshot = await adminDb.collection('patients').get();
            }

            const matchingUsers = [];
            for (const doc of usersSnapshot.docs) {
                const userData = doc.data();
                const userName = (userData['이름'] || userData['성명'] || userData['name'] || '').toString().trim();
                const userHospital = String(userData['병원'] || userData['병원명'] || userData['hospital'] || '').trim();
                const email = (userData['이메일'] || userData['email'] || userData['Email'] || userData['EMAIL'] || '').trim();
                const isInstructor = userData['교육자'] === 'yes' || userData['instructor'] === 'yes';
                
                if (userName.includes(name)) {
                    const isAdmin = email ? await isAdminEmail(email) : false;
                    matchingUsers.push({
                        name: userName,
                        email: email,
                        hospital: userHospital,
                        isInstructor: isInstructor,
                        instructorField: userData['교육자'] || userData['instructor'],
                        isAdmin: isAdmin,
                        allFields: userData // 디버깅용
                    });
                }
            }

            return NextResponse.json({
                searchName: name,
                count: matchingUsers.length,
                users: matchingUsers
            });
        }

        // 병원으로 검색하는 경우
        if (!hospital) {
            return NextResponse.json(
                { error: 'hospital or name parameter is required' },
                { status: 400 }
            );
        }

        const instructors = await findAllInstructorsByHospital(hospital);

        return NextResponse.json({
            hospital,
            count: instructors.length,
            instructors: instructors.map(inst => ({
                name: inst.name,
                email: inst.email
            }))
        });
    } catch (error: any) {
        console.error('Error checking instructors:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check instructors' },
            { status: 500 }
        );
    }
}

