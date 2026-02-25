/**
 * User Role Types
 * Extensible role system for future expansion (e.g., tutor, assistant)
 */
export type UserRole = 'user' | 'admin';

/**
 * Media/Content Types
 */
export type MediaType = 'image' | 'video' | 'document';

/**
 * Category for organizing content
 */
export type Category = 
  | 'anatomy'
  | 'surgery'
  | 'radiology'
  | 'pathology'
  | 'general';

/**
 * Media Item - represents a piece of educational content
 */
export interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  category: Category;
  storagePath: string; // Firebase Storage path
  downloadUrl?: string; // Public download URL
  thumbnailUrl?: string; // Thumbnail for preview
  fileSize?: number; // in bytes
  duration?: number; // for videos, in seconds
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // user ID
}

/**
 * User Profile - extends Firebase Auth user
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

/**
 * Upload Progress State
 */
export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}
