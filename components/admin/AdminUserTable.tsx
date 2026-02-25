/**
 * Admin User Table Component
 * Display users from Excel file with dynamic columns and delete functionality
 */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const PROTECTED_EMAIL = 'jhlee409@gmail.com';

interface AdminUserTableProps {
    users: any[];
    onUsersChange?: (users: any[]) => void;
    currentUserEmail?: string;
}

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'hospital' | 'year' | 'name' | null;

const STORAGE_KEY_SORT_FIELD = 'userTableSortField';
const STORAGE_KEY_SORT_DIRECTION = 'userTableSortDirection';

export default function AdminUserTable({ users, onUsersChange, currentUserEmail }: AdminUserTableProps) {
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    
    // Load sort state from localStorage on mount
    const [sortField, setSortField] = useState<SortField>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY_SORT_FIELD);
            if (saved === 'hospital' || saved === 'year' || saved === 'name') {
                return saved;
            }
        }
        return null;
    });

    const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY_SORT_DIRECTION);
            if (saved === 'asc' || saved === 'desc') {
                return saved;
            }
        }
        return null;
    });

    // Save sort state to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sortField === null) {
                localStorage.removeItem(STORAGE_KEY_SORT_FIELD);
            } else {
                localStorage.setItem(STORAGE_KEY_SORT_FIELD, sortField);
            }
            if (sortDirection === null) {
                localStorage.removeItem(STORAGE_KEY_SORT_DIRECTION);
            } else {
                localStorage.setItem(STORAGE_KEY_SORT_DIRECTION, sortDirection);
            }
        }
    }, [sortField, sortDirection]);

    const getUserEmail = (user: any): string => {
        return String(user['이메일'] || user['email'] || user['Email'] || user['EMAIL'] || '').toLowerCase().trim();
    };

    const isProtectedUser = (user: any): boolean => {
        return getUserEmail(user) === PROTECTED_EMAIL.toLowerCase() &&
            currentUserEmail?.toLowerCase() !== PROTECTED_EMAIL.toLowerCase();
    };

    // Get all column names from the first user object, excluding internal fields
    // Handle empty users array
    const columns = users.length > 0 ? Object.keys(users[0]).filter(key => key !== '_id' && key !== 'createdAt' && key !== '중도퇴사' && key !== '중도 퇴사' && key !== '원외출신' && key !== '원외 출신') : [];

    // Find field names
    const hospitalFieldName = columns.find(col => col === '병원' || col === '병원명') || null;
    const yearFieldName = columns.find(col => col === '년도' || col === '연도' || col === 'year' || col === 'Year') || null;
    const nameFieldName = columns.find(col => col === '이름' || col === '성명' || col === 'name' || col === 'Name') || null;

    // Sort users based on selected field
    const sortedUsers = useMemo(() => {
        if (users.length === 0) {
            return [];
        }
        
        if (sortField === null || sortDirection === null) {
            return users;
        }

        return [...users].sort((a, b) => {
            let comparison = 0;

            if (sortField === 'hospital' && hospitalFieldName) {
                const valueA = String(a[hospitalFieldName] || '').trim();
                const valueB = String(b[hospitalFieldName] || '').trim();
                comparison = valueA.localeCompare(valueB, 'ko');
            } else if (sortField === 'year' && yearFieldName) {
                // 숫자로 변환 시도, 실패하면 문자열 비교
                const valueA = a[yearFieldName];
                const valueB = b[yearFieldName];
                const numA = typeof valueA === 'number' ? valueA : (typeof valueA === 'string' ? parseInt(valueA) || 0 : 0);
                const numB = typeof valueB === 'number' ? valueB : (typeof valueB === 'string' ? parseInt(valueB) || 0 : 0);
                comparison = numA - numB;
            } else if (sortField === 'name' && nameFieldName) {
                const valueA = String(a[nameFieldName] || '').trim();
                const valueB = String(b[nameFieldName] || '').trim();
                comparison = valueA.localeCompare(valueB, 'ko');
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [users, sortField, sortDirection, hospitalFieldName, yearFieldName, nameFieldName]);

    if (users.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                엑셀 파일을 업로드하여 사용자를 등록해주세요.
            </div>
        );
    }

    // Handle column header click
    const handleHeaderClick = (field: SortField) => {
        if (sortField === field) {
            // Same field: toggle direction
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                // Reset to no sort
                setSortField(null);
                setSortDirection(null);
            } else {
                setSortDirection('asc');
            }
        } else {
            // Different field: set new field and start with asc
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Toggle individual user selection
    const toggleUserSelection = (index: number) => {
        const newSelected = new Set(selectedIndices);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedIndices(newSelected);
    };

    // Toggle all users selection
    const toggleAllSelection = () => {
        if (selectedIndices.size === sortedUsers.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(sortedUsers.map((_, index) => index)));
        }
    };

    // Delete single user
    const handleDeleteUser = async (index: number) => {
        const userToDelete = sortedUsers[index];

        if (isProtectedUser(userToDelete)) {
            alert('이 사용자는 jhlee409@gmail.com 계정으로 로그인한 경우에만 삭제할 수 있습니다.');
            return;
        }

        if (!confirm('이 사용자를 삭제하시겠습니까?')) return;
        const userId = userToDelete._id;

        // If user has an ID, delete from Firestore
        if (userId) {
            try {
                const response = await fetch('/api/admin/patients', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to delete user');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('사용자 삭제 중 오류가 발생했습니다.');
                return;
            }
        }

        const newUsers = sortedUsers.filter((_, i) => i !== index);
        onUsersChange?.(newUsers);

        // Update selected indices
        const newSelected = new Set<number>();
        selectedIndices.forEach(i => {
            if (i < index) newSelected.add(i);
            else if (i > index) newSelected.add(i - 1);
        });
        setSelectedIndices(newSelected);
    };

    // Delete selected users
    const handleDeleteSelected = async () => {
        if (selectedIndices.size === 0) {
            alert('삭제할 사용자를 선택해주세요.');
            return;
        }

        const hasProtected = Array.from(selectedIndices).some(i => isProtectedUser(sortedUsers[i]));
        if (hasProtected) {
            alert('선택된 사용자 중 jhlee409@gmail.com이 포함되어 있습니다.\n이 사용자는 jhlee409@gmail.com 계정으로 로그인한 경우에만 삭제할 수 있습니다.');
            return;
        }

        if (!confirm(`선택한 ${selectedIndices.size}명의 사용자를 삭제하시겠습니까?`)) return;

        // Get user IDs to delete
        const userIds: string[] = [];
        const indicesToDelete = Array.from(selectedIndices);
        
        indicesToDelete.forEach(index => {
            const user = sortedUsers[index];
            if (user._id) {
                userIds.push(user._id);
            }
        });

        // Delete from Firestore if there are IDs
        if (userIds.length > 0) {
            try {
                const response = await fetch('/api/admin/patients/batch-delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userIds }),
                });

                if (!response.ok) {
                    throw new Error('Failed to delete users');
                }
            } catch (error) {
                console.error('Error deleting users:', error);
                alert('사용자 삭제 중 오류가 발생했습니다.');
                return;
            }
        }

        const newUsers = sortedUsers.filter((_, index) => !selectedIndices.has(index));
        onUsersChange?.(newUsers);
        setSelectedIndices(new Set());
    };

    const allSelected = selectedIndices.size === sortedUsers.length && sortedUsers.length > 0;
    const someSelected = selectedIndices.size > 0 && selectedIndices.size < sortedUsers.length;

    return (
        <div>
            {/* Bulk delete button - will be shown in parent component */}
            {selectedIndices.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                        {selectedIndices.size}명 선택됨
                    </span>
                    <button
                        onClick={handleDeleteSelected}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>선택 삭제</span>
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={input => {
                                        if (input) {
                                            input.indeterminate = someSelected;
                                        }
                                    }}
                                    onChange={toggleAllSelection}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                            </th>
                            {columns.map((column) => {
                                const isHospitalColumn = column === hospitalFieldName;
                                const isYearColumn = column === yearFieldName;
                                const isNameColumn = column === nameFieldName;
                                const isSortable = isHospitalColumn || isYearColumn || isNameColumn;
                                
                                let currentSortField: SortField = null;
                                if (isHospitalColumn) currentSortField = 'hospital';
                                else if (isYearColumn) currentSortField = 'year';
                                else if (isNameColumn) currentSortField = 'name';
                                
                                const isActiveSort = sortField === currentSortField && sortDirection !== null;
                                
                                return (
                                    <th
                                        key={column}
                                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                            isSortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                                        }`}
                                        onClick={isSortable ? () => handleHeaderClick(currentSortField) : undefined}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>{column}</span>
                                            {isActiveSort && (
                                                sortDirection === 'asc' ? (
                                                    <ArrowUp className="w-4 h-4 inline" />
                                                ) : (
                                                    <ArrowDown className="w-4 h-4 inline" />
                                                )
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                작업
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedUsers.map((user, index) => (
                            <tr
                                key={index}
                                className={`hover:bg-gray-50 ${selectedIndices.has(index) ? 'bg-blue-50' : ''}`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedIndices.has(index)}
                                        onChange={() => toggleUserSelection(index)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {index + 1}
                                </td>
                                {columns.map((column) => (
                                    <td
                                        key={column}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        {user[column] !== null && user[column] !== undefined
                                            ? String(user[column])
                                            : '-'}
                                    </td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {isProtectedUser(user) ? (
                                        <span className="text-gray-300 cursor-not-allowed" title="jhlee409@gmail.com만 삭제 가능">
                                            <Trash2 className="w-5 h-5" />
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleDeleteUser(index)}
                                            className="text-red-600 hover:text-red-900"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
