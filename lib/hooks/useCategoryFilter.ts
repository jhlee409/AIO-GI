/**
 * Category Filter Hook
 * 사용자 권한에 따라 카테고리를 필터링하는 hook
 */
import { useMemo } from 'react';
import { UserInfo } from './useUserProfile';

export interface Category {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    order: number;
}

export function useCategoryFilter(
    allCategories: Category[],
    userInfo: UserInfo | null,
    loading: boolean
): Category[] {
    return useMemo(() => {
        if (loading) {
            return [];
        }

        if (!userInfo) {
            // 로그인하지 않은 경우 모든 카테고리 표시
            return allCategories;
        }

        const position = userInfo.position;
        let filteredCategories = allCategories;

        // 직위 기반 필터링
        if (position === 'R3') {
            // R3: Basic course, CPX only
            filteredCategories = filteredCategories.filter(
                cat => cat.id === 'basic' || cat.id === 'cpx'
            );
        } else if (position === 'F1') {
            // F1: Basic course, Advanced course for F1, CPX
            filteredCategories = filteredCategories.filter(
                cat => cat.id === 'basic' || cat.id === 'advanced-f1' || cat.id === 'cpx'
            );
        } else if (['F2', 'F2C', 'F2D', 'FCD'].includes(position?.toUpperCase() || '')) {
            filteredCategories = filteredCategories.filter(
                cat => cat.id === 'basic' || cat.id === 'advanced-f1' || cat.id === 'advanced' || cat.id === 'cpx'
            );
        }

        // 정렬
        return filteredCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [allCategories, userInfo, loading]);
}
