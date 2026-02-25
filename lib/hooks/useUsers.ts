/**
 * Users Management Hook
 * 사용자 목록을 관리하는 hook
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from './useApi';

export interface User {
    _id?: string;
    id?: string;
    [key: string]: any;
}

export interface UseUsersReturn {
    users: User[];
    loading: boolean;
    error: Error | null;
    loadUsers: () => Promise<void>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredUsers: User[];
}

/**
 * 사용자 정렬 함수: 병원, 직위, 이름 순으로 오름차순 정렬
 */
function sortUsers(users: User[]): User[] {
    return [...users].sort((a, b) => {
        // 1. 병원 정렬
        const hospitalA = String(a['병원'] || a['병원명'] || '').trim();
        const hospitalB = String(b['병원'] || b['병원명'] || '').trim();
        if (hospitalA !== hospitalB) {
            return hospitalA.localeCompare(hospitalB, 'ko');
        }

        // 2. 직위 정렬
        const positionA = String(a['직위'] || a['직책'] || '').trim();
        const positionB = String(b['직위'] || b['직책'] || '').trim();
        if (positionA !== positionB) {
            return positionA.localeCompare(positionB, 'ko');
        }

        // 3. 이름 정렬
        const nameA = String(a['이름'] || a['성명'] || '').trim();
        const nameB = String(b['이름'] || b['성명'] || '').trim();
        return nameA.localeCompare(nameB, 'ko');
    });
}

export function useUsers(): UseUsersReturn {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const api = useApi<{ users: User[] }>();

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.call('/api/admin/patients');
            
            // Remove Firestore metadata fields for display
            let usersData = data.users.map((user: any) => {
                const { id, createdAt, updatedAt, ...userData } = user;
                return { ...userData, _id: id };
            });

            // Sort users: 병원, 직위, 이름 순으로 오름차순
            usersData = sortUsers(usersData);
            setUsers(usersData);
        } catch (err) {
            const error = err instanceof Error 
                ? err 
                : new Error('사용자 목록을 불러오는데 실패했습니다.');
            setError(error);
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    }, [api]);

    // 검색어로 필터링된 사용자 목록
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) {
            return users;
        }

        const query = searchQuery.toLowerCase();
        return users.filter(user => {
            const name = String(user['이름'] || user['성명'] || '').toLowerCase();
            const email = String(user['이메일'] || user['email'] || '').toLowerCase();
            const hospital = String(user['병원'] || user['병원명'] || '').toLowerCase();
            const position = String(user['직위'] || user['직책'] || '').toLowerCase();

            return name.includes(query) || 
                   email.includes(query) || 
                   hospital.includes(query) || 
                   position.includes(query);
        });
    }, [users, searchQuery]);

    useEffect(() => {
        loadUsers();
    }, []);

    return {
        users,
        loading: loading || api.loading,
        error: error || api.error,
        loadUsers,
        searchQuery,
        setSearchQuery,
        filteredUsers,
    };
}
