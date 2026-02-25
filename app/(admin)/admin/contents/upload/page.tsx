/**
 * Content Upload Page
 * Upload new content to Firebase Storage and Firestore
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase-client';
import { useAuth } from '@/components/AuthProvider';
import { MediaType, Category } from '@/types';
import { Upload, FileText } from 'lucide-react';

export default function UploadPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<MediaType>('image');
    const [category, setCategory] = useState<Category>('general');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !user) return;

        setUploading(true);
        setProgress(0);

        try {
            // Upload to Firebase Storage
            const firestore = db;
            if (!storage || !firestore) {
                throw new Error('Firebase services are not initialized');
            }
            const storagePath = `contents/${type}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(prog);
                },
                (error) => {
                    console.error('Upload error:', error);
                    alert('업로드에 실패했습니다.');
                    setUploading(false);
                },
                async () => {
                    // Get download URL
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

                    // Save metadata to Firestore
                    await addDoc(collection(firestore, 'contents'), {
                        title,
                        description,
                        type,
                        category,
                        storagePath,
                        downloadUrl,
                        fileSize: file.size,
                        createdBy: user.uid,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });

                    alert('업로드가 완료되었습니다!');
                    router.push('/admin/contents');
                }
            );
        } catch (error) {
            console.error('Error uploading:', error);
            alert('업로드에 실패했습니다.');
            setUploading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Lecture List 업로드</h1>

            <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            제목 *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="컨텐츠 제목을 입력하세요"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            설명 *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="컨텐츠 설명을 입력하세요"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                타입 *
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as MediaType)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="image">이미지</option>
                                <option value="video">동영상</option>
                                <option value="document">문서</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                카테고리 *
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as Category)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="anatomy">해부학</option>
                                <option value="surgery">외과학</option>
                                <option value="radiology">영상의학</option>
                                <option value="pathology">병리학</option>
                                <option value="general">일반</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            파일 *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                required
                                className="hidden"
                                id="file-upload"
                                accept={
                                    type === 'image' ? 'image/*' :
                                        type === 'video' ? 'video/*' :
                                            '.pdf,.doc,.docx'
                                }
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-sm text-gray-600">
                                    {file ? file.name : '파일을 선택하거나 드래그하세요'}
                                </p>
                            </label>
                        </div>
                    </div>

                    {uploading && (
                        <div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-600 mt-2 text-center">
                                업로드 중... {Math.round(progress)}%
                            </p>
                        </div>
                    )}

                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? '업로드 중...' : '업로드'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            취소
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
