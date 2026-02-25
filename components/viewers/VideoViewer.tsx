/**
 * Video Viewer Component
 * HTML5 video player for educational videos
 */
'use client';

export default function VideoViewer({ url }: { url: string }) {
    return (
        <div className="bg-black">
            <video
                controls
                className="w-full max-h-[600px]"
                preload="metadata"
            >
                <source src={url} type="video/mp4" />
                <source src={url} type="video/webm" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
