import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import { DataRoom, Folder, File, FileSystemItem, BreadcrumbItem, DialogState } from '@/types';

interface DataRoomState {
  // Data
  dataRooms: DataRoom[];
  folders: Folder[];
  files: File[];
  
  // UI State
  currentDataRoomId: string | null;
  currentFolderId: string | null;
  selectedItems: string[];
  breadcrumbs: BreadcrumbItem[];
  dialogState: DialogState;
  searchQuery: string;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Initialization
  initialize: (userId: string) => Promise<void>;
  
  // DataRoom Actions
  createDataRoom: (name: string, description?: string) => Promise<DataRoom>;
  updateDataRoom: (id: string, updates: Partial<Pick<DataRoom, 'name' | 'description'>>) => Promise<void>;
  deleteDataRoom: (id: string) => Promise<void>;
  setCurrentDataRoom: (id: string | null) => void;
  
  // Folder Actions
  createFolder: (name: string, parentId: string | null) => Promise<Folder | { error: string }>;
  updateFolder: (id: string, name: string) => Promise<void | { error: string }>;
  deleteFolder: (id: string) => Promise<void>;
  
  // File Actions
  uploadFile: (file: globalThis.File, dataRoomId: string, folderId?: string | null) => Promise<File | { error: string }>;
  updateFile: (id: string, name: string) => Promise<void | { error: string }>;
  deleteFile: (id: string) => Promise<void>;
  getFileUrl: (fileId: string) => Promise<string | null>;
  
  // Navigation
  navigateToFolder: (folderId: string | null) => void;
  
  // Selection
  toggleItemSelection: (id: string) => void;
  clearSelection: () => void;
  
  // UI Actions
  setDialogState: (state: DialogState) => void;
  setSearchQuery: (query: string) => void;
  
  // Helpers
  getCurrentItems: () => FileSystemItem[];
  getItemById: (id: string) => FileSystemItem | null;
  getFolderPath: (folderId: string | null) => BreadcrumbItem[];
}

export const useDataRoomStore = create<DataRoomState>()((set, get) => ({
  // Initial State
  dataRooms: [],
  folders: [],
  files: [],
  currentDataRoomId: null,
  currentFolderId: null,
  selectedItems: [],
  breadcrumbs: [],
  dialogState: { type: null },
  searchQuery: '',
  isLoading: false,
  isInitialized: false,

  // Initialize - load data from Supabase
  initialize: async (userId: string) => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    const supabase = createClient();

    try {
      // Fetch data rooms
      const { data: dataRooms } = await supabase
        .from('data_rooms')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      // Fetch folders
      const { data: folders } = await supabase
        .from('folders')
        .select('*')
        .in('data_room_id', dataRooms?.map(dr => dr.id) || []);

      // Fetch files
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .in('data_room_id', dataRooms?.map(dr => dr.id) || []);

      set({
        dataRooms: dataRooms?.map(dr => ({
          id: dr.id,
          name: dr.name,
          description: dr.description,
          ownerId: dr.owner_id,
          createdAt: new Date(dr.created_at),
          updatedAt: new Date(dr.updated_at),
        })) || [],
        folders: folders?.map(f => ({
          id: f.id,
          name: f.name,
          parentId: f.parent_id,
          dataRoomId: f.data_room_id,
          createdAt: new Date(f.created_at),
          updatedAt: new Date(f.updated_at),
        })) || [],
        files: files?.map(f => ({
          id: f.id,
          name: f.name,
          folderId: f.folder_id,
          dataRoomId: f.data_room_id,
          size: f.size,
          mimeType: f.mime_type,
          storageKey: f.storage_key,
          uploadedBy: f.uploaded_by,
          createdAt: new Date(f.created_at),
          updatedAt: new Date(f.updated_at),
        })) || [],
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ isLoading: false });
    }
  },

  // DataRoom Actions
  createDataRoom: async (name, description) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('data_rooms')
      .insert({
        name,
        description,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    const newDataRoom: DataRoom = {
      id: data.id,
      name: data.name,
      description: data.description,
      ownerId: data.owner_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    set((state) => ({
      dataRooms: [newDataRoom, ...state.dataRooms],
    }));

    return newDataRoom;
  },

  updateDataRoom: async (id, updates) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('data_rooms')
      .update({
        name: updates.name,
        description: updates.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      dataRooms: state.dataRooms.map((dr) =>
        dr.id === id ? { ...dr, ...updates, updatedAt: new Date() } : dr
      ),
    }));
  },

  deleteDataRoom: async (id) => {
    const supabase = createClient();
    const state = get();

    // Get all files in this data room to delete from storage
    const filesToDelete = state.files.filter(f => f.dataRoomId === id);
    
    // Delete files from storage
    if (filesToDelete.length > 0) {
      await supabase.storage
        .from('dataroom-files')
        .remove(filesToDelete.map(f => f.storageKey));
    }

    // Delete data room (cascade will handle folders and files in DB)
    const { error } = await supabase
      .from('data_rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      dataRooms: state.dataRooms.filter((dr) => dr.id !== id),
      folders: state.folders.filter((f) => f.dataRoomId !== id),
      files: state.files.filter((f) => f.dataRoomId !== id),
      currentDataRoomId: state.currentDataRoomId === id ? null : state.currentDataRoomId,
      currentFolderId: null,
      breadcrumbs: [],
    }));
  },

  setCurrentDataRoom: (id) => {
    set({
      currentDataRoomId: id,
      currentFolderId: null,
      selectedItems: [],
      breadcrumbs: id ? [{ id: null, name: 'Root' }] : [],
    });
  },

  // Folder Actions
  createFolder: async (name, parentId) => {
    const state = get();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return { error: 'Folder name cannot be empty' };
    }
    
    if (!state.currentDataRoomId) {
      return { error: 'No data room selected' };
    }

    // Check for duplicate names
    const existingFolder = state.folders.find(
      (f) =>
        f.dataRoomId === state.currentDataRoomId &&
        f.parentId === parentId &&
        f.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingFolder) {
      return { error: `A folder named "${trimmedName}" already exists in this location` };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('folders')
      .insert({
        name: trimmedName,
        parent_id: parentId,
        data_room_id: state.currentDataRoomId,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    const newFolder: Folder = {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      dataRoomId: data.data_room_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    set((state) => ({
      folders: [...state.folders, newFolder],
    }));

    return newFolder;
  },

  updateFolder: async (id, name) => {
    const state = get();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return { error: 'Folder name cannot be empty' };
    }

    const folder = state.folders.find((f) => f.id === id);
    if (!folder) {
      return { error: 'Folder not found' };
    }

    // Check for duplicate names
    const existingFolder = state.folders.find(
      (f) =>
        f.id !== id &&
        f.dataRoomId === folder.dataRoomId &&
        f.parentId === folder.parentId &&
        f.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingFolder) {
      return { error: `A folder named "${trimmedName}" already exists in this location` };
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('folders')
      .update({ name: trimmedName, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === id ? { ...f, name: trimmedName, updatedAt: new Date() } : f
      ),
    }));
  },

  deleteFolder: async (id) => {
    const state = get();
    const supabase = createClient();

    // Find all descendant folders
    const foldersToDelete: string[] = [id];
    const findDescendants = (parentId: string) => {
      state.folders
        .filter((f) => f.parentId === parentId)
        .forEach((f) => {
          foldersToDelete.push(f.id);
          findDescendants(f.id);
        });
    };
    findDescendants(id);

    // Find all files to delete from storage
    const filesToDelete = state.files.filter(
      (f) => foldersToDelete.includes(f.folderId || '') || f.folderId === id
    );

    // Delete files from storage
    if (filesToDelete.length > 0) {
      await supabase.storage
        .from('dataroom-files')
        .remove(filesToDelete.map(f => f.storageKey));
    }

    // Delete folder from DB (cascade handles children)
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      folders: state.folders.filter((f) => !foldersToDelete.includes(f.id)),
      files: state.files.filter((f) => !filesToDelete.map(fd => fd.id).includes(f.id)),
      selectedItems: state.selectedItems.filter(
        (itemId) => !foldersToDelete.includes(itemId) && !filesToDelete.map(fd => fd.id).includes(itemId)
      ),
    }));
  },

  // File Actions
  uploadFile: async (file, dataRoomId, folderId) => {
    const state = get();
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return { error: 'Only PDF files are supported' };
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: 'File size exceeds 50MB limit' };
    }

    // Generate unique name if duplicate exists
    let fileName = file.name;
    const existingFiles = state.files.filter(
      (f) =>
        f.dataRoomId === dataRoomId &&
        f.folderId === (folderId ?? null)
    );

    let counter = 1;
    const baseName = fileName.replace(/\.pdf$/i, '');
    while (existingFiles.some((f) => f.name.toLowerCase() === fileName.toLowerCase())) {
      fileName = `${baseName} (${counter}).pdf`;
      counter++;
    }

    const fileId = uuidv4();
    const storageKey = `${user.id}/${dataRoomId}/${fileId}.pdf`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('dataroom-files')
      .upload(storageKey, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    // Save metadata to DB
    const { data, error: dbError } = await supabase
      .from('files')
      .insert({
        id: fileId,
        name: fileName,
        folder_id: folderId ?? null,
        data_room_id: dataRoomId,
        size: file.size,
        mime_type: file.type,
        storage_key: storageKey,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup storage if DB insert fails
      await supabase.storage.from('dataroom-files').remove([storageKey]);
      return { error: dbError.message };
    }

    const newFile: File = {
      id: data.id,
      name: data.name,
      folderId: data.folder_id,
      dataRoomId: data.data_room_id,
      size: data.size,
      mimeType: data.mime_type,
      storageKey: data.storage_key,
      uploadedBy: data.uploaded_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    set((state) => ({
      files: [...state.files, newFile],
    }));

    return newFile;
  },

  updateFile: async (id, name) => {
    const state = get();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return { error: 'File name cannot be empty' };
    }

    // Ensure .pdf extension
    let fileName = trimmedName;
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      fileName += '.pdf';
    }

    const file = state.files.find((f) => f.id === id);
    if (!file) {
      return { error: 'File not found' };
    }

    // Check for duplicate names
    const existingFile = state.files.find(
      (f) =>
        f.id !== id &&
        f.dataRoomId === file.dataRoomId &&
        f.folderId === file.folderId &&
        f.name.toLowerCase() === fileName.toLowerCase()
    );

    if (existingFile) {
      return { error: `A file named "${fileName}" already exists in this location` };
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('files')
      .update({ name: fileName, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, name: fileName, updatedAt: new Date() } : f
      ),
    }));
  },

  deleteFile: async (id) => {
    const state = get();
    const file = state.files.find((f) => f.id === id);
    
    if (!file) return;

    const supabase = createClient();

    // Delete from storage
    await supabase.storage
      .from('dataroom-files')
      .remove([file.storageKey]);

    // Delete from DB
    await supabase
      .from('files')
      .delete()
      .eq('id', id);

    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
      selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
    }));
  },

  getFileUrl: async (fileId) => {
    const state = get();
    const file = state.files.find((f) => f.id === fileId);
    
    if (!file) return null;
    
    const supabase = createClient();
    const { data } = await supabase.storage
      .from('dataroom-files')
      .createSignedUrl(file.storageKey, 3600); // 1 hour expiry
    
    return data?.signedUrl ?? null;
  },

  // Navigation
  navigateToFolder: (folderId) => {
    set((state) => ({
      currentFolderId: folderId,
      selectedItems: [],
      breadcrumbs: state.getFolderPath(folderId),
    }));
  },

  // Selection
  toggleItemSelection: (id) => {
    set((state) => ({
      selectedItems: state.selectedItems.includes(id)
        ? state.selectedItems.filter((itemId) => itemId !== id)
        : [...state.selectedItems, id],
    }));
  },

  clearSelection: () => {
    set({ selectedItems: [] });
  },

  // UI Actions
  setDialogState: (dialogState) => {
    set({ dialogState });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // Helpers
  getCurrentItems: () => {
    const state = get();
    if (!state.currentDataRoomId) return [];

    const folders: FileSystemItem[] = state.folders
      .filter(
        (f) =>
          f.dataRoomId === state.currentDataRoomId &&
          f.parentId === state.currentFolderId
      )
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: 'folder' as const,
        parentId: f.parentId,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }));

    const files: FileSystemItem[] = state.files
      .filter(
        (f) =>
          f.dataRoomId === state.currentDataRoomId &&
          f.folderId === state.currentFolderId
      )
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: 'file' as const,
        parentId: f.folderId,
        size: f.size,
        mimeType: f.mimeType,
        storageKey: f.storageKey,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }));

    const query = state.searchQuery.toLowerCase();
    const allItems = [...folders, ...files];
    
    if (!query) return allItems;
    
    return allItems.filter((item) => item.name.toLowerCase().includes(query));
  },

  getItemById: (id) => {
    const state = get();
    
    const folder = state.folders.find((f) => f.id === id);
    if (folder) {
      return {
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      };
    }

    const file = state.files.find((f) => f.id === id);
    if (file) {
      return {
        id: file.id,
        name: file.name,
        type: 'file' as const,
        parentId: file.folderId,
        size: file.size,
        mimeType: file.mimeType,
        storageKey: file.storageKey,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      };
    }

    return null;
  },

  getFolderPath: (folderId) => {
    const state = get();
    const path: BreadcrumbItem[] = [{ id: null, name: 'Root' }];

    if (!folderId) return path;

    const buildPath = (id: string) => {
      const folder = state.folders.find((f) => f.id === id);
      if (folder) {
        if (folder.parentId) {
          buildPath(folder.parentId);
        }
        path.push({ id: folder.id, name: folder.name });
      }
    };

    buildPath(folderId);
    return path;
  },
}));
