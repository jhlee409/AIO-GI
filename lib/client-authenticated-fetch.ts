import { auth } from '@/lib/firebase-client';

let cachedIdToken: string | null = null;

export function setCachedIdToken(token: string | null) {
    cachedIdToken = token;
}

export function getCachedIdToken(): string | null {
    return cachedIdToken;
}

/** Attach the current Firebase ID token to requests handled by an Admin SDK route. */
export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    if (auth) await auth.authStateReady();
    const token = await auth?.currentUser?.getIdToken();
    if (token) setCachedIdToken(token);
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
}
