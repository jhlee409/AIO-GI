/**
 * Content List Page
 * Displays all educational content with filtering
 */
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { MediaItem } from '@/types';
import MediaCard from '@/components/MediaCard';

async function getContents(category?: string): Promise<MediaItem[]> {
    try {
        if (!db) {
            console.error('Firebase DB is not initialized');
            return [];
        }
        let q = query(collection(db, 'contents'), orderBy('createdAt', 'desc'));

        if (category) {
            q = query(
                collection(db, 'contents'),
                where('category', '==', category),
                orderBy('createdAt', 'desc')
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as MediaItem[];
    } catch (error) {
        console.error('Error fetching contents:', error);
        return [];
    }
}

export default async function ContentsPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>;
}) {
    const { category } = await searchParams;
    const contents = await getContents(category);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">학습 자료</h1>
                {category && (
                    <p className="text-lg text-gray-600">
                        카테고리: <span className="font-semibold">{category}</span>
                    </p>
                )}
            </div>

            {contents.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-xl text-gray-500">아직 등록된 자료가 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {contents.map((content) => (
                        <MediaCard key={content.id} media={content} />
                    ))}
                </div>
            )}
        </div>
    );
}
