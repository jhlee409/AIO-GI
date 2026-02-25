/**
 * API Route: Get Filtered Users
 * Gets users from users collection filtered by hospital, position, and name
 * Excludes admin users
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * Admin email check
 * Uses isAdminEmail from lib/auth-server.ts for consistency
 */
import { isAdminEmail } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
    try {
        const { hospitals, positions, name } = await request.json();

        // Get all users (try users collection first, fallback to patients for backward compatibility)
        const adminDb = getAdminDb();
        let snapshot = await adminDb.collection('users').get();

        // If users collection is empty, try patients collection
        if (snapshot.empty) {
            snapshot = await adminDb.collection('patients').get();
        }
        let users: any[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filter by hospitals
        if (hospitals && Array.isArray(hospitals) && hospitals.length > 0) {
            users = users.filter(user => {
                const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
                return hospital && hospitals.includes(hospital);
            });
        }

        // Filter by positions
        if (positions && Array.isArray(positions) && positions.length > 0) {
            users = users.filter(user => {
                const position = String(user['직위'] || user['position'] || '').trim();
                return position && positions.includes(position);
            });
        }

        // Filter by name
        if (name && typeof name === 'string' && name.trim()) {
            const nameLower = name.trim().toLowerCase();
            users = users.filter(user => {
                const userName = (user['이름'] || user['성명'] || user['name'] || '').toString().toLowerCase();
                return userName.includes(nameLower);
            });
        }

        // Exclude admin users
        const filteredUsers = [];
        for (const user of users) {
            const email = user['이메일'] || user['email'] || user['Email'] || user['EMAIL'] || '';
            if (email) {
                const isAdmin = await isAdminEmail(email);
                if (!isAdmin) {
                    filteredUsers.push(user);
                }
            }
        }
        users = filteredUsers;

        // Sort by hospital, then by name
        users.sort((a, b) => {
            const hospitalA = String(a['병원'] || a['병원명'] || '').trim();
            const hospitalB = String(b['병원'] || b['병원명'] || '').trim();
            const hospitalCompare = hospitalA.localeCompare(hospitalB, 'ko');
            if (hospitalCompare !== 0) return hospitalCompare;

            const nameA = String(a['이름'] || a['성명'] || '').trim();
            const nameB = String(b['이름'] || b['성명'] || '').trim();
            return nameA.localeCompare(nameB, 'ko');
        });

        // Return full user data (including password for auth-push)
        // Note: This is used for admin operations, so including password is acceptable
        return NextResponse.json({
            users: users.map(user => ({
                id: user.id,
                ...user, // Include all fields including password
            }))
        });
    } catch (error: any) {
        console.error('Error fetching filtered users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch filtered users' },
            { status: 500 }
        );
    }
}

