/**
 * Firebase Admin SDK Initialization
 * CRITICAL: Only use this in Server Components, API Routes, or Server Actions
 * Never import this in Client Components
 */
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getDatabase, Database } from 'firebase-admin/database';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminStorage: Storage | undefined;
let adminDb: Firestore | undefined;
let adminRealtimeDb: Database | undefined;
let isInitializing = false;
let initializationError: Error | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses singleton pattern to prevent multiple initializations
 * 
 * In Cloud Functions environment, uses Application Default Credentials
 * In local/other environments, uses explicit service account credentials
 */
function initializeAdminApp() {
    // Already initialized
    if (adminApp && adminAuth && adminStorage && adminDb) {
        return;
    }

    // Already initializing, wait
    if (isInitializing) {
        throw new Error('Firebase Admin SDK is already initializing. Please wait.');
    }

    // Previous initialization failed
    if (initializationError) {
        throw initializationError;
    }

    try {
        isInitializing = true;
        
        if (getApps().length === 0) {
            // Check if running in Cloud Functions environment
            const isCloudFunction = process.env.FUNCTION_TARGET || process.env.K_SERVICE;
            
            if (isCloudFunction) {
                // Cloud Functions: Use Application Default Credentials
                // This automatically uses the Cloud Functions service account
                const projectId = process.env.GCLOUD_PROJECT || 'amcgi-bulletin';
                const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                                     `${projectId}.appspot.com`;
                
                console.log('Initializing Firebase Admin SDK in Cloud Functions environment');
                console.log('Project ID:', projectId);
                console.log('Storage Bucket:', storageBucket);
                
                adminApp = initializeApp({
                    projectId: projectId,
                    storageBucket: storageBucket,
                });
            } else {
                // Local/Other environments: Use explicit service account credentials
                // Try environment variables first, then try service account key file
                let credential;
                
                // Get database URL for Realtime Database (optional)
                const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
                
                if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
                    // Use environment variables
                    console.log('Initializing Firebase Admin SDK with explicit credentials from environment variables');
                    credential = cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    });
                    
                    const appConfig: any = {
                        credential: credential,
                        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                    };
                    
                    // Add databaseURL if available
                    if (databaseURL) {
                        appConfig.databaseURL = databaseURL;
                    }
                    
                    adminApp = initializeApp(appConfig);
                } else {
                    // Try to use Application Default Credentials (for local development with gcloud CLI)
                    console.log('Firebase Admin SDK credentials not found in environment variables.');
                    console.log('Attempting to use Application Default Credentials...');
                    console.log('If this fails, please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local');
                    
                    // Use Application Default Credentials (works if user is logged in with gcloud CLI)
                    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'amcgi-bulletin';
                    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
                    
                    const appConfig: any = {
                        projectId: projectId,
                        storageBucket: storageBucket,
                    };
                    
                    // Add databaseURL if available
                    if (databaseURL) {
                        appConfig.databaseURL = databaseURL;
                    }
                    
                    adminApp = initializeApp(appConfig);
                    
                    adminAuth = getAuth(adminApp);
                    adminStorage = getStorage(adminApp);
                    adminDb = getFirestore(adminApp);
                    
                    // Initialize Realtime Database if URL is configured
                    if (databaseURL) {
                        try {
                            adminRealtimeDb = getDatabase(adminApp);
                            console.log('Firebase Realtime Database initialized successfully');
                        } catch (error) {
                            console.warn('Firebase Realtime Database initialization failed:', error);
                        }
                    }
                    
                    console.log('Firebase Admin SDK initialized with Application Default Credentials');
                    isInitializing = false;
                    return;
                }
            }
        } else {
            adminApp = getApps()[0];
        }

        adminAuth = getAuth(adminApp);
        adminStorage = getStorage(adminApp);
        adminDb = getFirestore(adminApp);
        
        // Initialize Realtime Database only if database URL is configured
        // Realtime Database is optional and only used for auth deletion/restore features
        // Note: databaseURL should be set in initializeApp config, but we can also try getDatabase
        const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
        if (databaseURL && !adminRealtimeDb) {
            try {
                // Try to get database (databaseURL should be set in app config)
                adminRealtimeDb = getDatabase(adminApp);
                console.log('Firebase Realtime Database initialized successfully');
            } catch (error) {
                console.warn('Firebase Realtime Database initialization failed:', error);
                // Continue without Realtime Database if it fails - this is optional
            }
        } else if (!databaseURL) {
            // Realtime Database URL not configured - this is optional
            console.log('Firebase Realtime Database URL not configured - skipping initialization (this is optional)');
        }
        
        console.log('Firebase Admin SDK initialized successfully');
        isInitializing = false;
    } catch (error: any) {
        isInitializing = false;
        initializationError = error;
        console.error('Error initializing Firebase Admin SDK:', error);
        throw error;
    }
}

// Lazy initialization - only initialize when actually used
function ensureInitialized() {
    if (!adminApp || !adminAuth || !adminStorage || !adminDb) {
        initializeAdminApp();
    }
}

// Export getters that ensure initialization
export const getAdminApp = (): App => {
    ensureInitialized();
    if (!adminApp) throw new Error('Failed to initialize Firebase Admin App');
    return adminApp;
};

export const getAdminAuth = (): Auth => {
    ensureInitialized();
    if (!adminAuth) throw new Error('Failed to initialize Firebase Admin Auth');
    return adminAuth;
};

export const getAdminStorage = (): Storage => {
    ensureInitialized();
    if (!adminStorage) throw new Error('Failed to initialize Firebase Admin Storage');
    return adminStorage;
};

export const getAdminDb = (): Firestore => {
    ensureInitialized();
    if (!adminDb) throw new Error('Failed to initialize Firebase Admin Firestore');
    return adminDb;
};

export const getAdminRealtimeDb = (): Database => {
    ensureInitialized();
    if (!adminRealtimeDb) throw new Error('Failed to initialize Firebase Realtime Database');
    return adminRealtimeDb;
};

// For backward compatibility, export the variables (but they will be undefined until first use)
export { adminApp, adminAuth, adminStorage, adminDb, adminRealtimeDb };
