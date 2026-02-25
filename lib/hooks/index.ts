/**
 * Hooks Index
 * 모든 hooks를 한 곳에서 export
 */

// User & Auth hooks
export { useUserProfile, type UserInfo, type UseUserProfileReturn } from './useUserProfile';

// API hooks
export { useApi, type UseApiOptions, type UseApiReturn } from './useApi';
export { useLectureList, type UseLectureListReturn, type LectureItem } from './useLectureList';
export { useUsers, type UseUsersReturn, type User } from './useUsers';
export { useCpxChat, type UseCpxChatOptions, type UseCpxChatReturn, type ChatMessage } from './useCpxChat';

// File processing hooks
export { useExcelFileProcessor, type UseExcelFileProcessorOptions, type UseExcelFileProcessorReturn } from './useExcelFileProcessor';

// UI hooks
export { useModal, type UseModalReturn } from './useModal';
export { useCategoryFilter } from './useCategoryFilter';

// Video hooks (existing)
export { useVideoUpload, type UseVideoUploadOptions, type UseVideoUploadReturn, type VideoUploadResult } from './useVideoUpload';
export { useVideoWatchTime, type UseVideoWatchTimeOptions } from './useVideoWatchTime';
export { useSaveVideoWatchTime } from './useSaveVideoWatchTime';
// Note: calculateAccumulatedWatchTime is not a hook, it's a utility function for server-side use

// Session hooks (existing)
export { useAutoLogout } from './useAutoLogout';
export { useSessionActivity } from './useSessionActivity';
