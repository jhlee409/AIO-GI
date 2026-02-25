/**
 * Auth Context Provider
 * Manages authentication state across the application
 */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { getUserRole } from '@/lib/auth';
import type { UserRole } from '@/types';
import { useAutoLogout } from '@/lib/hooks/useAutoLogout';
import { useSessionActivity } from '@/lib/hooks/useSessionActivity';

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: 'user',
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { showWarning } = useAutoLogout();
    
    // Track session activity for authenticated users
    useSessionActivity();

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);
            
            // Clean up session on logout
            if (!user && typeof window !== 'undefined') {
                const sessionId = localStorage.getItem('sessionId');
                const email = localStorage.getItem('userEmail');
                
                // 로그아웃 시 진행 중인 시청 시간 저장
                if (email) {
                    try {
                        await fetch('/api/video/watch-time/save-on-logout', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                email: email
                            }),
                            keepalive: true, // 로그아웃 시에도 요청이 완료되도록 보장
                        });
                    } catch (error) {
                        console.error('Failed to save watch time on logout:', error);
                        // 에러가 발생해도 계속 진행
                    }
                }
                
                if (sessionId && email) {
                    try {
                        await fetch('/api/user/session', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                email,
                                sessionId,
                                action: 'delete'
                            }),
                        });
                    } catch (error) {
                        console.error('Failed to delete session on logout:', error);
                    }
                    
                    localStorage.removeItem('sessionId');
                    localStorage.removeItem('userEmail');
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const role = getUserRole(user);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
            {/* Auto logout warning message */}
            {showWarning && user && (
                <div className="fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3 animate-pulse">
                    <div className="flex-shrink-0">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold">자동 로그아웃 경고</p>
                        <p className="text-sm">1분 후 자동으로 로그아웃됩니다. 활동을 계속하시려면 페이지를 클릭하세요.</p>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
