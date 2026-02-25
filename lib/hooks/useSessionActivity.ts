/**
 * Session Activity Hook
 * Updates session activity periodically
 * Handles browser/tab close events and page visibility changes
 */
'use client';

import { useEffect, useRef } from 'react';

export function useSessionActivity() {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isPageVisibleRef = useRef(true);

    useEffect(() => {
        const updateActivity = async () => {
            // Check if we're in browser environment
            if (typeof window === 'undefined') return;

            // Don't update if page is not visible
            if (!isPageVisibleRef.current) {
                return;
            }

            const sessionId = localStorage.getItem('sessionId');
            const email = localStorage.getItem('userEmail');

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
                            action: 'update'
                        }),
                    });
                } catch (error) {
                    console.error('Failed to update session activity:', error);
                }
            }
        };

        const cleanupSession = async () => {
            // Check if we're in browser environment
            if (typeof window === 'undefined') return;

            const sessionId = localStorage.getItem('sessionId');
            const email = localStorage.getItem('userEmail');

            if (sessionId && email) {
                try {
                    // Use sendBeacon for reliable delivery on page unload
                    const data = JSON.stringify({
                        email,
                        sessionId,
                        action: 'delete'
                    });

                    // Try sendBeacon first (more reliable for page unload)
                    if (navigator.sendBeacon) {
                        const blob = new Blob([data], { type: 'application/json' });
                        navigator.sendBeacon('/api/user/session', blob);
                    } else {
                        // Fallback to fetch with keepalive
                        await fetch('/api/user/session', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: data,
                            keepalive: true
                        });
                    }
                } catch (error) {
                    console.error('Failed to cleanup session:', error);
                }
            }
        };

        // Handle page visibility changes
        const handleVisibilityChange = () => {
            isPageVisibleRef.current = !document.hidden;
            
            // If page becomes visible, update activity immediately
            if (!document.hidden) {
                updateActivity();
            }
        };

        // Handle beforeunload (browser/tab close)
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Cleanup session on page unload
            cleanupSession();
        };

        // Handle pagehide (more reliable than beforeunload on mobile)
        const handlePageHide = () => {
            cleanupSession();
        };

        // Update every 5 minutes
        intervalRef.current = setInterval(updateActivity, 5 * 60 * 1000);

        // Initial update
        updateActivity();

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            // Cleanup interval
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            // Cleanup event listeners
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);

            // Cleanup session on component unmount
            cleanupSession();
        };
    }, []);
}

