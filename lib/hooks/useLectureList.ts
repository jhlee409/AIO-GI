/**
 * Lecture List Hook
 * 강의 목록을 관리하는 hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export interface LectureItem {
    _id?: string;
    id?: string;
    [key: string]: any;
}

export interface UseLectureListReturn {
    items: LectureItem[];
    loading: boolean;
    error: Error | null;
    loadItems: () => Promise<void>;
    saveItems: (items: any[]) => Promise<{ added: number }>;
}

export function useLectureList(): UseLectureListReturn {
    const [items, setItems] = useState<LectureItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const loadApi = useApi<{ items: LectureItem[] }>();
    const saveApi = useApi<{ success: boolean; added: number; total: number }>();

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await loadApi.call('/api/admin/lecture-list');
            
            // Store id as _id for deletion
            const itemsWithId = data.items.map((item: any) => {
                const { id, createdAt, updatedAt, ...itemData } = item;
                return { ...itemData, _id: id };
            });
            
            setItems(itemsWithId);
        } catch (err) {
            const error = err instanceof Error 
                ? err 
                : new Error('강의 목록을 불러오는데 실패했습니다.');
            setError(error);
            console.error('Error loading lecture list:', error);
        } finally {
            setLoading(false);
        }
    }, [loadApi]);

    const saveItems = useCallback(async (items: any[]): Promise<{ added: number }> => {
        try {
            setLoading(true);
            setError(null);
            const result = await saveApi.call('/api/admin/lecture-list', {
                method: 'POST',
                body: JSON.stringify({ items }),
            });
            
            // Reload items after save
            await loadItems();
            
            return { added: result.added };
        } catch (err) {
            const error = err instanceof Error 
                ? err 
                : new Error('강의 목록을 저장하는데 실패했습니다.');
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [saveApi, loadItems]);

    useEffect(() => {
        loadItems();
    }, []);

    return {
        items,
        loading: loading || loadApi.loading || saveApi.loading,
        error: error || loadApi.error || saveApi.error,
        loadItems,
        saveItems,
    };
}
