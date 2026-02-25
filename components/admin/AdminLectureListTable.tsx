/**
 * Admin Lecture List Table Component
 * Display lecture list items with delete functionality
 */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface AdminLectureListTableProps {
    items: any[];
    onItemsChange?: (items: any[]) => void;
}

type SortDirection = 'asc' | 'desc' | null;

const STORAGE_KEY = 'lectureListSortDirection';

export default function AdminLectureListTable({ items, onItemsChange }: AdminLectureListTableProps) {
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    
    // Load sort direction from localStorage on mount, default to 'asc' for 순서 field
    const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'asc' || saved === 'desc') {
                return saved;
            }
        }
        return 'asc'; // Default to ascending for 순서 field
    });

    // Save sort direction to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sortDirection === null) {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, sortDirection);
            }
        }
    }, [sortDirection]);

    if (items.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                엑셀 파일을 업로드하여 Lecture List를 등록해주세요.
            </div>
        );
    }

    // Get all column names from the first item object, excluding internal fields
    const columns = Object.keys(items[0]).filter(key => key !== '_id' && key !== 'id');

    // Find 순서 field name (순서 or 순번 or order)
    const orderFieldName = columns.find(col => 
        col === '순서' || col === '순번' || col.toLowerCase() === 'order' || col.toLowerCase() === 'sequence'
    ) || null;

    // Sort items based on order field
    const sortedItems = useMemo(() => {
        if (!orderFieldName || sortDirection === null) {
            return items;
        }

        return [...items].sort((a, b) => {
            const valueA = a[orderFieldName];
            const valueB = b[orderFieldName];
            
            // Try to parse as number first
            const numA = typeof valueA === 'number' ? valueA : (typeof valueA === 'string' ? parseFloat(valueA) : 0);
            const numB = typeof valueB === 'number' ? valueB : (typeof valueB === 'string' ? parseFloat(valueB) : 0);
            
            // If both are valid numbers, compare numerically
            if (!isNaN(numA) && !isNaN(numB)) {
                const comparison = numA - numB;
                return sortDirection === 'asc' ? comparison : -comparison;
            }
            
            // Otherwise, compare as strings
            const strA = String(valueA || '').trim();
            const strB = String(valueB || '').trim();
            const comparison = strA.localeCompare(strB, 'ko');
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [items, orderFieldName, sortDirection]);

    // Handle order column header click
    const handleOrderHeaderClick = () => {
        if (sortDirection === null || sortDirection === 'desc') {
            setSortDirection('asc');
        } else {
            setSortDirection('desc');
        }
    };

    // Toggle individual item selection
    const toggleItemSelection = (index: number) => {
        const newSelected = new Set(selectedIndices);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedIndices(newSelected);
    };

    // Toggle all items selection
    const toggleAllSelection = () => {
        if (selectedIndices.size === sortedItems.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(sortedItems.map((_, index) => index)));
        }
    };

    // Delete single item
    const handleDeleteItem = async (index: number) => {
        if (!confirm('이 항목을 삭제하시겠습니까?')) return;

        const itemToDelete = sortedItems[index];
        const itemId = itemToDelete._id || itemToDelete.id;

        if (itemId) {
            try {
                const response = await fetch('/api/admin/lecture-list', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ itemId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to delete item');
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('항목 삭제 중 오류가 발생했습니다.');
                return;
            }
        }

        // Find the original index in items array
        const originalIndex = items.findIndex(item => 
            (item._id || item.id) === (itemToDelete._id || itemToDelete.id)
        );
        
        const newItems = items.filter((_, i) => i !== originalIndex);
        onItemsChange?.(newItems);

        // Update selected indices - need to recalculate based on sortedItems
        const newSelected = new Set<number>();
        selectedIndices.forEach(i => {
            if (i !== index) {
                // Find new index in sorted array after deletion
                const item = sortedItems[i];
                const newIndex = newItems.findIndex(newItem => 
                    (newItem._id || newItem.id) === (item._id || item.id)
                );
                if (newIndex >= 0) {
                    // Need to find position in new sorted array
                    // For simplicity, just clear and let user reselect
                }
            }
        });
        setSelectedIndices(new Set());
    };

    // Delete selected items
    const handleDeleteSelected = async () => {
        if (selectedIndices.size === 0) {
            alert('삭제할 항목을 선택해주세요.');
            return;
        }

        if (!confirm(`선택한 ${selectedIndices.size}개의 항목을 삭제하시겠습니까?`)) return;

        const itemIds = Array.from(selectedIndices).map(index => {
            const item = sortedItems[index];
            return item._id || item.id;
        }).filter(id => id);

        if (itemIds.length > 0) {
            try {
                const response = await fetch('/api/admin/lecture-list/batch-delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ itemIds }),
                });

                if (!response.ok) {
                    throw new Error('Failed to delete items');
                }
            } catch (error) {
                console.error('Error deleting items:', error);
                alert('항목 삭제 중 오류가 발생했습니다.');
                return;
            }
        }

        // Get IDs to delete
        const idsToDelete = new Set(itemIds);
        const newItems = items.filter(item => {
            const itemId = item._id || item.id;
            return !idsToDelete.has(itemId);
        });
        onItemsChange?.(newItems);
        setSelectedIndices(new Set());
    };

    return (
        <div className="overflow-x-auto">
            {selectedIndices.size > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between">
                    <span className="text-blue-700 font-medium">
                        {selectedIndices.size}개 항목 선택됨
                    </span>
                    <button
                        onClick={handleDeleteSelected}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>선택 삭제</span>
                    </button>
                </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left">
                            <input
                                type="checkbox"
                                checked={selectedIndices.size === sortedItems.length && sortedItems.length > 0}
                                onChange={toggleAllSelection}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </th>
                        {columns.map((column) => (
                            <th
                                key={column}
                                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                    column === orderFieldName ? 'cursor-pointer hover:bg-gray-100' : ''
                                }`}
                                onClick={column === orderFieldName ? handleOrderHeaderClick : undefined}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>{column}</span>
                                    {column === orderFieldName && sortDirection && (
                                        sortDirection === 'asc' ? (
                                            <ArrowUp className="w-4 h-4" />
                                        ) : (
                                            <ArrowDown className="w-4 h-4" />
                                        )
                                    )}
                                </div>
                            </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            작업
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedIndices.has(index)}
                                    onChange={() => toggleItemSelection(index)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </td>
                            {columns.map((column) => (
                                <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item[column] !== undefined && item[column] !== null 
                                        ? String(item[column]) 
                                        : ''}
                                </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                    onClick={() => handleDeleteItem(index)}
                                    className="text-red-600 hover:text-red-900 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

