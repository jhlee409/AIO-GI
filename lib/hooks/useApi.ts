/**
 * Generic API Hook
 * API 호출을 위한 범용 hook
 */
import { useState, useCallback } from 'react';

export interface UseApiOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
}

export interface UseApiReturn<T> {
    call: (url: string, options?: RequestInit) => Promise<T>;
    loading: boolean;
    error: Error | null;
    data: T | null;
}

export function useApi<T = any>(options: UseApiOptions<T> = {}): UseApiReturn<T> {
    const { onSuccess, onError } = options;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<T | null>(null);

    const call = useCallback(async (url: string, requestOptions?: RequestInit): Promise<T> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url, {
                ...requestOptions,
                headers: {
                    'Content-Type': 'application/json',
                    ...requestOptions?.headers,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: `HTTP ${response.status}: ${response.statusText}`,
                }));
                throw new Error(errorData.error || `요청이 실패했습니다 (${response.status})`);
            }

            const contentType = response.headers.get('content-type');
            let result: T;

            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                result = text as unknown as T;
            }

            setData(result);
            onSuccess?.(result);
            return result;
        } catch (err) {
            const error = err instanceof Error 
                ? err 
                : new Error('API 호출 중 오류가 발생했습니다.');
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [onSuccess, onError]);

    return {
        call,
        loading,
        error,
        data,
    };
}
