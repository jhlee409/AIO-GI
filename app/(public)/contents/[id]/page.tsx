/**
 * Content Detail Page
 * Displays individual content with appropriate viewer
 */
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { MediaItem } from '@/types';
import { notFound } from 'next/navigation';
import ImageViewer from '@/components/viewers/ImageViewer';
import VideoViewer from '@/components/viewers/VideoViewer';
import DocumentViewer from '@/components/viewers/DocumentViewer';

async function getContent(id: string): Promise<MediaItem | null> {
    try {
        if (!db) {
            console.error('Firebase DB is not initialized');
            return null;
        }
        const docRef = doc(db, 'contents', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as MediaItem;
    } catch (error) {
        console.error('Error fetching content:', error);
        return null;
    }
}

export default async function ContentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const content = await getContent(id);

    if (!content) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded">
                            {content.category}
                        </span>
                        <span>•</span>
                        <span>{content.type}</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {content.title}
                    </h1>
                    <p className="text-lg text-gray-600">{content.description}</p>
                </div>

                {/* Viewer */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {content.type === 'image' && <ImageViewer url={content.downloadUrl!} />}
                    {content.type === 'video' && <VideoViewer url={content.downloadUrl!} />}
                    {content.type === 'document' && <DocumentViewer url={content.downloadUrl!} />}
                </div>

                {/* Metadata */}
                <div className="mt-6 bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">상세 정보</h2>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-gray-500">등록일</dt>
                            <dd className="font-medium">{content.createdAt.toLocaleDateString('ko-KR')}</dd>
                        </div>
                        {content.fileSize && (
                            <div>
                                <dt className="text-gray-500">파일 크기</dt>
                                <dd className="font-medium">{(content.fileSize / 1024 / 1024).toFixed(2)} MB</dd>
                            </div>
                        )}
                        {content.duration && (
                            <div>
                                <dt className="text-gray-500">재생 시간</dt>
                                <dd className="font-medium">{Math.floor(content.duration / 60)}분 {content.duration % 60}초</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>
        </div>
    );
}
