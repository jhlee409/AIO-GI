/**
 * Video Loader Utility
 * 
 * 비디오 URL 로딩 로직을 통합 관리하는 유틸리티
 */

export interface LoadVideoOptions {
    storagePath: string;
    onSuccess?: (url: string) => void;
    onError?: (error: string) => void;
}

export async function loadVideoUrl(options: LoadVideoOptions): Promise<string | null> {
    const { storagePath, onSuccess, onError } = options;
    
    try {
        const response = await fetch(
            `/api/video-url?path=${encodeURIComponent(storagePath)}`
        );
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
                error: '동영상을 불러오는 중 오류가 발생했습니다.' 
            }));
            const errorMessage = errorData.error || '동영상을 불러오는 중 오류가 발생했습니다.';
            
            if (onError) {
                onError(errorMessage);
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (onSuccess) {
            onSuccess(data.url);
        }
        
        return data.url;
    } catch (error: any) {
        const errorMessage = error.message || '동영상을 불러오는 중 오류가 발생했습니다.';
        
        if (onError) {
            onError(errorMessage);
        }
        
        throw error;
    }
}

