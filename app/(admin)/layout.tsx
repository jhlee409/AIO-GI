/**
 * Admin Layout
 * Layout for admin users with header navigation
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { FileUp, Users, LogOut, Home, BookOpen, Settings, GraduationCap } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const [isInstructor, setIsInstructor] = useState(false);
    const [checkingInstructor, setCheckingInstructor] = useState(false);
    const [userPosition, setUserPosition] = useState<string>('');

    // 브라우저를 닫거나 탭을 닫을 때 진행 중인 시청 시간 저장
    useEffect(() => {
        if (!user?.email) return;

        const saveWatchTime = () => {
            const email = user.email;
            if (!email) return;

            // navigator.sendBeacon을 사용하여 더 확실하게 전송 (브라우저 종료 시에도 작동)
            const formData = new FormData();
            formData.append('email', email);

            // sendBeacon이 실패하면 fetch with keepalive 사용
            if (!navigator.sendBeacon('/api/video/watch-time/save-on-logout', formData)) {
                // sendBeacon이 지원되지 않거나 실패한 경우 fetch with keepalive 사용
                fetch('/api/video/watch-time/save-on-logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                    keepalive: true, // 페이지 언로드 후에도 요청이 완료되도록 보장
                }).catch(() => {
                    // 에러는 무시 (브라우저가 닫히는 중이므로)
                });
            }
        };

        // beforeunload 이벤트: 브라우저를 닫거나 새로고침할 때
        const handleBeforeUnload = () => {
            saveWatchTime();
        };

        // pagehide 이벤트: 페이지가 숨겨질 때 (beforeunload보다 더 안정적)
        const handlePageHide = (e: PageTransitionEvent) => {
            // persisted가 false이면 브라우저를 닫거나 탭을 닫는 것
            if (!e.persisted) {
                saveWatchTime();
            }
        };

        // visibilitychange 이벤트: 탭이 숨겨질 때도 저장
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // 탭이 숨겨질 때 진행 중인 시청 세션 저장
                fetch('/api/video/watch-time/save-on-logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: user.email }),
                    keepalive: true,
                }).catch(() => {
                    // 에러는 무시
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user?.email]);

    // Check instructor status and position when user is logged in
    useEffect(() => {
        const checkUserInfo = async () => {
            if (!user?.email || loading) {
                setIsInstructor(false);
                setUserPosition('');
                return;
            }

            setCheckingInstructor(true);
            try {
                // Check instructor status
                const instructorResponse = await fetch(`/api/user/instructor-status?email=${encodeURIComponent(user.email)}`);
                if (instructorResponse.ok) {
                    const data = await instructorResponse.json();
                    setIsInstructor(data.isInstructor || false);
                }

                // Get user position
                const profileResponse = await fetch(`/api/user/profile?email=${encodeURIComponent(user.email)}`);
                if (profileResponse.ok) {
                    const contentType = profileResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const profileData = await profileResponse.json();
                        setUserPosition(profileData.position || '');
                    }
                }
            } catch (error) {
                console.error('Error checking user info:', error);
                setIsInstructor(false);
                setUserPosition('');
            } finally {
                setCheckingInstructor(false);
            }
        };

        checkUserInfo();
    }, [user, loading]);

    useEffect(() => {
        if (!loading && role !== 'admin') {
            router.push('/login');
        }
    }, [loading, role, router]);

    // 시청 시간 저장 함수 (홈 버튼과 로그아웃에서 공통 사용)
    const saveWatchTimeBeforeNavigation = async () => {
        if (user?.email) {
            try {
                await fetch('/api/video/watch-time/save-on-logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: user.email
                    }),
                    keepalive: true, // 요청이 완료되도록 보장
                });
            } catch (error) {
                console.error('Error saving watch time:', error);
            }
        }
    };

    const handleLogout = async () => {
        if (!auth) {
            console.error('Firebase Auth is not initialized');
            return;
        }

        // 로그아웃 전에 진행 중인 시청 시간 저장
        await saveWatchTimeBeforeNavigation();

        await signOut(auth);
        router.push('/login');
    };

    // 홈 버튼 클릭 핸들러
    const handleHomeClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        // 홈으로 이동하기 전에 진행 중인 시청 시간 저장
        // 1. 먼저 커스텀 이벤트를 발생시켜 course page의 saveCurrentVideoWatchTime이 호출되도록 함
        //    (이렇게 하면 동영상 플레이어의 최신 시청 시간이 저장됨)
        const saveEvent = new CustomEvent('saveVideoWatchTime', { bubbles: true });
        window.dispatchEvent(saveEvent);

        // 이벤트 처리 시간을 주기 위해 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 200));

        // 2. 그 다음 save-on-logout API를 호출하여 'checking' 세션을 'final'로 변환
        await saveWatchTimeBeforeNavigation();

        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    if (role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition">
                            <BookOpen className="w-8 h-8" />
                            <span className="text-xl font-bold">AIO-GI (GI Training Program)</span>
                        </Link>

                        <nav className="flex items-center space-x-4 ml-auto">
                            {/* Show Instructor Panel link for instructors (not for R3, F1, F2) */}
                            {!checkingInstructor &&
                                isInstructor &&
                                userPosition !== 'R3' &&
                                userPosition !== 'F1' &&
                                !['F2', 'F2C', 'F2D', 'FCD'].includes(userPosition || '') && (
                                    <Link
                                        href="/instructor"
                                        className="flex items-center space-x-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                                    >
                                        <GraduationCap className="w-5 h-5" />
                                        <span>교육자 패널</span>
                                    </Link>
                                )}

                            {/* Show Admin Panel link only for admins (not for R3, F1, F2) */}
                            {role === 'admin' &&
                                userPosition !== 'R3' &&
                                userPosition !== 'F1' &&
                                !['F2', 'F2C', 'F2D', 'FCD'].includes(userPosition || '') && (
                                    <Link
                                        href="/admin"
                                        className="flex items-center space-x-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                                    >
                                        <Settings className="w-5 h-5" />
                                        <span>관리자 패널</span>
                                    </Link>
                                )}

                            {/* Home button */}
                            <a
                                href="/"
                                onClick={handleHomeClick}
                                className="flex items-center space-x-1 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                            >
                                <Home className="w-5 h-5" />
                                <span>홈</span>
                            </a>

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-1 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>로그아웃</span>
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 bg-gray-50">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-6">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm">© 2026 by Gin Hyug Lee. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
