/**
 * Server-side Authentication Helper Functions
 * These functions use Firebase Admin SDK and should ONLY be used in server-side code
 * (API routes, server components, server actions)
 */
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * Primary admin emails - have admin privileges
 */
export const PRIMARY_ADMIN_EMAILS = ['jhlee409@gmail.com', 'ghlee409@amc.seoul.kr'];

/**
 * Super admin email - absolutely cannot be deleted from Firebase Auth
 */
export const SUPER_ADMIN_EMAIL = 'jhlee409@gmail.com';

/**
 * Check if an email is a primary admin
 */
export function isPrimaryAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return PRIMARY_ADMIN_EMAILS.some(adminEmail => 
        email.toLowerCase() === adminEmail.toLowerCase()
    );
}

/**
 * Check if an email is the super admin (undeletable from Firebase Auth)
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Check if an email belongs to an admin
 * Server-side helper function - checks Firestore
 * This is the authoritative source for admin status
 * 
 * @param email Email address to check
 * @returns Promise<boolean> True if the email is an admin
 */
export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
    if (!email) return false;
    
    // Always consider primary admins as admin
    if (isPrimaryAdminEmail(email)) return true;
    
    // Check Firestore for other admins
    try {
        const adminDb = getAdminDb();
        const adminDoc = await adminDb.collection('admins').doc(email.toLowerCase()).get();
        return adminDoc.exists;
    } catch (error) {
        console.error('Error checking admin status:', error);
        // Fallback: only primary admin if Firestore check fails
        return false;
    }
}

