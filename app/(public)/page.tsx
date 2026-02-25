/**
 * Public Home Page
 * Landing page with category overview
 * Shows different categories based on user position and role
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video, Image, Stethoscope } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useCategoryFilter } from '@/lib/hooks/useCategoryFilter';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CategoryCard } from '@/components/common/CategoryCard';

export default function HomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { userInfo, loading: profileLoading } = useUserProfile();

    // Redirect to login page if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const allCategories = [
        {
            id: 'basic',
            name: 'Basic course',
            description: '내시경 교육 기초과정',
            icon: Image,
            color: 'from-blue-500 to-blue-600',
            order: 1,
        },
        {
            id: 'cpx',
            name: 'CPX',
            description: '환자 병력청취 훈련 프로그램',
            icon: Stethoscope,
            color: 'from-green-500 to-green-600',
            order: 2,
        },
        {
            id: 'advanced-f1',
            name: 'Advanced course for F1',
            description: 'F1을 위한 내시경 교육 상급과정',
            icon: Video,
            color: 'from-red-500 to-red-600',
            order: 3,
        },
        {
            id: 'advanced',
            name: 'Advanced course for F2',
            description: 'F2를 위한 내시경 교육 상급과정',
            icon: Video,
            color: 'from-red-500 to-red-600',
            order: 4,
        },
    ];

    const visibleCategories = useCategoryFilter(
        allCategories,
        userInfo,
        profileLoading || authLoading
    );

    // Show loading or nothing while redirecting
    if (authLoading || !user) {
        return <LoadingSpinner size="lg" className="h-64" />;
    }

    const handleCategoryClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            alert('로그인을 먼저 시행해 주십시오');
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    AIO-GI (All-in-one-GI)
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    소화기 내과 내시경 및 임상 진료 훈련 프로그램
                </p>
            </div>

            {/* Categories Grid */}
            {profileLoading || authLoading ? (
                <LoadingSpinner size="lg" className="h-64" />
            ) : (
                <div className="grid grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
                    {visibleCategories && visibleCategories.length > 0 ? (
                        visibleCategories.map((category) => (
                            <CategoryCard
                                key={category.id}
                                id={category.id}
                                name={category.name}
                                description={category.description}
                                icon={category.icon}
                                color={category.color}
                                href={category.id === 'cpx' ? '/cpx' : `/courses/${category.id}`}
                                onClick={handleCategoryClick}
                                disabled={!user}
                            />
                        ))
                    ) : (
                        <div className="col-span-2 text-center text-gray-500">
                            카테고리를 불러올 수 없습니다.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
