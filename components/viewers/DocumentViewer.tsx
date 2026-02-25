/**
 * Document Viewer Component
 * PDF viewer using iframe
 */
'use client';

export default function DocumentViewer({ url }: { url: string }) {
    return (
        <div className="bg-gray-100">
            <iframe
                src={url}
                className="w-full h-[600px] border-0"
                title="Document viewer"
            />
        </div>
    );
}
