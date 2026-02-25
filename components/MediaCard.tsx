/**
 * Media Card Component
 * Displays a preview card for media content
 */
import Link from 'next/link';
import { MediaItem } from '@/types';
import { FileText, Video, Image as ImageIcon } from 'lucide-react';

export default function MediaCard({ media }: { media: MediaItem }) {
    const getIcon = () => {
        switch (media.type) {
            case 'video':
                return <Video className="w-8 h-8" />;
            case 'document':
                return <FileText className="w-8 h-8" />;
            case 'image':
                return <ImageIcon className="w-8 h-8" />;
        }
    };

    const getTypeLabel = () => {
        switch (media.type) {
            case 'video':
                return '동영상';
            case 'document':
                return '문서';
            case 'image':
                return '이미지';
        }
    };

    return (
        <Link href={`/contents/${media.id}`}>
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600">
                    {media.thumbnailUrl ? (
                        <img
                            src={media.thumbnailUrl}
                            alt={media.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        getIcon()
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-600 uppercase">
                            {getTypeLabel()}
                        </span>
                        <span className="text-xs text-gray-500">{media.category}</span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                        {media.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{media.description}</p>
                </div>
            </div>
        </Link>
    );
}
