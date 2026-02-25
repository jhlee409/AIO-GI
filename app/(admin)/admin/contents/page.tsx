/**
 * Admin Lecture List Page
 * Upload Excel file and display lecture list
 */
'use client';

import { Upload } from 'lucide-react';
import AdminLectureListTable from '@/components/admin/AdminLectureListTable';
import { useLectureList } from '@/lib/hooks/useLectureList';
import { useExcelFileProcessor } from '@/lib/hooks/useExcelFileProcessor';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export default function AdminContentsPage() {
    const { items, loading, error, loadItems, saveItems } = useLectureList();
    const { processFile, processing } = useExcelFileProcessor({
        onSuccess: async (jsonData) => {
            try {
                const result = await saveItems(jsonData);
                if (result.added > 0) {
                    alert(`${result.added}개의 항목이 등록되었습니다.`);
                } else {
                    alert('모든 항목이 이미 등록되어 있습니다.');
                }
            } catch (error) {
                alert('엑셀 파일을 저장하는 중 오류가 발생했습니다.');
            }
        },
        onError: (error) => {
            alert(`엑셀 파일을 읽는 중 오류가 발생했습니다: ${error.message}`);
        },
    });

    const handleItemsChange = async (updatedItems: any[]) => {
        // Reload from Firestore to ensure consistency
        await loadItems();
    };

    const handleUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                processFile(file);
            }
        };
        input.click();
    };

    if (loading) {
        return <LoadingSpinner size="lg" message="로딩 중..." className="min-h-[400px]" />;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Lecture List 관리</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleUploadClick}
                        disabled={processing}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-400 transition font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:bg-blue-200 disabled:text-blue-400 disabled:cursor-not-allowed"
                    >
                        <Upload className="w-5 h-5" />
                        <span>{processing ? '업로드 중...' : '+ Lecture List 업로드'}</span>
                    </button>
                    <span className="text-gray-600 text-sm whitespace-nowrap">
                        현재 등록된 강의: <strong className="text-gray-900">{items.length}</strong>개
                    </span>
                </div>
            </div>

            {error && <ErrorMessage error={error} className="mb-4" />}

            <div className="bg-white rounded-lg shadow">
                <AdminLectureListTable items={items} onItemsChange={handleItemsChange} />
            </div>
        </div>
    );
}
