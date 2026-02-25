/**
 * Excel File Processor Hook
 * Excel 파일을 읽고 처리하는 재사용 가능한 hook
 */
import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

export interface UseExcelFileProcessorOptions {
    onSuccess?: (data: any[]) => void;
    onError?: (error: Error) => void;
    sheetName?: string | ((sheetNames: string[]) => string);
}

export interface UseExcelFileProcessorReturn {
    processFile: (file: File) => Promise<any[]>;
    processing: boolean;
    error: Error | null;
}

export function useExcelFileProcessor(
    options: UseExcelFileProcessorOptions = {}
): UseExcelFileProcessorReturn {
    const { onSuccess, onError, sheetName } = options;
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const processFile = useCallback(async (file: File): Promise<any[]> => {
        setProcessing(true);
        setError(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);

            // 시트 이름 결정
            let targetSheetName: string;
            if (typeof sheetName === 'function') {
                targetSheetName = sheetName(workbook.SheetNames);
            } else if (typeof sheetName === 'string') {
                targetSheetName = sheetName;
            } else {
                // 기본: "lecture list" 포함된 시트 찾기 (대소문자 무시)
                targetSheetName = workbook.SheetNames.find(
                    name => name.toLowerCase().includes('lecture list') || 
                            name.toLowerCase().includes('lecturelist')
                ) || workbook.SheetNames[0];
            }

            const worksheet = workbook.Sheets[targetSheetName];
            if (!worksheet) {
                throw new Error(`시트 "${targetSheetName}"를 찾을 수 없습니다.`);
            }

            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            onSuccess?.(jsonData);
            return jsonData;
        } catch (err) {
            const error = err instanceof Error 
                ? err 
                : new Error('Excel 파일을 읽는 중 오류가 발생했습니다.');
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setProcessing(false);
        }
    }, [onSuccess, onError, sheetName]);

    return {
        processFile,
        processing,
        error,
    };
}
