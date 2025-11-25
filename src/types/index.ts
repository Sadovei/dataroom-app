// Core types for the DataRoom application

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface DataRoom {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null means root level
  dataRoomId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface File {
  id: string;
  name: string;
  folderId: string | null; // null means root level of dataroom
  dataRoomId: string;
  size: number; // in bytes
  mimeType: string;
  storageKey: string; // key in storage (Supabase or local)
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// For the file explorer tree view
export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  children?: FileSystemItem[];
  // File-specific
  size?: number;
  mimeType?: string;
  storageKey?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// UI State types
export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Context Menu types
export type ContextMenuAction = 
  | 'rename'
  | 'delete'
  | 'download'
  | 'move'
  | 'copy'
  | 'details';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  item: FileSystemItem | null;
}

// Dialog types
export type DialogType = 
  | 'createFolder'
  | 'createDataRoom'
  | 'rename'
  | 'delete'
  | 'uploadFile'
  | 'filePreview'
  | null;

export interface DialogState {
  type: DialogType;
  item?: FileSystemItem | DataRoom | null;
}
