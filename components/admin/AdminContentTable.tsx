/**
 * Admin Content Table Component
 * Displays content list with delete functionality
 */
'use client';

import { useState } from 'react';
import { MediaItem } from '@/types';
import { Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function AdminContentTable({ contents }: { contents: MediaItem[] }) {
    const [items, setItems] = useState(contents);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string, storagePath: string) => {
        if (!confirm('정말 이 컨텐츠를 삭제하시겠습니까?')) return;

        setDeleting(id);
        try {
            const response = await fetch('/api/admin/delete-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, storagePath }),
            });

            if (!response.ok) throw new Error('Failed to delete');

            setItems(items.filter((item) => item.id !== id));
            alert('삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('삭제에 실패했습니다.');
        } finally {
            setDeleting(null);
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'video': return '동영상';
            case 'document': return '문서';
            case 'image': return '이미지';
            default: return type;
        }
    };

    if (items.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                등록된 컨텐츠가 없습니다.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            제목
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            타입
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            카테고리
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            등록일
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            작업
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {getTypeLabel(item.type)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.createdAt.toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                    <Link
                                        href={`/contents/${item.id}`}
                                        className="text-blue-600 hover:text-blue-900"
                                        target="_blank"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(item.id, item.storagePath)}
                                        disabled={deleting === item.id}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
