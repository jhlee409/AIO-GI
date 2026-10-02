// Share simultaneous profile/status reads across the layout and page hooks.
// A settled request is removed immediately so account edits are never served
// from a stale client cache.
const pendingRequests = new Map<string, Promise<Response>>();

export async function fetchSharedUserInfo(url: string): Promise<Response> {
    let request = pendingRequests.get(url);
    if (!request) {
        request = fetch(url);
        const activeRequest = request;
        pendingRequests.set(url, activeRequest);
        void activeRequest.then(
            () => { if (pendingRequests.get(url) === activeRequest) pendingRequests.delete(url); },
            () => { if (pendingRequests.get(url) === activeRequest) pendingRequests.delete(url); },
        );
    }
    // Response bodies are single-use; each caller needs its own clone.
    return (await request).clone();
}
