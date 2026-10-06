import { getAdminStorage } from '@/lib/firebase-admin';
import { VIDEO_UPLOAD_PATHS, type VideoUploadType } from '@/lib/video-upload-utils';

export async function isVerifiedUploadedVideo(
    type: VideoUploadType,
    position: string,
    name: string,
    fileName: string,
    videoUrl: string,
): Promise<boolean> {
    if (!fileName.startsWith(`${position}-${name}-${type}-`) ||
        !/\d+\.(?:avi|mp4|mpeg4|m4v)$/i.test(fileName)) return false;

    const bucket = getAdminStorage().bucket();
    const expectedPath = `${VIDEO_UPLOAD_PATHS[type]}/${fileName}`;
    try {
        const url = new URL(videoUrl);
        const prefix = `/v0/b/${bucket.name}/o/`;
        if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com' ||
            !url.pathname.startsWith(prefix) ||
            decodeURIComponent(url.pathname.slice(prefix.length)) !== expectedPath) return false;
        const [exists] = await bucket.file(expectedPath).exists();
        return exists;
    } catch {
        return false;
    }
}
