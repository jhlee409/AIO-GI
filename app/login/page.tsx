/**
 * Login Page
 * Login with Firebase Auth - all users go to home page after login
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [saveEmailId, setSaveEmailId] = useState(true);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
    const router = useRouter();

    const SAVED_EMAIL_ID_KEY = 'login_saved_email_id';

    // Load saved email ID from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const saved = localStorage.getItem(SAVED_EMAIL_ID_KEY);
            if (saved && saved.trim()) setEmail(saved.trim());
        } catch {
            // ignore
        }
    }, []);

    // Load background image from Firebase Storage
    useEffect(() => {
        const loadBackgroundImage = async () => {
            try {
                const response = await fetch('/api/login-background-url');
                if (response.ok) {
                    const data = await response.json();
                    setBackgroundImageUrl(data.url);
                } else {
                    console.warn('Failed to load login background image');
                }
            } catch (err) {
                console.error('Error loading background image:', err);
            }
        };

        loadBackgroundImage();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // First, verify user credentials against patients collection
            const verifyResponse = await fetch('/api/user/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                setError(verifyData.error || '등록된 사용자 정보와 일치하지 않습니다. 다시 입력해주세요.');
                setLoading(false);
                return;
            }

            // If verification succeeds, proceed with Firebase Auth login
            if (!auth) {
                throw new Error('Firebase Auth is not initialized');
            }
            await signInWithEmailAndPassword(auth, email, password);

            // Create session and check for concurrent logins
            try {
                // Get hostname (browser hostname, not computer name)
                const hostname = typeof window !== 'undefined' ? window.location.hostname : 'Unknown';

                const sessionResponse = await fetch('/api/user/session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        action: 'create',
                        hostname: hostname
                    }),
                });

                const sessionData = await sessionResponse.json();

                // Store session ID in localStorage
                if (sessionData.sessionId) {
                    localStorage.setItem('sessionId', sessionData.sessionId);
                    localStorage.setItem('userEmail', email);
                }

                // Show warning if concurrent sessions detected
                if (sessionData.hasConcurrentSessions) {
                    alert('경고: 동일한 계정이 다른 기기에서 이미 로그인되어 있습니다. 관리자에게 알림이 전송되었습니다.');
                }
            } catch (sessionError) {
                // Session creation failure should not block login
                console.error('Failed to create session:', sessionError);
            }

            // Save or clear email ID based on user preference
            try {
                if (saveEmailId && email.trim()) {
                    localStorage.setItem(SAVED_EMAIL_ID_KEY, email.trim());
                } else {
                    localStorage.removeItem(SAVED_EMAIL_ID_KEY);
                }
            } catch {
                // ignore
            }

            // All users go to home page after login
            router.push('/');
        } catch (err: any) {
            console.error('Login error:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);

            // Provide more specific error messages
            if (err.code === 'auth/invalid-credential') {
                setError('이메일 또는 비밀번호가 올바르지 않습니다. 관리자에게 문의하거나 사용자 관리 페이지에서 계정이 등록되어 있는지 확인해주세요.');
            } else if (err.code === 'auth/wrong-password') {
                setError('비밀번호가 올바르지 않습니다.');
            } else if (err.code === 'auth/user-not-found') {
                setError('등록되지 않은 사용자입니다. 관리자에게 문의하여 계정을 등록해주세요.');
            } else if (err.code === 'auth/invalid-email') {
                setError('올바른 이메일 형식이 아닙니다.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
            } else if (err.code === 'auth/user-disabled') {
                setError('이 계정은 비활성화되었습니다. 관리자에게 문의해주세요.');
            } else {
                setError(`로그인에 실패했습니다: ${err.message || '알 수 없는 오류'}. 다시 시도해주세요.`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: backgroundImageUrl
                        ? `url(${backgroundImageUrl})`
                        : 'linear-gradient(to bottom right, rgb(239 246 255), rgb(219 234 254))',
                    opacity: backgroundImageUrl ? 0.5 : 1,
                }}
            />

            {/* Light overlay for better readability */}
            <div className="absolute inset-0 bg-white/30" />

            {/* Content */}
            <div className="relative z-10 w-full flex flex-col items-center">
                {/* Main Title */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent mb-2 tracking-tight no-underline pb-2">
                        AIO-GI (All-in-one-GI)
                    </h1>
                </div>

                <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                            <LogIn className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">로그인</h2>
                        <p className="text-gray-600 mt-2">등록된 계정으로 로그인하세요</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                이메일
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="off"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                placeholder="your-email@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="save-email-id"
                                type="checkbox"
                                checked={saveEmailId}
                                onChange={(e) => setSaveEmailId(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="save-email-id" className="text-sm text-gray-700 cursor-pointer">
                                이메일 ID 저장
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>관리자에게 등록하신 이메일주소와 비밀번호로 로그인하세요.</p>
                        <p>공공장소에서는 등록정보 자동저장 기능을 사용하지 마세요.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
