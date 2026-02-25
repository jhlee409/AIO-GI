/**
 * Instructor Login History Page
 * Shows login history for all instructors for the past month
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User } from 'lucide-react';

interface LoginHistory {
    email: string;
    name: string;
    hospital: string;
    loginTime: Date;
    lastActivity?: Date;
    logoutTime?: Date;
    ipAddress: string;
    userAgent: string;
    hostname?: string;
    sessionId: string;
    isActive: boolean;
}

interface InstructorHistory {
    instructor: {
        email: string;
        name: string;
        hospital: string;
    };
    sessions: LoginHistory[];
}

export default function InstructorLoginHistoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<InstructorHistory[]>([]);
    const [allInstructors, setAllInstructors] = useState<Array<{ email: string; name: string; hospital: string }>>([]);
    const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/admin/instructor-login-history');
            
            if (!response.ok) {
                throw new Error('로그인 이력을 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            setHistory(data.history || []);
            setAllInstructors(data.instructors || []);
        } catch (err: any) {
            console.error('Error loading history:', err);
            setError(err.message || '로그인 이력을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return '-';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getDuration = (loginTime: Date, lastActivity?: Date, logoutTime?: Date) => {
        const login = loginTime instanceof Date ? loginTime : new Date(loginTime);
        const end = logoutTime 
            ? (logoutTime instanceof Date ? logoutTime : new Date(logoutTime))
            : (lastActivity 
                ? (lastActivity instanceof Date ? lastActivity : new Date(lastActivity))
                : new Date());
        
        const diffMs = end.getTime() - login.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}시간 ${minutes}분`;
        }
        return `${minutes}분`;
    };

    const filteredHistory = selectedInstructor
        ? (() => {
            // Find the selected instructor in history
            const found = history.find(h => h.instructor.email.toLowerCase() === selectedInstructor.toLowerCase());
            if (found) {
                return [found];
            }
            // If not found in history, create an entry with empty sessions
            const instructor = allInstructors.find(i => i.email.toLowerCase() === selectedInstructor.toLowerCase());
            if (instructor) {
                return [{
                    instructor: {
                        email: instructor.email,
                        name: instructor.name,
                        hospital: instructor.hospital
                    },
                    sessions: []
                }];
            }
            return [];
        })()
        : history;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">로그인 이력을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">교육자 접속 현황</h1>
                            <p className="text-gray-600 mt-1">최근 1개월간의 교육자 로그인 이력</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                        <p>{error}</p>
                    </div>
                )}

                {/* Filter */}
                <div className="mb-6 bg-white p-4 rounded-lg shadow">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        교육자 선택 (전체 보기)
                    </label>
                    <select
                        value={selectedInstructor || ''}
                        onChange={(e) => setSelectedInstructor(e.target.value || null)}
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">전체 교육자</option>
                        {allInstructors.map((instructor) => {
                            const hasHistory = history.some(h => h.instructor.email.toLowerCase() === instructor.email.toLowerCase());
                            return (
                                <option key={instructor.email} value={instructor.email}>
                                    {instructor.name} ({instructor.hospital}) - {instructor.email}
                                    {!hasHistory && ' (로그인 이력 없음)'}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Summary */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">총 교육자 수</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{history.length}명</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">총 로그인 횟수</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                            {history.reduce((sum, h) => sum + h.sessions.length, 0)}회
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">현재 접속 중</div>
                        <div className="text-2xl font-bold text-green-600 mt-1">
                            {history.reduce((sum, h) => sum + h.sessions.filter(s => s.isActive).length, 0)}명
                        </div>
                    </div>
                </div>

                {/* History List - Horizontal Scroll Layout */}
                {filteredHistory.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                        {selectedInstructor ? '선택한 교육자의 로그인 이력이 없습니다.' : '로그인 이력이 없습니다.'}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <div
                                className="grid"
                                style={{ gridTemplateColumns: `repeat(${filteredHistory.length}, minmax(14rem, 1fr))` }}
                            >
                                {filteredHistory.map((item) => (
                                    <div 
                                        key={item.instructor.email} 
                                        className="border-r border-gray-200 last:border-r-0"
                                    >
                                        {/* Instructor Header */}
                                        <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                        {item.instructor.name}
                                                    </h3>
                                                    <div className="text-xs text-gray-600 truncate">
                                                        {item.instructor.hospital}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {item.instructor.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-2">
                                                총 {item.sessions.length}회 로그인
                                                {item.sessions.filter(s => s.isActive).length > 0 && (
                                                    <span className="ml-2 text-green-600 font-medium">
                                                        ({item.sessions.filter(s => s.isActive).length}명 접속 중)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sessions List */}
                                        <div className="max-h-[600px] overflow-y-auto">
                                            {item.sessions.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    로그인 이력 없음
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-100">
                                                    {item.sessions.map((session, idx) => (
                                                        <div 
                                                            key={`${session.sessionId}-${idx}`} 
                                                            className="p-3 hover:bg-gray-50 transition"
                                                        >
                                                            <div className="space-y-2">
                                                                <div className="flex items-start gap-2">
                                                                    <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-xs font-medium text-gray-900">
                                                                            {formatDate(session.loginTime)}
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 mt-1">
                                                                            접속: {getDuration(session.loginTime, session.lastActivity, session.logoutTime)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

