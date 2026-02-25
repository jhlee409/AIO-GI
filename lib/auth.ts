/**
 * Authentication Helper Functions
 * Handles user role checking and authentication state
 * 
 * NOTE: This file is used in both client and server components.
 * For server-side admin checks, use lib/auth-server.ts instead.
 */
import { User } from 'firebase/auth';
import { UserRole } from '@/types';

/**
 * Primary admin emails - cannot be deleted
 * Re-exported from auth-server for client-side use
 */
export const PRIMARY_ADMIN_EMAILS = ['jhlee409@gmail.com', 'ghlee409@amc.seoul.kr'];

/**
 * Check if an email is a primary admin (client-side)
 */
export function isPrimaryAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return PRIMARY_ADMIN_EMAILS.some(adminEmail => 
        email.toLowerCase() === adminEmail.toLowerCase()
    );
}

/**
 * Admin email whitelist (for client-side, fallback)
 * Server-side functions should use lib/auth-server.ts
 */
const ADMIN_EMAILS = [
    ...PRIMARY_ADMIN_EMAILS,
    // Add more admin emails here (will be synced from Firestore)
];

/**
 * Check if a user has admin role
 * Client-side: Uses cached admin list
 * Server-side: Should use isAdminEmail() from lib/auth-server.ts which checks Firestore
 */
export function isAdmin(user: User | null): boolean {
    if (!user || !user.email) return false;
    // Client-side: Use cached list
    // For server-side, use lib/auth-server.ts isAdminEmail() instead
    return ADMIN_EMAILS.includes(user.email);
}

/**
 * Get user role based on email or custom claims
 */
export function getUserRole(user: User | null): UserRole {
    if (!user) return 'user';
    return isAdmin(user) ? 'admin' : 'user';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: User | null): boolean {
    return user !== null;
}

/**
 * Synchronous version for backward compatibility (client-side only)
 * WARNING: This only checks the static list, not Firestore
 * For server-side checks, use isAdminEmail() from lib/auth-server.ts
 */
export function isAdminEmailSync(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}