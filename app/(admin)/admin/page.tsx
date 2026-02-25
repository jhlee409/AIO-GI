/**
 * Admin Root Page
 * Default admin panel page with sidebar navigation
 */
'use client';

import { useState } from 'react';
import { Users, FileUp } from 'lucide-react';
import AdminUsersPage from './users/page';
import AdminContentsPage from './contents/page';

export default function AdminPage() {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    const adminItems = [
        {
            id: 'users',
            title: '사용자 관리',
            description: '사용자 정보를 관리합니다',
            icon: Users,
        },
        {
            id: 'contents',
            title: 'Lecture List 관리',
            description: '강의 목록을 관리합니다',
            icon: FileUp,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <div className="w-full">
                <div className="flex gap-4 h-[calc(100vh-64px)]">
                    {/* Left Sidebar - 14% */}
                    <aside className="w-[14%] flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                관리자 패널
                            </h2>
                            <div className="mb-4"></div>
                            <nav className="space-y-1">
                                {adminItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItem(item.id)}
                                            className={`w-full text-left py-3 rounded-lg transition ${selectedItem === item.id
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="ml-3 flex items-center space-x-2">
                                                <Icon className="w-5 h-5" />
                                                <span>{item.title}</span>
                                            </div>
                                        </button>
                                    );
                                })}

                                {/* 초기 화면으로 이동 버튼 */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className={`w-full text-left py-3 rounded-lg transition ${selectedItem === null
                                            ? 'bg-gray-200 text-gray-800 font-semibold'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="ml-3">
                                            초기 화면으로
                                        </div>
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Right Content Area - 8/10 (80%) */}
                    <div className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-y-auto">
                        {selectedItem === null ? (
                            <div className="flex flex-col h-full">
                                <div className="mb-6">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                        관리자 패널
                                    </h1>
                                    <p className="text-lg text-gray-700">
                                        관리할 항목을 선택해 주세요. 등록자 정보와 강의 제목 정보는 이 프로젝트 폴더 안에 있는 하부 폴더인 /secret/ 안에 엑셀 파일로 저장되어 있습니다. 수정이 필요할 경우 그 엑셀파일을 열어 수정하고 저장하신 후 아래 각 메뉴 안의 기능을 사용하여 불러 오세요.
                                    </p>
                                </div>
                                <div className="border-t border-gray-300 mb-6"></div>

                                {/* Admin Items Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {adminItems.map((item) => {
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedItem(item.id)}
                                                className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                            >
                                                <h3 className="text-xl font-semibold text-white mb-3">
                                                    {item.title}
                                                </h3>
                                                <p className="text-white text-sm mb-4">
                                                    {item.description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : selectedItem === 'users' ? (
                            <AdminUsersPage />
                        ) : selectedItem === 'contents' ? (
                            <AdminContentsPage />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
