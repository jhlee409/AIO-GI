/**
 * User Management Page
 * Upload Excel file and display active users
 * Users are persisted in Firestore
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Upload, Send, Search, Trash2, Mail, X, Copy, AlertTriangle, Shield, UserPlus, UserMinus, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useAuth } from '@/components/AuthProvider';
import AdminUserTable from '@/components/admin/AdminUserTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ResultDialog from '@/components/admin/ResultDialog';

export default function AdminUsersPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [authPushLoading, setAuthPushLoading] = useState(false);
    const [showAuthDeletionConfirm, setShowAuthDeletionConfirm] = useState(false);
    const [authDeletionLoading, setAuthDeletionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    const [logDeleteLoading, setLogDeleteLoading] = useState(false);
    const [videoDeleteLoading, setVideoDeleteLoading] = useState(false);

    // Email feature state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedEmailUsers, setSelectedEmailUsers] = useState<Set<string>>(new Set());
    const [selectAllEmail, setSelectAllEmail] = useState(false);
    const [emailModalHospitals, setEmailModalHospitals] = useState<string[]>([]);
    const [emailModalPositions, setEmailModalPositions] = useState<string[]>([]);
    const [selectedEmailHospitals, setSelectedEmailHospitals] = useState<Set<string>>(new Set());
    const [selectedEmailPositions, setSelectedEmailPositions] = useState<Set<string>>(new Set());
    const [selectAllEmailHospitals, setSelectAllEmailHospitals] = useState(false);
    const [selectAllEmailPositions, setSelectAllEmailPositions] = useState(false);

    // Duplicate removal state
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateGroups, setDuplicateGroups] = useState<any[][]>([]);
    const [duplicateLoading, setDuplicateLoading] = useState(false);
    const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);

    // Auth deletion filter state
    const [showAuthDeletionModal, setShowAuthDeletionModal] = useState(false);
    const [filterHospitals, setFilterHospitals] = useState<string[]>([]);
    const [filterPositions, setFilterPositions] = useState<string[]>([]);
    const [selectedFilterHospitals, setSelectedFilterHospitals] = useState<Set<string>>(new Set());
    const [selectedFilterPositions, setSelectedFilterPositions] = useState<Set<string>>(new Set());
    const [filterNameInput, setFilterNameInput] = useState('');
    const [selectAllFilter, setSelectAllFilter] = useState(false);
    const [selectAllFilterHospitals, setSelectAllFilterHospitals] = useState(false);
    const [selectAllFilterPositions, setSelectAllFilterPositions] = useState(false);
    const [filteredUsersForDeletion, setFilteredUsersForDeletion] = useState<any[]>([]);
    const [loadingFilteredUsers, setLoadingFilteredUsers] = useState(false);

    // Auth push filter state
    const [showAuthPushModal, setShowAuthPushModal] = useState(false);
    const [pushFilterHospitals, setPushFilterHospitals] = useState<string[]>([]);
    const [pushFilterPositions, setPushFilterPositions] = useState<string[]>([]);
    const [selectedPushFilterHospitals, setSelectedPushFilterHospitals] = useState<Set<string>>(new Set());
    const [selectedPushFilterPositions, setSelectedPushFilterPositions] = useState<Set<string>>(new Set());
    const [pushFilterNameInput, setPushFilterNameInput] = useState('');
    const [selectAllPushFilter, setSelectAllPushFilter] = useState(false);
    const [selectAllPushFilterHospitals, setSelectAllPushFilterHospitals] = useState(false);
    const [selectAllPushFilterPositions, setSelectAllPushFilterPositions] = useState(false);
    const [filteredUsersForPush, setFilteredUsersForPush] = useState<any[]>([]);
    const [loadingFilteredUsersForPush, setLoadingFilteredUsersForPush] = useState(false);

    // Log deletion filter state
    const [showLogDeletionModal, setShowLogDeletionModal] = useState(false);
    const [logFilterHospitals, setLogFilterHospitals] = useState<string[]>([]);
    const [logFilterPositions, setLogFilterPositions] = useState<string[]>([]);
    const [selectedLogFilterHospitals, setSelectedLogFilterHospitals] = useState<Set<string>>(new Set());
    const [selectedLogFilterPositions, setSelectedLogFilterPositions] = useState<Set<string>>(new Set());
    const [logFilterNameInput, setLogFilterNameInput] = useState('');
    const [selectAllLogFilter, setSelectAllLogFilter] = useState(false);
    const [selectAllLogFilterHospitals, setSelectAllLogFilterHospitals] = useState(false);
    const [selectAllLogFilterPositions, setSelectAllLogFilterPositions] = useState(false);
    const [filteredUsersForLogDeletion, setFilteredUsersForLogDeletion] = useState<any[]>([]);
    const [loadingFilteredUsersForLogDeletion, setLoadingFilteredUsersForLogDeletion] = useState(false);

    // Video deletion filter state
    const [showVideoDeletionModal, setShowVideoDeletionModal] = useState(false);
    const [videoFilterHospitals, setVideoFilterHospitals] = useState<string[]>([]);
    const [videoFilterPositions, setVideoFilterPositions] = useState<string[]>([]);
    const [selectedVideoFilterHospitals, setSelectedVideoFilterHospitals] = useState<Set<string>>(new Set());
    const [selectedVideoFilterPositions, setSelectedVideoFilterPositions] = useState<Set<string>>(new Set());
    const [videoFilterNameInput, setVideoFilterNameInput] = useState('');
    const [selectAllVideoFilter, setSelectAllVideoFilter] = useState(false);
    const [selectAllVideoFilterHospitals, setSelectAllVideoFilterHospitals] = useState(false);
    const [selectAllVideoFilterPositions, setSelectAllVideoFilterPositions] = useState(false);
    const [filteredUsersForVideoDeletion, setFilteredUsersForVideoDeletion] = useState<any[]>([]);
    const [loadingFilteredUsersForVideoDeletion, setLoadingFilteredUsersForVideoDeletion] = useState(false);

    // Concurrent login report state
    const [showConcurrentLogins, setShowConcurrentLogins] = useState(false);
    const [concurrentLogins, setConcurrentLogins] = useState<any[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [loadingLogins, setLoadingLogins] = useState(false);
    const [hasAutoDeleted, setHasAutoDeleted] = useState(false);

    // Admin management state
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [admins, setAdmins] = useState<string[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [removingAdmin, setRemovingAdmin] = useState<string | null>(null);



    // Load users from Firestore on component mount
    useEffect(() => {
        loadUsers();
    }, []);

    // Auto-delete duplicates on page load (only once after initial load)
    useEffect(() => {
        if (users.length > 0 && !initialLoading && !hasAutoDeleted) {
            handleAutoDeleteDuplicates();
            setHasAutoDeleted(true);
        }
    }, [users.length, initialLoading, hasAutoDeleted]);

    // Auto-hide duplicate message after 5 seconds
    useEffect(() => {
        if (duplicateMessage) {
            const timer = setTimeout(() => {
                setDuplicateMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [duplicateMessage]);

    // Sort function: 병원, 직위, 이름 순으로 오름차순 정렬
    const sortUsers = (users: any[]) => {
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
    };

    const loadUsers = async () => {
        try {
            setInitialLoading(true);
            const response = await fetch('/api/admin/patients');
            if (!response.ok) {
                throw new Error('Failed to load users');
            }
            const data = await response.json();
            // Remove Firestore metadata fields for display, but keep createdAt for duplicate sorting
            let usersData = data.users.map((user: any) => {
                const { id, updatedAt, ...userData } = user;
                return { ...userData, _id: id }; // Store id as _id for deletion
            });

            // Sort users: 병원, 직위, 이름 순으로 오름차순
            usersData = sortUsers(usersData);

            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
            // Don't show error alert on initial load, just log it
        } finally {
            setInitialLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);

            // 첫 번째 시트만 처리
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('엑셀 파일에 시트가 없습니다.');
            }

            const sheetName = workbook.SheetNames[0]; // 첫 번째 시트만 사용
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                throw new Error(`첫 번째 시트 "${sheetName}"를 읽을 수 없습니다.`);
            }

            // 첫 번째 시트의 데이터만 JSON으로 변환
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Filter active users (활성상태 === 'yes')
            const activeUsers = jsonData.filter((row: any) => {
                return row['활성상태'] === 'yes';
            });

            // Save to Firestore
            const response = await fetch('/api/admin/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ users: activeUsers }),
            });

            if (!response.ok) {
                throw new Error('Failed to save users');
            }

            const result = await response.json();

            // Reload users from Firestore to get all data including IDs (will be sorted automatically)
            await loadUsers();

            if (result.added > 0) {
                alert(`${result.added}명의 사용자가 등록되었습니다.`);
            } else {
                alert('모든 사용자가 이미 등록되어 있습니다.');
            }
        } catch (error) {
            console.error('Error reading Excel file:', error);
            alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const handleUsersChange = async (updatedUsers: any[]) => {
        // When users are deleted from filtered list, we need to update the full users list
        // Find the deleted user IDs from the difference
        const currentFilteredIds = new Set(filteredUsers.map(u => u._id));
        const updatedFilteredIds = new Set(updatedUsers.map(u => u._id));

        // Find deleted IDs
        const deletedIds = new Set<string>();
        currentFilteredIds.forEach(id => {
            if (!updatedFilteredIds.has(id)) {
                deletedIds.add(id);
            }
        });

        // Remove deleted users from full users list
        const updatedFullUsers = users.filter(user => !deletedIds.has(user._id));

        // Sort users after deletion to maintain sort order
        const sortedUsers = sortUsers(updatedFullUsers);
        setUsers(sortedUsers);
    };

    // Filter users based on active search query (필드제목:필드내용 형식 지원)
    const filteredUsers = useMemo(() => {
        if (!activeSearchQuery.trim()) {
            return users;
        }

        // 쉼표로 분리된 여러 조건 파싱
        const conditions = activeSearchQuery.split(',').map(c => c.trim()).filter(c => c.length > 0);

        return users.filter(user => {
            // 모든 조건을 만족해야 함 (AND 조건)
            return conditions.every(condition => {
                // 필드제목:필드내용 형식인지 확인
                if (condition.includes(':')) {
                    const [fieldName, fieldValue] = condition.split(':').map(s => s.trim());
                    const searchValue = fieldValue.toLowerCase();

                    // 필드명에 따라 검색
                    switch (fieldName.toLowerCase()) {
                        case '이름':
                        case 'name':
                            const name = String(user['이름'] || user['성명'] || '').toLowerCase();
                            return name.includes(searchValue);

                        case '병원':
                        case 'hospital':
                            const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').toLowerCase();
                            return hospital.includes(searchValue);

                        case '이메일':
                        case 'email':
                            const email = String(user['이메일'] || user['email'] || user['Email'] || user['EMAIL'] || '').toLowerCase();
                            return email.includes(searchValue);

                        case '직위':
                        case 'position':
                            const position = String(user['직위'] || user['position'] || '').toLowerCase();
                            return position.includes(searchValue);

                        default:
                            // 알 수 없는 필드명인 경우 전체 필드에서 검색
                            const allFields = [
                                String(user['이름'] || user['성명'] || ''),
                                String(user['병원'] || user['병원명'] || user['hospital'] || ''),
                                String(user['이메일'] || user['email'] || user['Email'] || user['EMAIL'] || ''),
                                String(user['직위'] || user['position'] || '')
                            ].map(f => f.toLowerCase());
                            return allFields.some(field => field.includes(searchValue));
                    }
                } else {
                    // 필드제목: 없이 입력한 경우 전체 필드에서 검색
                    const query = condition.toLowerCase();
                    const name = String(user['이름'] || user['성명'] || '').toLowerCase();
                    const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').toLowerCase();
                    const email = String(user['이메일'] || user['email'] || user['Email'] || user['EMAIL'] || '').toLowerCase();
                    const position = String(user['직위'] || user['position'] || '').toLowerCase();

                    return name.includes(query) || hospital.includes(query) || email.includes(query) || position.includes(query);
                }
            });
        });
    }, [users, activeSearchQuery]);

    const handleSearch = () => {
        setActiveSearchQuery(searchQuery);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Load filter options for auth deletion
    useEffect(() => {
        const loadFilterOptions = async () => {
            if (!showAuthDeletionModal) return;

            try {
                const response = await fetch('/api/instructor/filter-options');
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        setFilterHospitals(data.hospitals || []);
                        setFilterPositions(data.positions || []);
                    }
                }
            } catch (error) {
                console.error('Error loading filter options:', error);
            }
        };

        loadFilterOptions();
    }, [showAuthDeletionModal]);

    // Load filter options for auth push from the user management screen's user list
    useEffect(() => {
        if (!showAuthPushModal) return;

        const ALL_POSITIONS = ['R3', 'F1', 'F2'];
        const f2Variants = ['F2', 'F2D', 'F2C', 'FCD'];
        const hospitalsSet = new Set<string>();
        const positionsSet = new Set<string>(ALL_POSITIONS);

        users.forEach(user => {
            const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
            let position = String(user['직위'] || user['position'] || '').trim();

            if (hospital) hospitalsSet.add(hospital);
            if (position) {
                if (f2Variants.includes(position.toUpperCase())) position = 'F2';
                positionsSet.add(position);
            }
        });

        setPushFilterHospitals(Array.from(hospitalsSet).sort());
        setPushFilterPositions(Array.from(positionsSet).sort());
    }, [showAuthPushModal, users]);

    // Load filter options for log deletion from the user management screen's user list
    useEffect(() => {
        if (!showLogDeletionModal) return;

        const ALL_POSITIONS = ['R3', 'F1', 'F2'];
        const f2Variants = ['F2', 'F2D', 'F2C', 'FCD'];
        const hospitalsSet = new Set<string>();
        const positionsSet = new Set<string>(ALL_POSITIONS);

        users.forEach(user => {
            const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
            let position = String(user['직위'] || user['position'] || '').trim();

            if (hospital) hospitalsSet.add(hospital);
            if (position) {
                if (f2Variants.includes(position.toUpperCase())) position = 'F2';
                positionsSet.add(position);
            }
        });

        setLogFilterHospitals(Array.from(hospitalsSet).sort());
        setLogFilterPositions(Array.from(positionsSet).sort());
    }, [showLogDeletionModal, users]);

    // Load filter options for video deletion from the user management screen's user list
    useEffect(() => {
        if (!showVideoDeletionModal) return;

        const ALL_POSITIONS = ['R3', 'F1', 'F2'];
        const f2Variants = ['F2', 'F2D', 'F2C', 'FCD'];
        const hospitalsSet = new Set<string>();
        const positionsSet = new Set<string>(ALL_POSITIONS);

        users.forEach(user => {
            const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
            let position = String(user['직위'] || user['position'] || '').trim();

            if (hospital) hospitalsSet.add(hospital);
            if (position) {
                if (f2Variants.includes(position.toUpperCase())) position = 'F2';
                positionsSet.add(position);
            }
        });

        setVideoFilterHospitals(Array.from(hospitalsSet).sort());
        setVideoFilterPositions(Array.from(positionsSet).sort());
    }, [showVideoDeletionModal, users]);

    // Load hospital/position options for email modal from users
    useEffect(() => {
        if (!showEmailModal) return;

        const hospitalsSet = new Set<string>();
        const positionsSet = new Set<string>();

        users.forEach(user => {
            const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
            const position = String(user['직위'] || user['직책'] || user['position'] || '').trim();
            if (hospital) hospitalsSet.add(hospital);
            if (position) positionsSet.add(position);
        });

        setEmailModalHospitals(Array.from(hospitalsSet).sort());
        setEmailModalPositions(Array.from(positionsSet).sort());
    }, [showEmailModal, users]);

    // Handle "all" filter checkbox for email modal - hospitals (only select all when toggled ON)
    useEffect(() => {
        if (selectAllEmailHospitals) {
            setSelectedEmailHospitals(new Set(emailModalHospitals));
        }
    }, [selectAllEmailHospitals, emailModalHospitals]);

    // Handle "all" filter checkbox for email modal - positions (only select all when toggled ON)
    useEffect(() => {
        if (selectAllEmailPositions) {
            setSelectedEmailPositions(new Set(emailModalPositions));
        }
    }, [selectAllEmailPositions, emailModalPositions]);

    // Handle "all" filter checkbox for deletion (overall) - only select all when toggled ON
    useEffect(() => {
        if (selectAllFilter) {
            setSelectedFilterHospitals(new Set(filterHospitals));
            setSelectedFilterPositions(new Set(filterPositions));
            setSelectAllFilterHospitals(true);
            setSelectAllFilterPositions(true);
        }
    }, [selectAllFilter, filterHospitals, filterPositions]);

    // Update overall "all" checkbox when individual groups change
    useEffect(() => {
        if (selectedFilterHospitals.size === filterHospitals.length && filterHospitals.length > 0 &&
            selectedFilterPositions.size === filterPositions.length && filterPositions.length > 0) {
            setSelectAllFilter(true);
        } else {
            setSelectAllFilter(false);
        }
    }, [selectedFilterHospitals, selectedFilterPositions, filterHospitals, filterPositions]);

    // Handle "all" filter checkbox for deletion - hospitals (only select all when toggled ON)
    useEffect(() => {
        if (selectAllFilterHospitals) {
            setSelectedFilterHospitals(new Set(filterHospitals));
        }
    }, [selectAllFilterHospitals, filterHospitals]);

    // Handle "all" filter checkbox for deletion - positions (only select all when toggled ON)
    useEffect(() => {
        if (selectAllFilterPositions) {
            setSelectedFilterPositions(new Set(filterPositions));
        }
    }, [selectAllFilterPositions, filterPositions]);

    // Handle "all" filter checkbox for push (overall) - only select all when toggled ON
    useEffect(() => {
        if (selectAllPushFilter) {
            setSelectedPushFilterHospitals(new Set(pushFilterHospitals));
            setSelectedPushFilterPositions(new Set(pushFilterPositions));
            setSelectAllPushFilterHospitals(true);
            setSelectAllPushFilterPositions(true);
        }
    }, [selectAllPushFilter, pushFilterHospitals, pushFilterPositions]);

    // Update overall "all" checkbox when individual groups change for push
    useEffect(() => {
        if (selectedPushFilterHospitals.size === pushFilterHospitals.length && pushFilterHospitals.length > 0 &&
            selectedPushFilterPositions.size === pushFilterPositions.length && pushFilterPositions.length > 0) {
            setSelectAllPushFilter(true);
        } else {
            setSelectAllPushFilter(false);
        }
    }, [selectedPushFilterHospitals, selectedPushFilterPositions, pushFilterHospitals, pushFilterPositions]);

    // Handle "all" filter checkbox for push - hospitals (only select all when toggled ON)
    useEffect(() => {
        if (selectAllPushFilterHospitals) {
            setSelectedPushFilterHospitals(new Set(pushFilterHospitals));
        }
    }, [selectAllPushFilterHospitals, pushFilterHospitals]);

    // Handle "all" filter checkbox for push - positions (only select all when toggled ON)
    useEffect(() => {
        if (selectAllPushFilterPositions) {
            setSelectedPushFilterPositions(new Set(pushFilterPositions));
        }
    }, [selectAllPushFilterPositions, pushFilterPositions]);

    // Handle "all" filter checkbox for log deletion (overall) - only select all when toggled ON
    useEffect(() => {
        if (selectAllLogFilter) {
            setSelectedLogFilterHospitals(new Set(logFilterHospitals));
            setSelectedLogFilterPositions(new Set(logFilterPositions));
            setSelectAllLogFilterHospitals(true);
            setSelectAllLogFilterPositions(true);
        }
    }, [selectAllLogFilter, logFilterHospitals, logFilterPositions]);

    // Update overall "all" checkbox when individual groups change for log deletion
    useEffect(() => {
        if (selectedLogFilterHospitals.size === logFilterHospitals.length && logFilterHospitals.length > 0 &&
            selectedLogFilterPositions.size === logFilterPositions.length && logFilterPositions.length > 0) {
            setSelectAllLogFilter(true);
        } else {
            setSelectAllLogFilter(false);
        }
    }, [selectedLogFilterHospitals, selectedLogFilterPositions, logFilterHospitals, logFilterPositions]);

    // Handle "all" filter checkbox for log deletion - hospitals (only select all when toggled ON)
    useEffect(() => {
        if (selectAllLogFilterHospitals) {
            setSelectedLogFilterHospitals(new Set(logFilterHospitals));
        }
    }, [selectAllLogFilterHospitals, logFilterHospitals]);

    // Handle "all" filter checkbox for log deletion - positions (only select all when toggled ON)
    useEffect(() => {
        if (selectAllLogFilterPositions) {
            setSelectedLogFilterPositions(new Set(logFilterPositions));
        }
    }, [selectAllLogFilterPositions, logFilterPositions]);

    // Handle "all" filter checkbox for video deletion (overall) - only select all when toggled ON
    useEffect(() => {
        if (selectAllVideoFilter) {
            setSelectedVideoFilterHospitals(new Set(videoFilterHospitals));
            setSelectedVideoFilterPositions(new Set(videoFilterPositions));
            setSelectAllVideoFilterHospitals(true);
            setSelectAllVideoFilterPositions(true);
        }
    }, [selectAllVideoFilter, videoFilterHospitals, videoFilterPositions]);

    // Update overall "all" checkbox when individual groups change for video deletion
    useEffect(() => {
        if (selectedVideoFilterHospitals.size === videoFilterHospitals.length && videoFilterHospitals.length > 0 &&
            selectedVideoFilterPositions.size === videoFilterPositions.length && videoFilterPositions.length > 0) {
            setSelectAllVideoFilter(true);
        } else {
            setSelectAllVideoFilter(false);
        }
    }, [selectedVideoFilterHospitals, selectedVideoFilterPositions, videoFilterHospitals, videoFilterPositions]);

    // Handle "all" filter checkbox for video deletion - hospitals (only select all when toggled ON)
    useEffect(() => {
        if (selectAllVideoFilterHospitals) {
            setSelectedVideoFilterHospitals(new Set(videoFilterHospitals));
        }
    }, [selectAllVideoFilterHospitals, videoFilterHospitals]);

    // Handle "all" filter checkbox for video deletion - positions (only select all when toggled ON)
    useEffect(() => {
        if (selectAllVideoFilterPositions) {
            setSelectedVideoFilterPositions(new Set(videoFilterPositions));
        }
    }, [selectAllVideoFilterPositions, videoFilterPositions]);

    // Load filtered users when filters change for deletion
    useEffect(() => {
        const loadFilteredUsers = async () => {
            if (!showAuthDeletionModal) {
                setFilteredUsersForDeletion([]);
                return;
            }

            // Check if any filter is selected
            const hasHospitalFilter = selectedFilterHospitals.size > 0;
            const hasPositionFilter = selectedFilterPositions.size > 0;
            const hasNameFilter = filterNameInput.trim().length > 0;
            const hasAnyFilter = hasHospitalFilter || hasPositionFilter || hasNameFilter;

            // If no filter is selected, show empty list (0명)
            if (!hasAnyFilter) {
                setFilteredUsersForDeletion([]);
                return;
            }

            setLoadingFilteredUsers(true);
            try {
                const response = await fetch('/api/instructor/filtered-users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        hospitals: Array.from(selectedFilterHospitals),
                        positions: Array.from(selectedFilterPositions),
                        name: filterNameInput.trim(),
                    }),
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        setFilteredUsersForDeletion(data.users || []);
                    }
                }
            } catch (error) {
                console.error('Error loading filtered users:', error);
            } finally {
                setLoadingFilteredUsers(false);
            }
        };

        loadFilteredUsers();
    }, [showAuthDeletionModal, selectedFilterHospitals, selectedFilterPositions, filterNameInput]);

    // Load filtered users when filters change for push
    // Use the users list from the user management screen (not Firebase Auth users)
    // Only show filtered users when at least one filter is selected
    useEffect(() => {
        if (!showAuthPushModal) {
            setFilteredUsersForPush([]);
            return;
        }

        // Check if any filter is selected
        const hasHospitalFilter = selectedPushFilterHospitals.size > 0;
        const hasPositionFilter = selectedPushFilterPositions.size > 0;
        const hasNameFilter = pushFilterNameInput.trim().length > 0;
        const hasAnyFilter = hasHospitalFilter || hasPositionFilter || hasNameFilter;

        // If no filter is selected, show empty list (0명)
        if (!hasAnyFilter) {
            setFilteredUsersForPush([]);
            return;
        }

        setLoadingFilteredUsersForPush(true);

        // Filter users from the user management screen's user list
        let filtered = [...users];

        // Filter by hospitals
        if (hasHospitalFilter) {
            filtered = filtered.filter(user => {
                const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
                return hospital && selectedPushFilterHospitals.has(hospital);
            });
        }

        // Filter by positions (F2 selection also matches F2D, F2C, FCD)
        if (hasPositionFilter) {
            const f2Variants = ['F2', 'F2D', 'F2C', 'FCD'];
            const hasF2 = selectedPushFilterPositions.has('F2');
            filtered = filtered.filter(user => {
                const position = String(user['직위'] || user['position'] || '').trim();
                if (!position) return false;
                if (selectedPushFilterPositions.has(position)) return true;
                if (hasF2 && f2Variants.includes(position.toUpperCase())) return true;
                return false;
            });
        }

        // Filter by name
        if (hasNameFilter) {
            const nameLower = pushFilterNameInput.trim().toLowerCase();
            filtered = filtered.filter(user => {
                const userName = (user['이름'] || user['성명'] || user['name'] || '').toString().toLowerCase();
                return userName.includes(nameLower);
            });
        }

        setFilteredUsersForPush(filtered);
        setLoadingFilteredUsersForPush(false);
    }, [showAuthPushModal, selectedPushFilterHospitals, selectedPushFilterPositions, pushFilterNameInput, users]);

    // Load filtered users when filters change for log deletion
    // Use the users list from the user management screen
    // Only show filtered users when at least one filter is selected
    useEffect(() => {
        if (!showLogDeletionModal) {
            setFilteredUsersForLogDeletion([]);
            return;
        }

        // Check if any filter is selected
        const hasHospitalFilter = selectedLogFilterHospitals.size > 0;
        const hasPositionFilter = selectedLogFilterPositions.size > 0;
        const hasNameFilter = logFilterNameInput.trim().length > 0;
        const hasAnyFilter = hasHospitalFilter || hasPositionFilter || hasNameFilter;

        // If no filter is selected, show empty list (0명)
        if (!hasAnyFilter) {
            setFilteredUsersForLogDeletion([]);
            return;
        }

        setLoadingFilteredUsersForLogDeletion(true);

        // Filter users from the user management screen's user list
        let filtered = [...users];

        // Filter by hospitals
        if (hasHospitalFilter) {
            filtered = filtered.filter(user => {
                const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
                return hospital && selectedLogFilterHospitals.has(hospital);
            });
        }

        // Filter by positions
        // When "F2" is selected, also include users whose position is F2, F2D, F2C, or FCD
        if (hasPositionFilter) {
            const f2Variants = ['F2', 'F2D', 'F2C', 'FCD'];
            const hasF2 = selectedLogFilterPositions.has('F2');
            const realPositions = new Set(Array.from(selectedLogFilterPositions).filter(p => p !== 'F2'));
            filtered = filtered.filter(user => {
                const position = String(user['직위'] || user['position'] || '').trim();
                if (!position) return false;
                if (realPositions.has(position)) return true;
                if (hasF2 && f2Variants.includes(position.toUpperCase())) return true;
                return false;
            });
        }

        // Filter by name
        if (hasNameFilter) {
            const nameLower = logFilterNameInput.trim().toLowerCase();
            filtered = filtered.filter(user => {
                const userName = (user['이름'] || user['성명'] || user['name'] || '').toString().toLowerCase();
                return userName.includes(nameLower);
            });
        }

        setFilteredUsersForLogDeletion(filtered);
        setLoadingFilteredUsersForLogDeletion(false);
    }, [showLogDeletionModal, selectedLogFilterHospitals, selectedLogFilterPositions, logFilterNameInput, users]);

    // Load filtered users when filters change for video deletion
    // Use the users list from the user management screen
    // Only show filtered users when at least one filter is selected
    useEffect(() => {
        if (!showVideoDeletionModal) {
            setFilteredUsersForVideoDeletion([]);
            return;
        }

        // Check if any filter is selected
        const hasHospitalFilter = selectedVideoFilterHospitals.size > 0;
        const hasPositionFilter = selectedVideoFilterPositions.size > 0;
        const hasNameFilter = videoFilterNameInput.trim().length > 0;
        const hasAnyFilter = hasHospitalFilter || hasPositionFilter || hasNameFilter;

        // If no filter is selected, show empty list (0명)
        if (!hasAnyFilter) {
            setFilteredUsersForVideoDeletion([]);
            return;
        }

        setLoadingFilteredUsersForVideoDeletion(true);

        // Filter users from the user management screen's user list
        let filtered = [...users];

        // Filter by hospitals
        if (hasHospitalFilter) {
            filtered = filtered.filter(user => {
                const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
                return hospital && selectedVideoFilterHospitals.has(hospital);
            });
        }

        // Filter by positions (F2 selection also matches F2D, F2C, FCD)
        if (hasPositionFilter) {
            const f2Variants = ['F2', 'F2D', 'F2C', 'FCD'];
            const hasF2 = selectedVideoFilterPositions.has('F2');
            filtered = filtered.filter(user => {
                const position = String(user['직위'] || user['position'] || '').trim();
                if (!position) return false;
                if (selectedVideoFilterPositions.has(position)) return true;
                if (hasF2 && f2Variants.includes(position.toUpperCase())) return true;
                return false;
            });
        }

        // Filter by name
        if (hasNameFilter) {
            const nameLower = videoFilterNameInput.trim().toLowerCase();
            filtered = filtered.filter(user => {
                const userName = (user['이름'] || user['성명'] || user['name'] || '').toString().toLowerCase();
                return userName.includes(nameLower);
            });
        }

        setFilteredUsersForVideoDeletion(filtered);
        setLoadingFilteredUsersForVideoDeletion(false);
    }, [showVideoDeletionModal, selectedVideoFilterHospitals, selectedVideoFilterPositions, videoFilterNameInput, users]);

    const handleAuthDeletion = () => {
        setShowAuthDeletionModal(true);
        setSelectedFilterHospitals(new Set());
        setSelectedFilterPositions(new Set());
        setFilterNameInput('');
        setSelectAllFilter(false);
        setSelectAllFilterHospitals(false);
        setSelectAllFilterPositions(false);
    };

    const handleFilterHospitalChange = (hospital: string) => {
        const newSelected = new Set(selectedFilterHospitals);
        if (newSelected.has(hospital)) {
            newSelected.delete(hospital);
        } else {
            newSelected.add(hospital);
        }
        setSelectedFilterHospitals(newSelected);
        // Update "all" checkbox state for hospitals
        if (newSelected.size === filterHospitals.length && filterHospitals.length > 0) {
            setSelectAllFilterHospitals(true);
        } else {
            setSelectAllFilterHospitals(false);
        }
    };

    const handleFilterPositionChange = (position: string) => {
        const newSelected = new Set(selectedFilterPositions);
        if (newSelected.has(position)) {
            newSelected.delete(position);
        } else {
            newSelected.add(position);
        }
        setSelectedFilterPositions(newSelected);
        // Update "all" checkbox state for positions
        if (newSelected.size === filterPositions.length && filterPositions.length > 0) {
            setSelectAllFilterPositions(true);
        } else {
            setSelectAllFilterPositions(false);
        }
    };


    const handleAuthDeletionConfirm = async () => {
        if (filteredUsersForDeletion.length === 0) {
            alert('삭제할 사용자가 없습니다. 필터를 선택해주세요.');
            return;
        }

        const confirmed = window.confirm(
            `선택된 ${filteredUsersForDeletion.length}명의 사용자를 Firebase Authentication에서 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
        );

        if (!confirmed) {
            return;
        }

        setShowAuthDeletionModal(false);
        setAuthDeletionLoading(true);

        try {
            const response = await fetch('/api/admin/auth-deletion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hospitals: Array.from(selectedFilterHospitals),
                    positions: Array.from(selectedFilterPositions),
                    name: filterNameInput.trim(),
                    userEmails: filteredUsersForDeletion.map(u => u['이메일'] || u['email'] || u['Email'] || u['EMAIL']).filter(Boolean),
                    requesterEmail: user?.email || '',
                }),
            });

            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            let data: any;

            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error('Error parsing JSON response:', parseError);
                    const text = await response.text();
                    throw new Error(`서버 응답 파싱 오류: ${text.substring(0, 100)}`);
                }
            } else {
                const text = await response.text();
                throw new Error(`서버 오류가 발생했습니다: ${text.substring(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Firebase Authentication 사용자 삭제 중 오류가 발생했습니다.');
            }

            // Show success message
            const { results } = data;
            let message = `✅ 성공: ${results.deleted}명의 사용자가 Firebase Authentication에서 삭제되었습니다.\n`;

            if (results.skipped > 0) {
                message += `🔒 관리자 ${results.skipped}명은 삭제되지 않았습니다.\n`;
            }

            if (results.failed > 0) {
                message += `❌ 실패: ${results.failed}명의 사용자 삭제에 실패했습니다.\n`;
                if (results.errors && results.errors.length > 0) {
                    message += `\n오류 상세:\n${results.errors.slice(0, 5).join('\n')}`;
                    if (results.errors.length > 5) {
                        message += `\n... 외 ${results.errors.length - 5}개 오류`;
                    }
                }
            }

            alert(message);
        } catch (error: any) {
            console.error('Error deleting users from Firebase Auth:', error);
            alert(`❌ 오류 발생: ${error.message || 'Firebase Authentication 사용자 삭제 중 오류가 발생했습니다.'}`);
        } finally {
            setAuthDeletionLoading(false);
        }
    };

    const handleAuthPush = () => {
        setShowAuthPushModal(true);
        setSelectedPushFilterHospitals(new Set());
        setSelectedPushFilterPositions(new Set());
        setPushFilterNameInput('');
        setSelectAllPushFilter(false);
        setSelectAllPushFilterHospitals(false);
        setSelectAllPushFilterPositions(false);
    };

    const handlePushFilterHospitalChange = (hospital: string) => {
        const newSelected = new Set(selectedPushFilterHospitals);
        if (newSelected.has(hospital)) {
            newSelected.delete(hospital);
        } else {
            newSelected.add(hospital);
        }
        setSelectedPushFilterHospitals(newSelected);
        // Update "all" checkbox state for hospitals
        if (newSelected.size === pushFilterHospitals.length && pushFilterHospitals.length > 0) {
            setSelectAllPushFilterHospitals(true);
        } else {
            setSelectAllPushFilterHospitals(false);
        }
    };

    const handlePushFilterPositionChange = (position: string) => {
        const newSelected = new Set(selectedPushFilterPositions);
        if (newSelected.has(position)) {
            newSelected.delete(position);
        } else {
            newSelected.add(position);
        }
        setSelectedPushFilterPositions(newSelected);
        // Update "all" checkbox state for positions
        if (newSelected.size === pushFilterPositions.length && pushFilterPositions.length > 0) {
            setSelectAllPushFilterPositions(true);
        } else {
            setSelectAllPushFilterPositions(false);
        }
    };

    const handleLogFilterHospitalChange = (hospital: string) => {
        const newSelected = new Set(selectedLogFilterHospitals);
        if (newSelected.has(hospital)) {
            newSelected.delete(hospital);
        } else {
            newSelected.add(hospital);
        }
        setSelectedLogFilterHospitals(newSelected);
        // Update "all" checkbox state for hospitals
        if (newSelected.size === logFilterHospitals.length && logFilterHospitals.length > 0) {
            setSelectAllLogFilterHospitals(true);
        } else {
            setSelectAllLogFilterHospitals(false);
        }
    };

    const handleLogFilterPositionChange = (position: string) => {
        const newSelected = new Set(selectedLogFilterPositions);
        if (newSelected.has(position)) {
            newSelected.delete(position);
        } else {
            newSelected.add(position);
        }
        setSelectedLogFilterPositions(newSelected);
        // Update "all" checkbox state for positions
        if (newSelected.size === logFilterPositions.length && logFilterPositions.length > 0) {
            setSelectAllLogFilterPositions(true);
        } else {
            setSelectAllLogFilterPositions(false);
        }
    };

    const handleLogDeletionConfirm = async () => {
        if (filteredUsersForLogDeletion.length === 0) {
            alert('삭제할 사용자가 없습니다. 필터를 선택해주세요.');
            return;
        }

        const confirmed = window.confirm(
            `선택된 ${filteredUsersForLogDeletion.length}명의 사용자의 로그 파일을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
        );

        if (!confirmed) {
            return;
        }

        setShowLogDeletionModal(false);
        setLogDeleteLoading(true);

        try {
            const extraPositions = Array.from(selectedLogFilterPositions).filter(p => p === 'F2');
            const response = await fetch('/api/admin/delete-logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    users: filteredUsersForLogDeletion,
                    extraPositions,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '로그 파일 삭제 중 오류가 발생했습니다.');
            }

            // Download CSV file
            if (data.csvContent && data.csvFileName) {
                const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', data.csvFileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }

            alert(`✅ 로그 파일 삭제 완료: ${data.deletedCount || 0}개 파일이 삭제되었습니다.\n\n삭제 기록 CSV 파일이 다운로드되었습니다.`);

            // Reset filter state
            setSelectedLogFilterHospitals(new Set());
            setSelectedLogFilterPositions(new Set());
            setLogFilterNameInput('');
            setSelectAllLogFilter(false);
            setFilteredUsersForLogDeletion([]);
        } catch (error: any) {
            console.error('Error deleting log files:', error);
            alert(`❌ 오류 발생: ${error.message || '로그 파일 삭제 중 오류가 발생했습니다.'}`);
        } finally {
            setLogDeleteLoading(false);
        }
    };

    const handleAuthPushConfirm = async () => {
        if (filteredUsersForPush.length === 0) {
            alert('등록할 사용자가 없습니다. 필터를 선택해주세요.');
            return;
        }

        setShowAuthPushModal(false);
        setAuthPushLoading(true);

        try {
            // filteredUsersForPush already contains full user data from users collection
            // (including password field from filtered-users API)
            const usersToPush = filteredUsersForPush;

            const response = await fetch('/api/admin/auth-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    users: usersToPush,
                }),
            });

            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            let data: any;

            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error('Error parsing JSON response:', parseError);
                    const text = await response.text();
                    throw new Error(`서버 응답 파싱 오류: ${text.substring(0, 100)}`);
                }
            } else {
                const text = await response.text();
                throw new Error(`서버 오류가 발생했습니다: ${text.substring(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Firebase Authentication에 사용자를 추가하는 중 오류가 발생했습니다.');
            }

            // Show success message
            const { results } = data;
            let message = `✅ 성공: ${results.success}명의 사용자가 Firebase Authentication에 등록되었습니다.\n`;

            if (results.alreadyExists > 0) {
                message += `ℹ️ 이미 등록된 사용자: ${results.alreadyExists}명입니다.\n`;
            }

            if (results.failed > 0) {
                message += `❌ 실패: ${results.failed}명의 사용자 등록에 실패했습니다.\n`;
                if (results.errors && results.errors.length > 0) {
                    message += `\n오류 상세:\n${results.errors.slice(0, 5).join('\n')}`;
                    if (results.errors.length > 5) {
                        message += `\n... 외 ${results.errors.length - 5}개 오류`;
                    }
                }
            }

            alert(message);
        } catch (error: any) {
            console.error('Error pushing users to Firebase Auth:', error);
            alert(`❌ 오류 발생: ${error.message || 'Firebase Authentication에 사용자를 추가하는 중 오류가 발생했습니다.'}`);
        } finally {
            setAuthPushLoading(false);
        }
    };

    const handleLogDelete = () => {
        setShowLogDeletionModal(true);
        setSelectedLogFilterHospitals(new Set());
        setSelectedLogFilterPositions(new Set());
        setLogFilterNameInput('');
        setSelectAllLogFilter(false);
        setSelectAllLogFilterHospitals(false);
        setSelectAllLogFilterPositions(false);
    };


    // Video deletion handlers
    const handleVideoDelete = () => {
        setShowVideoDeletionModal(true);
        setSelectedVideoFilterHospitals(new Set());
        setSelectedVideoFilterPositions(new Set());
        setVideoFilterNameInput('');
        setSelectAllVideoFilter(false);
        setSelectAllVideoFilterHospitals(false);
        setSelectAllVideoFilterPositions(false);
    };

    const handleVideoFilterHospitalChange = (hospital: string) => {
        const newSelected = new Set(selectedVideoFilterHospitals);
        if (newSelected.has(hospital)) {
            newSelected.delete(hospital);
        } else {
            newSelected.add(hospital);
        }
        setSelectedVideoFilterHospitals(newSelected);
        // Update "all" checkbox state for hospitals
        if (newSelected.size === videoFilterHospitals.length && videoFilterHospitals.length > 0) {
            setSelectAllVideoFilterHospitals(true);
        } else {
            setSelectAllVideoFilterHospitals(false);
        }
    };

    const handleVideoFilterPositionChange = (position: string) => {
        const newSelected = new Set(selectedVideoFilterPositions);
        if (newSelected.has(position)) {
            newSelected.delete(position);
        } else {
            newSelected.add(position);
        }
        setSelectedVideoFilterPositions(newSelected);
        // Update "all" checkbox state for positions
        if (newSelected.size === videoFilterPositions.length && videoFilterPositions.length > 0) {
            setSelectAllVideoFilterPositions(true);
        } else {
            setSelectAllVideoFilterPositions(false);
        }
    };

    const handleVideoDeletionConfirm = async () => {
        if (filteredUsersForVideoDeletion.length === 0) {
            alert('삭제할 사용자가 없습니다. 필터를 선택해주세요.');
            return;
        }

        const confirmed = window.confirm(
            `선택된 ${filteredUsersForVideoDeletion.length}명의 사용자의 제출 동영상을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
        );

        if (!confirmed) {
            return;
        }

        setShowVideoDeletionModal(false);
        setVideoDeleteLoading(true);

        try {
            const response = await fetch('/api/admin/delete-submitted-videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    users: filteredUsersForVideoDeletion,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '제출 동영상 삭제 중 오류가 발생했습니다.');
            }

            alert(`✅ 제출 동영상 삭제 완료: ${data.deletedCount || 0}개 파일이 삭제되었습니다.`);

            // Reset filter state
            setSelectedVideoFilterHospitals(new Set());
            setSelectedVideoFilterPositions(new Set());
            setVideoFilterNameInput('');
            setSelectAllVideoFilterHospitals(false);
            setSelectAllVideoFilterPositions(false);
            setFilteredUsersForVideoDeletion([]);
        } catch (error: any) {
            console.error('Error deleting submitted videos:', error);
            alert(`❌ 오류 발생: ${error.message || '제출 동영상 삭제 중 오류가 발생했습니다.'}`);
        } finally {
            setVideoDeleteLoading(false);
        }
    };

    // Filtered users in email modal (by hospital/position)
    const emailFilteredUsers = useMemo(() => {
        return users.filter(user => {
            const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
            const position = String(user['직위'] || user['직책'] || user['position'] || '').trim();
            const matchHospital = selectedEmailHospitals.size === 0 || (hospital && selectedEmailHospitals.has(hospital));
            const matchPosition = selectedEmailPositions.size === 0 || (position && selectedEmailPositions.has(position));
            return matchHospital && matchPosition;
        });
    }, [users, selectedEmailHospitals, selectedEmailPositions]);

    // Email feature handlers
    const handleEmailClick = () => {
        setSelectedEmailHospitals(new Set());
        setSelectedEmailPositions(new Set());
        setSelectAllEmailHospitals(false);
        setSelectAllEmailPositions(false);
        setShowEmailModal(true);
        // Default: select all users
        const allUserIds = new Set(users.map(u => u._id));
        setSelectedEmailUsers(allUserIds);
        setSelectAllEmail(true);
    };

    const handleEmailUserToggle = (userId: string) => {
        const newSelected = new Set(selectedEmailUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedEmailUsers(newSelected);
    };

    const handleSelectAllEmailToggle = () => {
        const allFilteredSelected = emailFilteredUsers.length > 0 && emailFilteredUsers.every(u => selectedEmailUsers.has(u._id));
        if (allFilteredSelected) {
            const toRemove = new Set(emailFilteredUsers.map(u => u._id));
            const newSelected = new Set(selectedEmailUsers);
            toRemove.forEach(id => newSelected.delete(id));
            setSelectedEmailUsers(newSelected);
        } else {
            const newSelected = new Set(selectedEmailUsers);
            emailFilteredUsers.forEach(u => newSelected.add(u._id));
            setSelectedEmailUsers(newSelected);
        }
    };

    // Calculate Gmail URL dynamically
    const gmailUrl = useMemo(() => {
        if (selectedEmailUsers.size === 0) return '#';

        const selectedUsersList = users.filter(u => selectedEmailUsers.has(u._id));
        const emails = selectedUsersList
            .map(u => u['이메일'] || u['email'] || u['Email'] || u['EMAIL'])
            .filter(email => email && email.includes('@'))
            .join(',');

        if (!emails) return '#';

        return `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails)}`;
    }, [selectedEmailUsers, users]);

    const handleCopyEmails = () => {
        if (selectedEmailUsers.size === 0) {
            alert('복사할 사용자를 선택해주세요.');
            return;
        }

        const selectedUsersList = users.filter(u => selectedEmailUsers.has(u._id));
        const emails = selectedUsersList
            .map(u => u['이메일'] || u['email'] || u['Email'] || u['EMAIL'])
            .filter(email => email && email.includes('@'))
            .join(', ');

        if (!emails) {
            alert('선택된 사용자 중 유효한 이메일이 없습니다.');
            return;
        }

        navigator.clipboard.writeText(emails).then(() => {
            alert('이메일 주소가 클립보드에 복사되었습니다.');
        }).catch(err => {
            console.error('Failed to copy emails:', err);
            alert('이메일 복사에 실패했습니다.');
        });
    };

    // Concurrent login report handlers
    const loadConcurrentLogins = async () => {
        setLoadingLogins(true);
        try {
            const response = await fetch('/api/admin/concurrent-logins');
            if (response.ok) {
                const data = await response.json();
                setConcurrentLogins(data.records || []);
            } else {
                alert('동시 접속 기록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error loading concurrent logins:', error);
            alert('동시 접속 기록을 불러오는데 실패했습니다.');
        } finally {
            setLoadingLogins(false);
        }
    };

    const loadRecordDetails = async (id: string) => {
        try {
            const response = await fetch('/api/admin/concurrent-logins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedRecord(data.record);
            } else {
                alert('세부 정보를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error loading record details:', error);
            alert('세부 정보를 불러오는데 실패했습니다.');
        }
    };

    const handleDeleteConcurrentLogin = async (id: string) => {
        if (!confirm('이 동시 접속 기록을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/concurrent-logins', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                // Remove from local state
                setConcurrentLogins(concurrentLogins.filter(record => record.id !== id));
                // If deleted record was selected, clear selection
                if (selectedRecord && selectedRecord.id === id) {
                    setSelectedRecord(null);
                }
            } else {
                const data = await response.json();
                alert(`삭제 실패: ${data.error || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('Error deleting concurrent login record:', error);
            alert('동시 접속 기록 삭제 중 오류가 발생했습니다.');
        }
    };

    // Admin management handlers
    const loadAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const response = await fetch('/api/admin/admins');
            if (response.ok) {
                const data = await response.json();
                setAdmins(data.admins || []);
            } else {
                alert('관리자 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error loading admins:', error);
            alert('관리자 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoadingAdmins(false);
        }
    };

    const handleShowAdminModal = () => {
        setShowAdminModal(true);
        loadAdmins();
    };

    const handleAddAdmin = async () => {
        if (!newAdminEmail.trim()) {
            alert('이메일을 입력해주세요.');
            return;
        }

        setAddingAdmin(true);
        try {
            const response = await fetch('/api/admin/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newAdminEmail.trim() })
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ 관리자가 추가되었습니다.');
                setNewAdminEmail('');
                await loadAdmins();
            } else {
                alert(`❌ 오류: ${data.error || '관리자 추가에 실패했습니다.'}`);
            }
        } catch (error: any) {
            console.error('Error adding admin:', error);
            alert(`❌ 오류: ${error.message || '관리자 추가 중 오류가 발생했습니다.'}`);
        } finally {
            setAddingAdmin(false);
        }
    };

    const handleRemoveAdmin = async (email: string) => {
        const PRIMARY_ADMIN_EMAILS = ['jhlee409@gmail.com', 'ghlee409@amc.seoul.kr'];
        if (PRIMARY_ADMIN_EMAILS.some(adminEmail => email.toLowerCase() === adminEmail.toLowerCase())) {
            alert('❌ Primary admin은 삭제할 수 없습니다.');
            return;
        }

        if (!confirm(`관리자 권한을 제거하시겠습니까?\n\n이메일: ${email}`)) {
            return;
        }

        setRemovingAdmin(email);
        try {
            const response = await fetch('/api/admin/admins', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ 관리자 권한이 제거되었습니다.');
                await loadAdmins();
            } else {
                alert(`❌ 오류: ${data.error || '관리자 제거에 실패했습니다.'}`);
            }
        } catch (error: any) {
            console.error('Error removing admin:', error);
            alert(`❌ 오류: ${error.message || '관리자 제거 중 오류가 발생했습니다.'}`);
        } finally {
            setRemovingAdmin(null);
        }
    };

    // Auto-delete duplicates function
    const handleAutoDeleteDuplicates = async () => {
        if (users.length === 0) return;

        // Group users by Name + Hospital + Email
        const groups: { [key: string]: any[] } = {};

        users.forEach(user => {
            const name = String(user['이름'] || user['성명'] || '').trim();
            const hospital = String(user['병원'] || user['병원명'] || '').trim();
            const email = String(user['이메일'] || user['email'] || user['Email'] || user['EMAIL'] || '').trim().toLowerCase();

            if (!name) return; // Skip users without name

            const key = `${name}|${hospital}|${email}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(user);
        });

        // Filter groups with more than 1 user
        const duplicates = Object.values(groups).filter(group => group.length > 1);

        if (duplicates.length === 0) {
            return; // No duplicates found
        }

        // Collect IDs to delete (keep the most recent record in each group)
        const idsToDelete: string[] = [];

        duplicates.forEach(group => {
            // Sort by createdAt descending (newest first)
            group.sort((a: any, b: any) => {
                const timeA = a.createdAt?._seconds || a.createdAt?.seconds || 0;
                const timeB = b.createdAt?._seconds || b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            // Keep the first (newest) one, delete the rest
            for (let i = 1; i < group.length; i++) {
                if (group[i]._id) {
                    idsToDelete.push(group[i]._id);
                }
            }
        });

        if (idsToDelete.length === 0) {
            return;
        }

        try {
            const response = await fetch('/api/admin/patients/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userIds: idsToDelete, requesterEmail: user?.email || '' }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete duplicates');
            }

            setDuplicateMessage(`✅ 중복 정리 완료: ${idsToDelete.length}명의 중복 사용자가 자동으로 삭제되었습니다.`);

            // Reload users
            await loadUsers();
        } catch (error: any) {
            console.error('Error auto-deleting duplicates:', error);
            setDuplicateMessage(`❌ 오류 발생: ${error.message || '중복 사용자 자동 삭제 중 오류가 발생했습니다.'}`);
        }
    };

    // Duplicate removal handlers
    const handleFindDuplicates = () => {
        if (users.length === 0) {
            alert('등록된 사용자가 없습니다.');
            return;
        }

        // Group users by Name + Hospital + Email
        const groups: { [key: string]: any[] } = {};

        users.forEach(user => {
            const name = String(user['이름'] || user['성명'] || '').trim();
            const hospital = String(user['병원'] || user['병원명'] || '').trim();
            const email = String(user['이메일'] || user['email'] || user['Email'] || user['EMAIL'] || '').trim().toLowerCase();

            if (!name) return; // Skip users without name

            const key = `${name}|${hospital}|${email}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(user);
        });

        // Filter groups with more than 1 user
        const duplicates = Object.values(groups).filter(group => group.length > 1);

        if (duplicates.length === 0) {
            alert('중복된 사용자가 없습니다.');
            return;
        }

        // Sort each group by createdAt descending (newest first = kept)
        duplicates.forEach(group => {
            group.sort((a: any, b: any) => {
                const timeA = a.createdAt?._seconds || a.createdAt?.seconds || 0;
                const timeB = b.createdAt?._seconds || b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
        });

        setDuplicateGroups(duplicates);
        setShowDuplicateModal(true);
    };

    const handleDuplicateDelete = async () => {
        if (duplicateGroups.length === 0) return;

        setDuplicateLoading(true);

        try {
            // Collect IDs to delete (keep the most recent record in each group)
            const idsToDelete: string[] = [];

            duplicateGroups.forEach(group => {
                // Sort by createdAt descending (newest first)
                const sorted = [...group].sort((a: any, b: any) => {
                    const timeA = a.createdAt?._seconds || a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?._seconds || b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });
                // Keep the first (newest) one, delete the rest
                for (let i = 1; i < sorted.length; i++) {
                    if (sorted[i]._id) {
                        idsToDelete.push(sorted[i]._id);
                    }
                }
            });

            if (idsToDelete.length === 0) {
                alert('삭제할 대상이 없습니다.');
                setShowDuplicateModal(false);
                return;
            }

            const response = await fetch('/api/admin/patients/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userIds: idsToDelete, requesterEmail: user?.email || '' }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete duplicates');
            }

            const result = await response.json();

            setDuplicateMessage(`✅ 중복 정리 완료: ${idsToDelete.length}명의 중복 사용자가 삭제되었습니다.`);

            // Reload users
            await loadUsers();

            setShowDuplicateModal(false);
            setDuplicateGroups([]);
        } catch (error: any) {
            console.error('Error deleting duplicates:', error);
            setDuplicateMessage(`❌ 오류 발생: ${error.message || '중복 사용자 삭제 중 오류가 발생했습니다.'}`);
        } finally {
            setDuplicateLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">사용자 데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">사용자 관리</h1>

            {/* Duplicate Message */}
            {duplicateMessage && (
                <div className={`mb-4 p-4 rounded-lg ${duplicateMessage.includes('✅')
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    <p className="font-medium">{duplicateMessage}</p>
                </div>
            )}

            {/* File Upload Button and Controls */}
            <div className="mb-6 flex items-center flex-wrap gap-4">
                <label
                    htmlFor="excel-upload"
                    className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-400 transition cursor-pointer disabled:opacity-50 disabled:bg-blue-200 disabled:text-blue-400"
                    title="탐색기에서 선택된 엑셀 파일의 첫번째 sheet의 정보가 추가됩니다"
                >
                    <Upload className="w-5 h-5" />
                    <span>{loading ? '파일 처리 중...' : '사용자 등록'}</span>
                </label>
                <input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="hidden"
                />
                {users.length > 0 && (
                    <>
                        <button
                            onClick={handleAuthDeletion}
                            disabled={authDeletionLoading || loading}
                            className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-400 transition cursor-pointer disabled:opacity-50 disabled:bg-blue-200 disabled:text-blue-400 disabled:cursor-not-allowed"
                            title="firebase authentication에 등록되어 있던 사용자 자료가 모두 삭제됩니다."
                        >
                            <Trash2 className="w-5 h-5" />
                            <span>{authDeletionLoading ? '처리 중...' : 'firebase auth 삭제'}</span>
                        </button>
                        <button
                            onClick={handleAuthPush}
                            disabled={authPushLoading || loading}
                            className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-400 transition cursor-pointer disabled:opacity-50 disabled:bg-blue-200 disabled:text-blue-400 disabled:cursor-not-allowed"
                            title="firebase authentication에 현재 페이지 있는 사용자들이 추가됩니다."
                        >
                            <Send className="w-5 h-5" />
                            <span>{authPushLoading ? '처리 중...' : 'firebase auth 등록'}</span>
                        </button>
                        <button
                            onClick={handleLogDelete}
                            disabled={logDeleteLoading || loading}
                            className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-400 transition cursor-pointer disabled:opacity-50 disabled:bg-blue-200 disabled:text-blue-400 disabled:cursor-not-allowed"
                            title="피교육자가 각 과정을 이수했는지 확인하기 위해 만들어 졌던 모든 로그 정보가 삭제됩니다. 일단 삭제되면 리포트가 작성되지 않으니 주의하세요."
                        >
                            <Trash2 className="w-5 h-5" />
                            <span>{logDeleteLoading ? '처리 중...' : 'firebase log 삭제'}</span>
                        </button>
                        <button
                            onClick={handleVideoDelete}
                            disabled={videoDeleteLoading || loading}
                            className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-400 transition cursor-pointer disabled:opacity-50 disabled:bg-blue-200 disabled:text-blue-400 disabled:cursor-not-allowed"
                            title="사용자가 올린 MT, SHT, EMT, LHT 의 수행동영상을 삭제합니다. 필요한 동영상이 있으면 먼저 download 한 후 삭제 버튼을 누르세요."
                        >
                            <Trash2 className="w-5 h-5" />
                            <span>{videoDeleteLoading ? '처리 중...' : 'firebase 제출동영상삭제'}</span>
                        </button>
                        <button
                            onClick={handleEmailClick}
                            disabled={loading}
                            className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-400 transition cursor-pointer disabled:opacity-50 disabled:bg-blue-200 disabled:text-blue-400"
                            title="이 페이지에 등록된 사용자들에게 이메일을 보낼 수 있습니다."
                        >
                            <Mail className="w-5 h-5" />
                            <span>메일 보내기</span>
                        </button>
                        <button
                            onClick={() => {
                                setShowConcurrentLogins(true);
                                loadConcurrentLogins();
                            }}
                            disabled={loading}
                            className="inline-flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-400 transition cursor-pointer disabled:opacity-50 disabled:bg-orange-200 disabled:text-orange-400"
                            title="한개의 ID가 다른 IP에서 일정 시간 이상 동시에 접속하면 기록됩니다. ID/PW 공유를 감시하는 기능입니다"
                        >
                            <AlertTriangle className="w-5 h-5" />
                            <span>동시 접속 발생 보고</span>
                        </button>
                        <button
                            onClick={() => router.push('/admin/instructor-login-history')}
                            disabled={loading}
                            className="inline-flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-400 transition cursor-pointer disabled:opacity-50 disabled:bg-green-200 disabled:text-green-400"
                            title="교육자들이 언제 접속했는지 로그인 정보를 보여줍니다."
                        >
                            <History className="w-5 h-5" />
                            <span>교육자 접속 현황</span>
                        </button>
                        <button
                            onClick={handleShowAdminModal}
                            disabled={loading}
                            className="inline-flex items-center space-x-2 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-400 transition cursor-pointer disabled:opacity-50 disabled:bg-purple-200 disabled:text-purple-400"
                            title="jhlee409@gmail.com을 제외한 다른 관리자를 등록, 삭제할 수 있습니다."
                        >
                            <Shield className="w-5 h-5" />
                            <span>관리자 관리</span>
                        </button>
                        <button
                            className="inline-flex items-center space-x-2 bg-blue-200 text-blue-800 px-6 py-3 rounded-lg"
                            disabled
                        >
                            <span className="text-sm font-medium">
                                활성 사용자 {users.length}명
                            </span>
                        </button>
                    </>
                )}
                {users.length > 0 && (
                    <div className="ml-auto flex items-center space-x-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    // Clear active search when input is cleared
                                    if (!e.target.value.trim()) {
                                        setActiveSearchQuery('');
                                    }
                                }}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="이름:홍길동, 병원:서울대, 이메일:test@example.com 또는 전체 검색"
                                className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-[512px] text-gray-900"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                                title="검색"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                        {activeSearchQuery && (
                            <span className="text-sm text-gray-900">
                                검색 결과: {filteredUsers.length}명
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* User Table */}
            <div className="bg-white rounded-lg shadow">
                <AdminUserTable users={filteredUsers} onUsersChange={handleUsersChange} currentUserEmail={user?.email || ''} />
            </div>



            {/* Email Selection Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">메일 발송 대상 선택</h2>
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* 병원 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">병원</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllEmailHospitals}
                                            onChange={(e) => {
                                                setSelectAllEmailHospitals(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedEmailHospitals(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700 text-sm">전체</span>
                                    </label>
                                    {emailModalHospitals.map((hospital) => (
                                        <label key={hospital} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedEmailHospitals.has(hospital)}
                                                onChange={() => {
                                                    const next = new Set(selectedEmailHospitals);
                                                    if (next.has(hospital)) next.delete(hospital);
                                                    else next.add(hospital);
                                                    setSelectedEmailHospitals(next);
                                                    if (next.size === emailModalHospitals.length) setSelectAllEmailHospitals(true);
                                                    else setSelectAllEmailHospitals(false);
                                                }}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-gray-700 text-sm truncate" title={hospital}>{hospital}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 직위 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">직위</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllEmailPositions}
                                            onChange={(e) => {
                                                setSelectAllEmailPositions(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedEmailPositions(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700 text-sm">전체</span>
                                    </label>
                                    {emailModalPositions.map((position) => (
                                        <label key={position} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedEmailPositions.has(position)}
                                                onChange={() => {
                                                    const next = new Set(selectedEmailPositions);
                                                    if (next.has(position)) next.delete(position);
                                                    else next.add(position);
                                                    setSelectedEmailPositions(next);
                                                    if (next.size === emailModalPositions.length) setSelectAllEmailPositions(true);
                                                    else setSelectAllEmailPositions(false);
                                                }}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-gray-700 text-sm">{position}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4 flex items-center justify-between">
                                <label className="flex items-center space-x-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={emailFilteredUsers.length > 0 && emailFilteredUsers.every(u => selectedEmailUsers.has(u._id))}
                                        onChange={handleSelectAllEmailToggle}
                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="font-medium text-gray-700">전체 선택 ({emailFilteredUsers.length}명)</span>
                                </label>
                                <span className="text-sm text-gray-500">
                                    선택됨: {selectedEmailUsers.size}명
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                                {emailFilteredUsers.map((user) => {
                                    const name = user['이름'] || user['성명'] || '이름 없음';
                                    const email = user['이메일'] || user['email'] || user['Email'] || user['EMAIL'] || '이메일 없음';
                                    const isSelected = selectedEmailUsers.has(user._id);

                                    return (
                                        <label
                                            key={user._id}
                                            className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleEmailUserToggle(user._id)}
                                                className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0"
                                            />
                                            <div className="overflow-hidden">
                                                <div className="font-medium text-gray-900 truncate">{name}</div>
                                                <div className="text-sm text-gray-500 truncate" title={email}>{email}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">최종 선택된 사용자 (현재 보기 기준 {emailFilteredUsers.filter(u => selectedEmailUsers.has(u._id)).length}명)</h3>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {emailFilteredUsers.filter(u => selectedEmailUsers.has(u._id)).length > 0 ? (
                                        emailFilteredUsers
                                            .filter(u => selectedEmailUsers.has(u._id))
                                            .map(u => (
                                                <span
                                                    key={u._id}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                >
                                                    {u['이름'] || u['성명']}
                                                </span>
                                            ))
                                    ) : (
                                        <span className="text-sm text-gray-500 italic">선택된 사용자가 없습니다.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCopyEmails}
                                disabled={selectedEmailUsers.size === 0}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 font-medium transition ${selectedEmailUsers.size === 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Copy className="w-4 h-4" />
                                <span>이메일 복사</span>
                            </button>
                            <a
                                href={gmailUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition ${selectedEmailUsers.size === 0 || gmailUrl === '#'
                                    ? 'bg-sky-50 text-sky-300 cursor-not-allowed pointer-events-none'
                                    : 'bg-sky-200 text-sky-900 hover:bg-sky-300 shadow-sm'
                                    }`}
                                onClick={(e) => {
                                    if (selectedEmailUsers.size === 0 || gmailUrl === '#') {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <Mail className="w-4 h-4" />
                                <span>Gmail 이용</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
            {/* Duplicate Result Modal */}
            {showDuplicateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">중복 자료 삭제</h2>
                            <p className="text-gray-600 mt-1">
                                총 {duplicateGroups.length}개의 중복 그룹이 발견되었습니다.
                                <br />
                                삭제 버튼을 누르면 각 그룹에서 1명만 남기고 나머지는 삭제됩니다.
                            </p>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            <div className="space-y-4">
                                {duplicateGroups.map((group, index) => {
                                    const user = group[0];
                                    const name = user['이름'] || user['성명'] || '이름 없음';
                                    const hospital = user['병원'] || user['병원명'] || '병원 없음';

                                    return (
                                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-bold text-gray-900">{name} ({hospital})</h3>
                                                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                    {group.length}건 중 {group.length - 1}건 삭제 예정
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500 pl-2 border-l-2 border-gray-200">
                                                {group.map((u, i) => (
                                                    <div key={i} className={`py-1 ${i === 0 ? 'text-green-600 font-medium' : 'text-gray-400 line-through'}`}>
                                                        {i === 0 ? '✅ 유지: ' : '❌ 삭제: '}
                                                        {u['이메일'] || u['email'] || '이메일 없음'}
                                                        <span className="text-xs ml-2 text-gray-400">
                                                            (등록일: {u.createdAt ? new Date(u.createdAt._seconds * 1000).toLocaleDateString() : '-'})
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-white rounded-b-lg">
                            <button
                                onClick={() => setShowDuplicateModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                                disabled={duplicateLoading}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDuplicateDelete}
                                disabled={duplicateLoading}
                                className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-sky-200 text-sky-900 hover:bg-sky-300 font-medium transition shadow-sm disabled:opacity-50 disabled:bg-sky-50 disabled:text-sky-300"
                            >
                                {duplicateLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>삭제 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        <span>삭제</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Deletion Filter Modal */}
            {showAuthDeletionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Firebase Auth 삭제 대상 선택</h2>
                            <button
                                onClick={() => setShowAuthDeletionModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* All checkbox at the top */}
                            <div className="mb-4 pb-4 border-b border-gray-300">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectAllFilter}
                                        onChange={(e) => {
                                            setSelectAllFilter(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedFilterHospitals(new Set());
                                                setSelectedFilterPositions(new Set());
                                                setSelectAllFilterHospitals(false);
                                                setSelectAllFilterPositions(false);
                                            }
                                        }}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900 font-semibold text-lg">all</span>
                                </label>
                            </div>

                            {/* 병원 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">병원</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllFilterHospitals}
                                            onChange={(e) => {
                                                setSelectAllFilterHospitals(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedFilterHospitals(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">all</span>
                                    </label>
                                    {filterHospitals.map((hospital) => (
                                        <label key={hospital} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedFilterHospitals.has(hospital)}
                                                onChange={() => handleFilterHospitalChange(hospital)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{hospital}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 직위 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">직위</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllFilterPositions}
                                            onChange={(e) => {
                                                setSelectAllFilterPositions(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedFilterPositions(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">all</span>
                                    </label>
                                    {filterPositions.map((position) => (
                                        <label key={position} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedFilterPositions.has(position)}
                                                onChange={() => handleFilterPositionChange(position)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{position}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 이름 입력 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">이름</h3>
                                <input
                                    type="text"
                                    value={filterNameInput}
                                    onChange={(e) => setFilterNameInput(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                            </div>

                            {/* 선택된 사용자 목록 */}
                            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    삭제 대상 ({loadingFilteredUsers ? '로딩 중...' : filteredUsersForDeletion.length}명)
                                </h3>
                                {loadingFilteredUsers ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredUsersForDeletion.length > 0 ? (
                                    <div className="max-h-48 overflow-y-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {filteredUsersForDeletion.slice(0, 50).map((user, index) => (
                                                <div key={index} className="text-sm text-gray-700 p-2 bg-white rounded border">
                                                    {user['이름'] || user['성명']} ({user['병원'] || user['병원명']}) - {user['이메일'] || user['email'] || user['Email'] || user['EMAIL']}
                                                </div>
                                            ))}
                                        </div>
                                        {filteredUsersForDeletion.length > 50 && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                ... 외 {filteredUsersForDeletion.length - 50}명
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">선택된 사용자가 없습니다.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowAuthDeletionModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleAuthDeletionConfirm}
                                disabled={filteredUsersForDeletion.length === 0 || authDeletionLoading}
                                className={`px-6 py-2 rounded-lg font-medium transition ${filteredUsersForDeletion.length === 0 || authDeletionLoading
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                {authDeletionLoading ? '삭제 중...' : `삭제 (${filteredUsersForDeletion.length}명)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Deletion Filter Modal */}
            {showVideoDeletionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">제출 동영상 삭제 대상 선택</h2>
                            <button
                                onClick={() => setShowVideoDeletionModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* All checkbox at the top */}
                            <div className="mb-4 pb-4 border-b border-gray-300">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectAllVideoFilter}
                                        onChange={(e) => {
                                            setSelectAllVideoFilter(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedVideoFilterHospitals(new Set());
                                                setSelectedVideoFilterPositions(new Set());
                                                setSelectAllVideoFilterHospitals(false);
                                                setSelectAllVideoFilterPositions(false);
                                            }
                                        }}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900 font-semibold text-lg">all</span>
                                </label>
                            </div>

                            {/* 병원 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">병원</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllVideoFilterHospitals}
                                            onChange={(e) => {
                                                setSelectAllVideoFilterHospitals(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedVideoFilterHospitals(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">all</span>
                                    </label>
                                    {videoFilterHospitals.map((hospital) => (
                                        <label key={hospital} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedVideoFilterHospitals.has(hospital)}
                                                onChange={() => handleVideoFilterHospitalChange(hospital)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{hospital}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 직위 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">직위</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllVideoFilterPositions}
                                            onChange={(e) => {
                                                setSelectAllVideoFilterPositions(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedVideoFilterPositions(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">all</span>
                                    </label>
                                    {videoFilterPositions.map((position) => (
                                        <label key={position} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedVideoFilterPositions.has(position)}
                                                onChange={() => handleVideoFilterPositionChange(position)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{position}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 이름 입력 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">이름</h3>
                                <input
                                    type="text"
                                    value={videoFilterNameInput}
                                    onChange={(e) => setVideoFilterNameInput(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                            </div>

                            {/* 선택된 사용자 목록 */}
                            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    삭제 대상 ({loadingFilteredUsersForVideoDeletion ? '로딩 중...' : filteredUsersForVideoDeletion.length}명)
                                </h3>
                                {loadingFilteredUsersForVideoDeletion ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredUsersForVideoDeletion.length > 0 ? (
                                    <div className="max-h-48 overflow-y-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {filteredUsersForVideoDeletion.slice(0, 50).map((user, index) => (
                                                <div key={index} className="text-sm text-gray-700 p-2 bg-white rounded border">
                                                    {user.name || user['이름'] || user['성명']} ({user.hospital || user['병원'] || user['병원명']}) - {user.email || user['이메일'] || user['email'] || user['Email'] || user['EMAIL']}
                                                </div>
                                            ))}
                                        </div>
                                        {filteredUsersForVideoDeletion.length > 50 && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                ... 외 {filteredUsersForVideoDeletion.length - 50}명
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">선택된 사용자가 없습니다.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowVideoDeletionModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleVideoDeletionConfirm}
                                disabled={filteredUsersForVideoDeletion.length === 0 || videoDeleteLoading}
                                className={`px-6 py-2 rounded-lg font-medium transition ${filteredUsersForVideoDeletion.length === 0 || videoDeleteLoading
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                {videoDeleteLoading ? '삭제 중...' : `삭제 (${filteredUsersForVideoDeletion.length}명)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Deletion Filter Modal */}
            {showLogDeletionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">로그 파일 삭제 대상 선택</h2>
                            <button
                                onClick={() => setShowLogDeletionModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* All checkbox at the top */}
                            <div className="mb-4 pb-4 border-b border-gray-300">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectAllLogFilter}
                                        onChange={(e) => {
                                            setSelectAllLogFilter(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedLogFilterHospitals(new Set());
                                                setSelectedLogFilterPositions(new Set());
                                                setSelectAllLogFilterHospitals(false);
                                                setSelectAllLogFilterPositions(false);
                                            }
                                        }}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900 font-semibold text-lg">all</span>
                                </label>
                            </div>

                            {/* 병원 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">병원</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllLogFilterHospitals}
                                            onChange={(e) => {
                                                setSelectAllLogFilterHospitals(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedLogFilterHospitals(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">all</span>
                                    </label>
                                    {logFilterHospitals.map((hospital) => (
                                        <label key={hospital} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedLogFilterHospitals.has(hospital)}
                                                onChange={() => handleLogFilterHospitalChange(hospital)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{hospital}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 직위 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">직위</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllLogFilterPositions}
                                            onChange={(e) => {
                                                setSelectAllLogFilterPositions(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedLogFilterPositions(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">all</span>
                                    </label>
                                    {logFilterPositions.map((position) => (
                                        <label key={position} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedLogFilterPositions.has(position)}
                                                onChange={() => handleLogFilterPositionChange(position)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{position}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 이름 입력 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">이름</h3>
                                <input
                                    type="text"
                                    value={logFilterNameInput}
                                    onChange={(e) => setLogFilterNameInput(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                            </div>

                            {/* 선택된 사용자 목록 */}
                            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    삭제 대상 ({loadingFilteredUsersForLogDeletion ? '로딩 중...' : filteredUsersForLogDeletion.length}명)
                                </h3>
                                {loadingFilteredUsersForLogDeletion ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredUsersForLogDeletion.length > 0 ? (
                                    <div className="max-h-48 overflow-y-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {filteredUsersForLogDeletion.slice(0, 50).map((user, index) => (
                                                <div key={index} className="text-sm text-gray-700 p-2 bg-white rounded border">
                                                    {user.name || user['이름'] || user['성명']} ({user.hospital || user['병원'] || user['병원명']}) - {user.email || user['이메일'] || user['email'] || user['Email'] || user['EMAIL']}
                                                </div>
                                            ))}
                                        </div>
                                        {filteredUsersForLogDeletion.length > 50 && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                ... 외 {filteredUsersForLogDeletion.length - 50}명
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">선택된 사용자가 없습니다.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowLogDeletionModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleLogDeletionConfirm}
                                disabled={filteredUsersForLogDeletion.length === 0 || logDeleteLoading}
                                className={`px-6 py-2 rounded-lg font-medium transition ${filteredUsersForLogDeletion.length === 0 || logDeleteLoading
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                {logDeleteLoading ? '삭제 중...' : `삭제 (${filteredUsersForLogDeletion.length}명)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Push Filter Modal */}
            {showAuthPushModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Firebase Auth 등록 대상 선택</h2>
                            <button
                                onClick={() => setShowAuthPushModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* All checkbox at the top */}
                            <div className="mb-4 pb-4 border-b border-gray-300">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectAllPushFilter}
                                        onChange={(e) => {
                                            setSelectAllPushFilter(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedPushFilterHospitals(new Set());
                                                setSelectedPushFilterPositions(new Set());
                                                setSelectAllPushFilterHospitals(false);
                                                setSelectAllPushFilterPositions(false);
                                            }
                                        }}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900 font-semibold text-lg">all</span>
                                </label>
                            </div>

                            {/* 병원 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">병원</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllPushFilterHospitals}
                                            onChange={(e) => {
                                                setSelectAllPushFilterHospitals(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedPushFilterHospitals(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">all</span>
                                    </label>
                                    {pushFilterHospitals.map((hospital) => (
                                        <label key={hospital} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedPushFilterHospitals.has(hospital)}
                                                onChange={() => handlePushFilterHospitalChange(hospital)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{hospital}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 직위 선택 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">직위</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAllPushFilterPositions}
                                            onChange={(e) => {
                                                setSelectAllPushFilterPositions(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedPushFilterPositions(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">all</span>
                                    </label>
                                    {pushFilterPositions.map((position) => (
                                        <label key={position} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedPushFilterPositions.has(position)}
                                                onChange={() => handlePushFilterPositionChange(position)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{position}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 이름 입력 */}
                            <div className="border border-gray-300 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">이름</h3>
                                <input
                                    type="text"
                                    value={pushFilterNameInput}
                                    onChange={(e) => setPushFilterNameInput(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                            </div>

                            {/* 선택된 사용자 목록 */}
                            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    등록 대상 ({loadingFilteredUsersForPush ? '로딩 중...' : filteredUsersForPush.length}명)
                                </h3>
                                {loadingFilteredUsersForPush ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredUsersForPush.length > 0 ? (
                                    <div className="max-h-48 overflow-y-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {filteredUsersForPush.slice(0, 50).map((user, index) => (
                                                <div key={index} className="text-sm text-gray-700 p-2 bg-white rounded border">
                                                    {user.name || user['이름'] || user['성명']} ({user.hospital || user['병원'] || user['병원명']}) - {user.email || user['이메일'] || user['email'] || user['Email'] || user['EMAIL']}
                                                </div>
                                            ))}
                                        </div>
                                        {filteredUsersForPush.length > 50 && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                ... 외 {filteredUsersForPush.length - 50}명
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">선택된 사용자가 없습니다.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowAuthPushModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleAuthPushConfirm}
                                disabled={filteredUsersForPush.length === 0 || authPushLoading}
                                className={`px-6 py-2 rounded-lg font-medium transition ${filteredUsersForPush.length === 0 || authPushLoading
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {authPushLoading ? '등록 중...' : `등록 (${filteredUsersForPush.length}명)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Concurrent Login Report Modal */}
            {showConcurrentLogins && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">동시 접속 발생 보고</h2>
                            <button
                                onClick={() => {
                                    setShowConcurrentLogins(false);
                                    setSelectedRecord(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {selectedRecord ? (
                                // 세부 정보 표시
                                <div>
                                    <h3 className="text-xl font-semibold mb-4">세부 정보</h3>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold mb-2">사용자 정보</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><strong>이름:</strong> {selectedRecord.name}</div>
                                                <div><strong>병원:</strong> {selectedRecord.hospital || '정보 없음'}</div>
                                                <div className="col-span-2"><strong>이메일:</strong> {selectedRecord.email}</div>
                                                <div><strong>발생 시간:</strong> {new Date(selectedRecord.detectedAt).toLocaleString('ko-KR')}</div>
                                                <div><strong>겹친 시간:</strong> {Math.round(selectedRecord.overlapDuration / 1000 / 60)}분</div>
                                                <div><strong>동시 세션 수:</strong> {selectedRecord.totalConcurrentSessions}</div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold mb-2">새로운 세션</h4>
                                            <div className="space-y-1 text-sm">
                                                <div><strong>세션 ID:</strong> {selectedRecord.newSession.sessionId}</div>
                                                <div><strong>IP 주소:</strong> {selectedRecord.newSession.ipAddress}</div>
                                                <div><strong>호스트명:</strong> {selectedRecord.newSession.hostname || 'Unknown'}</div>
                                                <div><strong>로그인 시간:</strong> {new Date(selectedRecord.newSession.loginTime).toLocaleString('ko-KR')}</div>
                                                <div className="mt-2"><strong>User-Agent:</strong></div>
                                                <div className="text-xs bg-white p-2 rounded break-all">{selectedRecord.newSession.userAgent}</div>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <h4 className="font-semibold mb-2">기존 세션들 ({selectedRecord.existingSessions.length}개)</h4>
                                            <div className="space-y-3">
                                                {selectedRecord.existingSessions.map((session: any, idx: number) => (
                                                    <div key={idx} className="bg-white p-3 rounded border border-yellow-200">
                                                        <div className="text-sm space-y-1">
                                                            <div><strong>세션 {idx + 1}</strong></div>
                                                            <div><strong>세션 ID:</strong> {session.sessionId}</div>
                                                            <div><strong>IP 주소:</strong> {session.ipAddress}</div>
                                                            <div><strong>호스트명:</strong> {session.hostname || 'Unknown'}</div>
                                                            <div><strong>로그인 시간:</strong> {new Date(session.loginTime).toLocaleString('ko-KR')}</div>
                                                            <div><strong>마지막 활동:</strong> {new Date(session.lastActivity).toLocaleString('ko-KR')}</div>
                                                            <div className="mt-2"><strong>User-Agent:</strong></div>
                                                            <div className="text-xs bg-gray-50 p-2 rounded break-all">{session.userAgent}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedRecord(null)}
                                        className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                                    >
                                        목록으로
                                    </button>
                                </div>
                            ) : (
                                // 리스트 표시
                                <div>
                                    {loadingLogins ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : concurrentLogins.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">동시 접속 기록이 없습니다.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border p-3 text-left">병원</th>
                                                        <th className="border p-3 text-left">이름</th>
                                                        <th className="border p-3 text-left">이메일</th>
                                                        <th className="border p-3 text-left">발생 날짜/시간</th>
                                                        <th className="border p-3 text-center">동시 세션 수</th>
                                                        <th className="border p-3 text-center">겹친 시간</th>
                                                        <th className="border p-3 text-center">작업</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {concurrentLogins.map((record) => (
                                                        <tr key={record.id} className="hover:bg-gray-50">
                                                            <td className="border p-3">{record.hospital || '-'}</td>
                                                            <td className="border p-3">{record.name}</td>
                                                            <td className="border p-3">{record.email}</td>
                                                            <td className="border p-3">{new Date(record.detectedAt).toLocaleString('ko-KR')}</td>
                                                            <td className="border p-3 text-center">{record.totalConcurrentSessions}</td>
                                                            <td className="border p-3 text-center">{Math.round((record.overlapDuration || 0) / 1000 / 60)}분</td>
                                                            <td className="border p-3 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => loadRecordDetails(record.id)}
                                                                        className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 transition"
                                                                    >
                                                                        상세보기
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteConcurrentLogin(record.id)}
                                                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition flex items-center"
                                                                        title="삭제"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Management Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">관리자 관리</h2>
                            <button
                                onClick={() => {
                                    setShowAdminModal(false);
                                    setNewAdminEmail('');
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Add Admin Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">관리자 추가</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={newAdminEmail}
                                        onChange={(e) => setNewAdminEmail(e.target.value)}
                                        placeholder="이메일 주소 입력"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddAdmin();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleAddAdmin}
                                        disabled={addingAdmin || !newAdminEmail.trim()}
                                        className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${addingAdmin || !newAdminEmail.trim()
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                            }`}
                                    >
                                        <UserPlus className="w-5 h-5" />
                                        {addingAdmin ? '추가 중...' : '추가'}
                                    </button>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    Firebase Authentication에 등록된 사용자만 관리자로 추가할 수 있습니다.
                                </p>
                            </div>

                            {/* Admin List */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">관리자 목록</h3>
                                {loadingAdmins ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                ) : admins.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">관리자가 없습니다.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {admins.map((email) => {
                                            const isPrimary = email.toLowerCase() === 'jhlee409@gmail.com';
                                            return (
                                                <div
                                                    key={email}
                                                    className={`flex items-center justify-between p-4 rounded-lg border ${isPrimary
                                                        ? 'bg-purple-50 border-purple-200'
                                                        : 'bg-gray-50 border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Shield className={`w-5 h-5 ${isPrimary ? 'text-purple-600' : 'text-gray-600'}`} />
                                                        <div>
                                                            <div className="font-medium text-gray-900">{email}</div>
                                                            {isPrimary && (
                                                                <div className="text-xs text-purple-600 mt-1">
                                                                    Primary Admin (삭제 불가)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!isPrimary && (
                                                        <button
                                                            onClick={() => handleRemoveAdmin(email)}
                                                            disabled={removingAdmin === email}
                                                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${removingAdmin === email
                                                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                                                : 'bg-red-500 text-white hover:bg-red-600'
                                                                }`}
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                            {removingAdmin === email ? '제거 중...' : '제거'}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => {
                                    setShowAdminModal(false);
                                    setNewAdminEmail('');
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
