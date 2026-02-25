/**
 * Auto Logout Hook
 * Automatically logs out user after 10 minutes of inactivity
 * Shows warning message 1 minute before logout
 */
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const WARNING_TIME = 9 * 60 * 1000; // 9 minutes (1 minute before logout)

export function useAutoLogout() {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const checkVideoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const clearTimers = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
            warningTimeoutRef.current = null;
        }
        if (checkVideoIntervalRef.current) {
            clearInterval(checkVideoIntervalRef.current);
            checkVideoIntervalRef.current = null;
        }
        setShowWarning(false);
    }, []);

    const resetTimer = useCallback(() => {
        // Check if video is currently playing
        // If video is playing, don't reset the timer (prevent auto logout during video playback)
        if (typeof window !== 'undefined') {
            const isVideoPlaying = localStorage.getItem('isVideoPlaying') === 'true';
            if (isVideoPlaying) {
                // Video is playing, don't reset timer but check periodically if video stops
                // Clear existing timers but don't set new ones
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                if (warningTimeoutRef.current) {
                    clearTimeout(warningTimeoutRef.current);
                    warningTimeoutRef.current = null;
                }
                setShowWarning(false);
                
                // Set up periodic check to restart timer when video stops
                if (!checkVideoIntervalRef.current) {
                    checkVideoIntervalRef.current = setInterval(() => {
                        if (typeof window !== 'undefined') {
                            const isVideoStillPlaying = localStorage.getItem('isVideoPlaying') === 'true';
                            if (!isVideoStillPlaying && auth && auth.currentUser && isAuthenticated) {
                                // Video stopped, restart timer
                                clearInterval(checkVideoIntervalRef.current!);
                                checkVideoIntervalRef.current = null;
                                resetTimer();
                            }
                        }
                    }, 5000); // Check every 5 seconds
                }
                return;
            }
        }

        // Clear video check interval if video is not playing
        if (checkVideoIntervalRef.current) {
            clearInterval(checkVideoIntervalRef.current);
            checkVideoIntervalRef.current = null;
        }

        // Clear existing timeouts
        clearTimers();

        // Only set timers if user is authenticated
        if (!auth || !auth.currentUser || !isAuthenticated) {
            return;
        }

        // Set warning timeout (9 minutes)
        warningTimeoutRef.current = setTimeout(() => {
            if (auth && auth.currentUser) {
                // Check again if video is playing before showing warning
                if (typeof window !== 'undefined') {
                    const isVideoPlaying = localStorage.getItem('isVideoPlaying') === 'true';
                    if (isVideoPlaying) {
                        return; // Don't show warning if video is playing
                    }
                }
                setShowWarning(true);
            }
        }, WARNING_TIME);

        // Set logout timeout (10 minutes)
        timeoutRef.current = setTimeout(async () => {
            if (auth && auth.currentUser) {
                // Check again if video is playing before logging out
                if (typeof window !== 'undefined') {
                    const isVideoPlaying = localStorage.getItem('isVideoPlaying') === 'true';
                    if (isVideoPlaying) {
                        // Video is still playing, clear this timeout and let the periodic check handle it
                        clearTimeout(timeoutRef.current!);
                        timeoutRef.current = null;
                        return;
                    }
                }
                try {
                    await signOut(auth);
                    router.push('/login');
                } catch (error) {
                    console.error('Auto logout error:', error);
                }
            }
        }, INACTIVITY_TIMEOUT);
    }, [router, isAuthenticated, clearTimers]);

    // Listen to auth state changes
    useEffect(() => {
        if (!auth) {
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
            setIsAuthenticated(!!user);
            if (!user) {
                clearTimers();
            }
        });

        return () => unsubscribe();
    }, [clearTimers]);

    // Set up activity listeners when authenticated
    useEffect(() => {
        if (!isAuthenticated || !auth || !auth.currentUser) {
            clearTimers();
            return;
        }

        // Activity events to track
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        // Add event listeners
        events.forEach((event) => {
            window.addEventListener(event, resetTimer, true);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer, true);
            });
            clearTimers();
        };
    }, [isAuthenticated, resetTimer, clearTimers]);

    return { showWarning };
}

