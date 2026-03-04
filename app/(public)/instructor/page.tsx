/**
 * Instructor Panel Page
 * Panel for instructors to manage their content
 */
'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function InstructorPage() {
    const { user, loading, role } = useAuth();
    const router = useRouter();
    const [isInstructor, setIsInstructor] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);
    const [showOutputSelection, setShowOutputSelection] = useState(true);
    const [hospitals, setHospitals] = useState<string[]>([]);
    const [positions, setPositions] = useState<string[]>([]);
    const [selectedHospitals, setSelectedHospitals] = useState<Set<string>>(new Set());
    const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
    const [nameInput, setNameInput] = useState('');
    const [courses, setCourses] = useState<string[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
    const [selectAllHospitals, setSelectAllHospitals] = useState(false);
    const [selectAllPositions, setSelectAllPositions] = useState(false);
    const [selectAllCourses, setSelectAllCourses] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportData, setReportData] = useState<any[][] | null>(null);
    const [reportMessage, setReportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [userHospital, setUserHospital] = useState<string>('');
    const isAdmin = role === 'admin';
    const reportWindowRef = useRef<Window | null>(null);

    useEffect(() => {
        const checkInstructorStatus = async () => {
            if (!user?.email) {
                setIsInstructor(false);
                setChecking(false);
                return;
            }

            try {
                const response = await fetch(`/api/user/instructor-status?email=${encodeURIComponent(user.email)}`);
                if (!response.ok) {
                    throw new Error('Failed to check instructor status');
                }
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    setIsInstructor(data.isInstructor);
                } else {
                    console.error('Expected JSON but got:', contentType);
                    setIsInstructor(false);
                }
            } catch (error) {
                console.error('Error checking instructor status:', error);
                setIsInstructor(false);
            } finally {
                setChecking(false);
            }
        };

        if (!loading) {
            checkInstructorStatus();
        }
    }, [user, loading]);

    useEffect(() => {
        if (!loading && !checking && !isInstructor) {
            // Redirect to home if not an instructor
            router.push('/');
        }
    }, [loading, checking, isInstructor, router]);

    // Load user profile (hospital information) - 관리자도 포함
    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user?.email) return;

            try {
                const response = await fetch(`/api/user/profile?email=${encodeURIComponent(user.email)}`);
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        setUserHospital(data.hospital || '');
                    }
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        };

        if (isInstructor) {
            loadUserProfile();
        }
    }, [user, isInstructor]);

    // Load filter options (hospitals and positions)
    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const response = await fetch('/api/instructor/filter-options');
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        const allHospitals = data.hospitals || [];

                        // 교육자인 경우 자신의 병원만 필터링, 관리자는 모든 병원
                        if (!isAdmin && userHospital) {
                            const filteredHospitals = allHospitals.filter((hospital: string) =>
                                hospital === userHospital
                            );
                            setHospitals(filteredHospitals);
                        } else {
                            setHospitals(allHospitals);
                        }

                        setPositions(data.positions || []);
                    } else {
                        console.error('Expected JSON but got:', contentType);
                    }
                }
            } catch (error) {
                console.error('Error loading filter options:', error);
            }
        };

        if (isInstructor) {
            // 관리자인 경우 바로 로드, 교육자인 경우 병원 정보를 먼저 가져온 후 로드
            if (isAdmin || userHospital) {
                loadFilterOptions();
            }
        }
    }, [isInstructor, isAdmin, userHospital]);

    // Load categories from lecture list
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await fetch('/api/instructor/categories');
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        let categories = data.categories || [];

                        setCourses(categories);
                    } else {
                        console.error('Expected JSON but got:', contentType);
                    }
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        if (isInstructor) {
            // 병원 정보가 로드된 후에 카테고리 로드 (관리자도 병원 정보 필요)
            if (userHospital !== undefined) {
                loadCategories();
            }
        }
    }, [isInstructor, userHospital]);

    // Handle "all" hospitals checkbox - only select all when toggled ON
    useEffect(() => {
        if (selectAllHospitals) {
            if (!isAdmin && userHospital) {
                setSelectedHospitals(new Set([userHospital]));
            } else {
                setSelectedHospitals(new Set(hospitals));
            }
        }
    }, [selectAllHospitals, hospitals, isAdmin, userHospital]);

    // Handle "all" positions checkbox - only select all when toggled ON
    useEffect(() => {
        if (selectAllPositions) {
            setSelectedPositions(new Set(positions));
        }
    }, [selectAllPositions, positions]);

    // Handle "all" courses checkbox - only select all when toggled ON
    useEffect(() => {
        if (selectAllCourses) {
            setSelectedCourses(new Set(courses));
        }
    }, [selectAllCourses, courses]);

    const handleOutputSelectionClick = () => {
        setShowOutputSelection(true);
        // Reset filters when opening the selection modal
        setSelectedHospitals(new Set());
        setSelectedPositions(new Set());
        setSelectedCourses(new Set());
        setNameInput('');
        setSelectAllHospitals(false);
        setSelectAllPositions(false);
        setSelectAllCourses(false);
    };

    const handleHospitalChange = (hospital: string) => {
        // 교육자인 경우 자신의 병원만 선택 가능
        if (!isAdmin && userHospital && hospital !== userHospital) {
            setReportMessage({
                type: 'error',
                text: '자신이 속한 병원만 선택할 수 있습니다.'
            });
            setTimeout(() => setReportMessage(null), 3000);
            return;
        }

        const newSelected = new Set(selectedHospitals);
        if (newSelected.has(hospital)) {
            newSelected.delete(hospital);
        } else {
            newSelected.add(hospital);
        }
        setSelectedHospitals(newSelected);
        // If all hospitals are selected, check "all" checkbox
        if (newSelected.size === hospitals.length && hospitals.length > 0) {
            setSelectAllHospitals(true);
        } else {
            setSelectAllHospitals(false);
        }
    };

    const handlePositionChange = (position: string) => {
        const newSelected = new Set(selectedPositions);
        if (newSelected.has(position)) {
            newSelected.delete(position);
        } else {
            newSelected.add(position);
        }
        setSelectedPositions(newSelected);
        // If all positions are selected, check "all" checkbox
        if (newSelected.size === positions.length && positions.length > 0) {
            setSelectAllPositions(true);
        } else {
            setSelectAllPositions(false);
        }
    };

    const handleCourseChange = (course: string) => {
        const newSelected = new Set(selectedCourses);
        if (newSelected.has(course)) {
            newSelected.delete(course);
        } else {
            newSelected.add(course);
        }
        setSelectedCourses(newSelected);
        // If all courses are selected, check "all" checkbox
        if (newSelected.size === courses.length) {
            setSelectAllCourses(true);
        } else {
            setSelectAllCourses(false);
        }
    };

    const handleResetSelection = () => {
        // Reset all selections
        setSelectedHospitals(new Set());
        setSelectedPositions(new Set());
        setSelectedCourses(new Set());
        setNameInput('');
        setSelectAllHospitals(false);
        setSelectAllPositions(false);
        setSelectAllCourses(false);
        // Switch to output selection screen
        setShowOutputSelection(true);
        // Clear any report messages
        setReportMessage(null);
    };

    const buildReportTableHTML = useCallback((data: any[][], recentlyChangedCells?: [number, number][]) => {
        const recentlySet = new Set(recentlyChangedCells?.map(([r, c]) => `${r},${c}`) ?? []);
        let html = '<table style="border-collapse:collapse;table-layout:auto;width:max-content;min-width:100%">';
        // thead
        html += '<thead style="position:sticky;top:0;background:#f3f4f6;z-index:10">';
        for (let r = 0; r < 2 && r < data.length; r++) {
            html += '<tr>';
            (data[r] || []).forEach((cell: any, ci: number) => {
                const v = cell || '';
                let style = 'padding:4px 4px;border:1px solid #d1d5db;font-weight:600;color:#000;text-align:center;';
                if (ci === 0) style += 'position:sticky;left:0;z-index:5;background:#f3f4f6;min-width:200px;width:200px;';
                else if (ci === 1) style += 'position:sticky;left:200px;z-index:5;background:#f3f4f6;min-width:300px;width:300px;';
                html += `<th style="${style}">${v}</th>`;
            });
            html += '</tr>';
        }
        html += '</thead><tbody>';
        // tbody
        data.slice(2).forEach((row: any[], rowIndex: number) => {
            const actualRow = 2 + rowIndex;
            html += '<tr>';
            row.forEach((cell: any, ci: number) => {
                const v = cell || '';
                let style = 'padding:4px 4px;border:1px solid #d1d5db;color:#000;text-align:center;';
                let bg = '';
                if (ci === 0) { bg = '#eff6ff'; style += `position:sticky;left:0;z-index:3;min-width:200px;width:200px;`; }
                else if (ci === 1) { bg = '#f0fdf4'; style += `position:sticky;left:200px;z-index:3;min-width:300px;width:300px;`; }
                if (ci >= 2) {
                    if (v === 'yes' || (typeof v === 'string' && /^\d+$/.test(v) && parseInt(v, 10) > 0)) {
                        bg = '#bbf7d0'; style += 'font-weight:500;';
                    } else if (v === 'no') { style += 'font-weight:500;'; }
                    if (typeof v === 'string' && v.endsWith('%')) {
                        const n = parseInt(v);
                        style += 'font-weight:500;';
                        if (recentlySet.has(`${actualRow},${ci}`)) {
                            bg = '#fef08a'; // 24시간 이내 변경: 노란색
                        } else if (n >= 80) {
                            bg = '#bbf7d0'; // 80% 이상: 연두색
                        }
                        // 80% 미만: bg 없음
                    }
                    // 24시간 이내 변경된 셀(yes, 숫자)은 노란색
                    if (bg && recentlySet.has(`${actualRow},${ci}`) && !(typeof v === 'string' && v.endsWith('%'))) {
                        bg = '#fef08a';
                    }
                }
                if (bg) style += `background:${bg};`;
                html += `<td style="${style}">${v}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        return html;
    }, []);

    const openReportInNewWindow = useCallback((data: any[][], recentlyChangedCells?: [number, number][]) => {
        if (!data || data.length === 0) return;
        if (reportWindowRef.current && !reportWindowRef.current.closed) {
            reportWindowRef.current.close();
        }

        const hospitalStr = selectedHospitals.size > 0
            ? Array.from(selectedHospitals).join('_').replace(/[^a-zA-Z0-9가-힣_]/g, '_')
            : 'all';
        const positionStr = selectedPositions.size > 0
            ? Array.from(selectedPositions).join('_').replace(/[^a-zA-Z0-9가-힣_]/g, '_')
            : 'all';

        const w = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        if (!w) return;
        reportWindowRef.current = w;

        const triggerDownload = (blob: Blob, filename: string) => {
            const childWin = reportWindowRef.current;
            const targetDoc = (childWin && !childWin.closed) ? childWin.document : document;
            const url = URL.createObjectURL(blob);
            const link = targetDoc.createElement('a');
            link.href = url;
            link.download = filename;
            targetDoc.body.appendChild(link);
            link.click();
            targetDoc.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        };

        (window as any).__reportExportExcel = () => {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);
            const colWidths: any[] = [{ wch: 30 }, { wch: 40 }];
            const numUserColumns = data[0]?.length - 2 || 0;
            for (let i = 0; i < numUserColumns; i++) {
                colWidths.push({ wch: 12 });
            }
            ws['!cols'] = colWidths;
            XLSX.utils.book_append_sheet(wb, ws, 'Report');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            triggerDownload(
                new Blob([wbout], { type: 'application/octet-stream' }),
                `report_${hospitalStr}_${positionStr}_${dateStr}.xlsx`
            );
        };

        (window as any).__reportExportCSV = () => {
            const csvRows: string[] = [];
            data.forEach((row) => {
                const csvRow = row.map((cell: any) => {
                    const cellValue = String(cell || '');
                    if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
                        return `"${cellValue.replace(/"/g, '""')}"`;
                    }
                    return cellValue;
                });
                csvRows.push(csvRow.join(','));
            });
            const csvContent = csvRows.join('\n');
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            triggerDownload(
                new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }),
                `report_${hospitalStr}_${positionStr}_${dateStr}.csv`
            );
        };
        const tableHTML = buildReportTableHTML(data, recentlyChangedCells);
        w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>레포트 결과</title>
<style>body{margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
h2{margin:0;font-size:24px;color:#111827;} p.date{margin:4px 0 0;color:#4b5563;}
.btn-group{display:flex;gap:8px;}
button{padding:8px 20px;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;}
.btn-excel{background:#16a34a;} .btn-excel:hover{background:#15803d;}
.btn-csv{background:#2563eb;} .btn-csv:hover{background:#1d4ed8;}
.btn-close{background:#ef4444;} .btn-close:hover{background:#dc2626;}
.table-wrap{overflow:auto;max-height:calc(100vh - 120px);}</style></head>
<body><div class="header"><div><h2>레포트 결과</h2><p class="date">생성일: ${new Date().toLocaleString('ko-KR')}</p></div>
<div class="btn-group"><button class="btn-excel" onclick="window.opener.__reportExportExcel()">Excel출력</button>
<button class="btn-csv" onclick="window.opener.__reportExportCSV()">CSV출력</button>
<button class="btn-close" onclick="window.close()">창 닫기</button></div></div>
<div class="table-wrap">${tableHTML}</div></body></html>`);
        w.document.close();
        const checkClosed = setInterval(() => {
            if (w.closed) {
                clearInterval(checkClosed);
                reportWindowRef.current = null;
                setSelectedHospitals(new Set());
                setSelectedPositions(new Set());
                setSelectedCourses(new Set());
                setNameInput('');
                setSelectAllHospitals(false);
                setSelectAllPositions(false);
                setSelectAllCourses(false);
                setReportMessage(null);
                delete (window as any).__reportExportExcel;
                delete (window as any).__reportExportCSV;
            }
        }, 500);
    }, [buildReportTableHTML, selectedHospitals, selectedPositions]);

    const handleGenerateReport = async () => {
        // Validate selections
        if (selectedHospitals.size === 0 && selectedPositions.size === 0 && !nameInput.trim()) {
            setReportMessage({ type: 'error', text: '병원, 직위, 또는 이름 중 하나 이상을 선택해주세요.' });
            setTimeout(() => setReportMessage(null), 5000);
            return;
        }

        if (selectedCourses.size === 0) {
            setReportMessage({ type: 'error', text: '교육 과정을 하나 이상 선택해주세요.' });
            setTimeout(() => setReportMessage(null), 5000);
            return;
        }

        // 교육자인 경우 자신의 병원만 선택했는지 검증
        if (!isAdmin && userHospital) {
            const selectedHospitalsArray = Array.from(selectedHospitals);
            const hasInvalidHospital = selectedHospitalsArray.some(hospital => hospital !== userHospital);
            if (hasInvalidHospital) {
                setReportMessage({
                    type: 'error',
                    text: '자신이 속한 병원만 선택할 수 있습니다.'
                });
                setTimeout(() => setReportMessage(null), 5000);
                return;
            }
        }

        setIsGeneratingReport(true);
        setReportMessage(null);

        try {
            const response = await fetch('/api/instructor/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hospitals: Array.from(selectedHospitals),
                    positions: Array.from(selectedPositions),
                    name: nameInput.trim(),
                    categories: Array.from(selectedCourses),
                    userEmail: user?.email || '', // 서버 측 검증을 위해 이메일 전달
                }),
            });

            // Check if response is ok and content type is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`서버 오류가 발생했습니다: ${text.substring(0, 100)}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || '레포트 작성 중 오류가 발생했습니다.');
            }

            if (data.success && data.tableData) {
                setReportData(data.tableData);
                setReportMessage({ type: 'success', text: data.message || '레포트 작성이 완료되었습니다.' });
                // 새창에서 레포트 열기 (24시간 이내 변경 셀은 노란색으로 표시)
                openReportInNewWindow(data.tableData, data.recentlyChangedCells);
            } else {
                throw new Error(data.error || data.message || '레포트 작성 중 오류가 발생했습니다.');
            }
        } catch (error: any) {
            console.error('Error generating report:', error);
            setReportMessage({
                type: 'error',
                text: error.message || '레포트 작성 중 오류가 발생했습니다.'
            });
        } finally {
            setIsGeneratingReport(false);
            setTimeout(() => setReportMessage(null), 5000);
        }
    };

    if (loading || checking) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    if (!isInstructor) {
        return null; // Will redirect
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mx-auto" style={{ maxWidth: '1382px' }}>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        교육자 패널
                    </h1>
                    <p className="text-xl text-gray-600">
                        각 과정의 세부 과정들을 학습했는지 확인하세요.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 w-[80%] mx-auto">
                    <div className="flex flex-wrap gap-3 justify-center items-center">
                        <button
                            onClick={handleOutputSelectionClick}
                            className={`px-6 py-2 rounded-lg transition font-medium ${showOutputSelection
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            출력대상선택
                        </button>
                        <button
                            onClick={handleGenerateReport}
                            disabled={isGeneratingReport}
                            className={`px-6 py-2 rounded-lg transition font-medium ${isGeneratingReport
                                ? 'bg-indigo-400 text-white cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            {isGeneratingReport ? '작성 중...' : '레포트 작성'}
                        </button>

                        <button
                            onClick={handleResetSelection}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                        >
                            선택초기화
                        </button>
                    </div>
                    {reportMessage && (
                        <div className={`mt-4 p-3 rounded-lg text-center ${reportMessage.type === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {reportMessage.text}
                        </div>
                    )}

                </div>

                {/* Output Selection Boxes */}
                {showOutputSelection && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 space-y-4 w-[80%] mx-auto">
                        {/* First Box: 병원 */}
                        <div className="border border-gray-300 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">병원</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectAllHospitals}
                                        onChange={(e) => {
                                            setSelectAllHospitals(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedHospitals(new Set());
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">all</span>
                                </label>
                                {hospitals.map((hospital) => (
                                    <label key={hospital} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedHospitals.has(hospital)}
                                            onChange={() => handleHospitalChange(hospital)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">{hospital}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Second Box: 직위 */}
                        <div className="border border-gray-300 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">직위</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectAllPositions}
                                        onChange={(e) => {
                                            setSelectAllPositions(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedPositions(new Set());
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">all</span>
                                </label>
                                {positions.map((position) => (
                                    <label key={position} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedPositions.has(position)}
                                            onChange={() => handlePositionChange(position)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">{position}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Third Box: 이름 */}
                        <div className="border border-gray-300 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">이름</h3>
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="이름을 입력하세요"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            />
                        </div>

                        {/* Fourth Box: 교육 과정 */}
                        <div className="border border-gray-300 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">교육 과정</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectAllCourses}
                                        onChange={(e) => {
                                            setSelectAllCourses(e.target.checked);
                                            if (!e.target.checked) {
                                                setSelectedCourses(new Set());
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">all</span>
                                </label>
                                {courses.map((course) => (
                                    <label key={course} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedCourses.has(course)}
                                            onChange={() => handleCourseChange(course)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">{course === 'AI Hx. taking training' ? 'AI Hx. taking training (CPX)' : course}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
