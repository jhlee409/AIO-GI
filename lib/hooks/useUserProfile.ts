/**
 * User Profile Hook
 * 사용자 프로필 정보를 로드하고 관리하는 hook
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { fetchSharedUserInfo } from '@/lib/client-user-info';

export interface UserInfo {
    position: string;
    isInstructor: boolean;
    isAdmin: boolean;
    hospital: string;
    name?: string;
}

export interface UseUserProfileReturn {
    userInfo: UserInfo | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
    const { user, role, loading: authLoading } = useAuth();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadUserInfo = async () => {
        if (!user?.email) {
            setUserInfo(null);
            setLoading(false);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const encodedEmail = encodeURIComponent(user.email);
            const [response, instructorResponse] = await Promise.all([
                fetchSharedUserInfo(`/api/user/profile?email=${encodedEmail}`),
                fetchSharedUserInfo(`/api/user/instructor-status?email=${encodedEmail}`),
            ]);
            if (!response.ok) {
                throw new Error('프로필 정보를 불러오는데 실패했습니다.');
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('예상치 못한 응답 형식입니다.');
            }

            const profileData = await response.json();
            
            // 강사 상태 확인
            let instructorData = { isInstructor: false };
            
            if (instructorResponse.ok) {
                const instructorContentType = instructorResponse.headers.get('content-type');
                if (instructorContentType && instructorContentType.includes('application/json')) {
                    instructorData = await instructorResponse.json();
                }
            }

            setUserInfo({
                position: profileData.position || '',
                isInstructor: instructorData.isInstructor || false,
                isAdmin: role === 'admin',
                hospital: profileData.hospital || '',
                name: profileData.name || profileData.이름 || '',
            });
        } catch (err) {
            const error = err instanceof Error ? err : new Error('사용자 정보를 불러오는 중 오류가 발생했습니다.');
            setError(error);
            console.error('Error loading user info:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            loadUserInfo();
        }
    }, [user?.email, role, authLoading]);

    return {
        userInfo,
        loading: loading || authLoading,
        error,
        refetch: loadUserInfo,
    };
}
