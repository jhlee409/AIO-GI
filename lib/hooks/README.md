# Hooks 가이드

이 디렉토리에는 프로젝트에서 사용하는 재사용 가능한 React hooks가 포함되어 있습니다.

## 사용자 및 인증 관련 Hooks

### `useUserProfile`
사용자 프로필 정보를 로드하고 관리합니다.

```tsx
import { useUserProfile } from '@/lib/hooks';

function MyComponent() {
    const { userInfo, loading, error, refetch } = useUserProfile();
    
    if (loading) return <div>로딩 중...</div>;
    if (error) return <div>오류: {error.message}</div>;
    
    return <div>직위: {userInfo?.position}</div>;
}
```

## API 관련 Hooks

### `useApi`
범용 API 호출 hook입니다.

```tsx
import { useApi } from '@/lib/hooks';

function MyComponent() {
    const { call, loading, error, data } = useApi({
        onSuccess: (data) => console.log('성공:', data),
        onError: (error) => console.error('오류:', error),
    });
    
    const handleClick = async () => {
        const result = await call('/api/endpoint', {
            method: 'POST',
            body: JSON.stringify({ data: 'value' }),
        });
    };
}
```

### `useLectureList`
강의 목록을 관리합니다.

```tsx
import { useLectureList } from '@/lib/hooks';

function LectureListPage() {
    const { items, loading, error, loadItems, saveItems } = useLectureList();
    
    const handleSave = async (newItems) => {
        await saveItems(newItems);
    };
}
```

### `useUsers`
사용자 목록을 관리합니다.

```tsx
import { useUsers } from '@/lib/hooks';

function UsersPage() {
    const { 
        users, 
        loading, 
        error, 
        loadUsers, 
        searchQuery, 
        setSearchQuery,
        filteredUsers 
    } = useUsers();
    
    return (
        <div>
            <input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
            />
            {filteredUsers.map(user => <div key={user._id}>{user.name}</div>)}
        </div>
    );
}
```

### `useCpxChat`
CPX 채팅 기능을 관리합니다.

```tsx
import { useCpxChat } from '@/lib/hooks';

function CpxChat() {
    const { 
        messages, 
        sendMessage, 
        loading, 
        error, 
        chatEnded,
        resetChat 
    } = useCpxChat({
        scenario: '시나리오 내용',
        onChatEnded: () => console.log('채팅 종료'),
    });
    
    return (
        <div>
            {messages.map((msg, i) => (
                <div key={i}>{msg.content}</div>
            ))}
            <button onClick={() => sendMessage('안녕하세요')}>
                전송
            </button>
        </div>
    );
}
```

## 파일 처리 Hooks

### `useExcelFileProcessor`
Excel 파일을 읽고 처리합니다.

```tsx
import { useExcelFileProcessor } from '@/lib/hooks';

function ExcelUploader() {
    const { processFile, processing, error } = useExcelFileProcessor({
        onSuccess: (data) => {
            console.log('처리된 데이터:', data);
        },
        onError: (error) => {
            alert(error.message);
        },
    });
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };
}
```

## UI 관련 Hooks

### `useModal`
모달 상태를 관리합니다.

```tsx
import { useModal } from '@/lib/hooks';

function MyComponent() {
    const { isOpen, open, close, toggle } = useModal();
    
    return (
        <div>
            <button onClick={open}>모달 열기</button>
            {isOpen && (
                <div>
                    <button onClick={close}>닫기</button>
                </div>
            )}
        </div>
    );
}
```

### `useCategoryFilter`
사용자 권한에 따라 카테고리를 필터링합니다.

```tsx
import { useCategoryFilter } from '@/lib/hooks';
import { useUserProfile } from '@/lib/hooks';

function CategoriesPage() {
    const { userInfo, loading } = useUserProfile();
    const allCategories = [/* ... */];
    
    const visibleCategories = useCategoryFilter(
        allCategories,
        userInfo,
        loading
    );
    
    return (
        <div>
            {visibleCategories.map(cat => (
                <div key={cat.id}>{cat.name}</div>
            ))}
        </div>
    );
}
```

## 비디오 관련 Hooks

### `useVideoUpload`
비디오 업로드를 관리합니다. 자세한 내용은 `VIDEO_UPLOAD_HOOK_GUIDE.md`를 참조하세요.

### `useVideoWatchTime`
비디오 시청 시간을 추적합니다.

## 세션 관련 Hooks

### `useAutoLogout`
자동 로그아웃 기능을 제공합니다.

### `useSessionActivity`
세션 활동을 추적합니다.
