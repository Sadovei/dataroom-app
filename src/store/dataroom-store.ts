import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { DataRoom, Folder, File, FileSystemItem, BreadcrumbItem, DialogState, UploadProgress } from '@/types';

interface DataRoomState {
  // Data
  dataRooms: DataRoom[];
  folders: Folder[];
  files: File[];
  fileContents: Record<string, string>; // fileId -> base64 content
  
  // UI State
  currentDataRoomId: string | null;
  currentFolderId: string | null;
  selectedItems: string[];
  breadcrumbs: BreadcrumbItem[];
  dialogState: DialogState;
  uploadProgress: UploadProgress[];
  searchQuery: string;
  isLoading: boolean;
  
  // DataRoom Actions
  createDataRoom: (name: string, description?: string) => DataRoom;
  updateDataRoom: (id: string, updates: Partial<Pick<DataRoom, 'name' | 'description'>>) => void;
  deleteDataRoom: (id: string) => void;
  setCurrentDataRoom: (id: string | null) => void;
  
  // Folder Actions
  createFolder: (name: string, parentId: string | null) => Folder | { error: string };
  updateFolder: (id: string, name: string) => void | { error: string };
  deleteFolder: (id: string) => void;
  
  // File Actions
  uploadFile: (file: globalThis.File, folderId: string | null) => Promise<File | { error: string }>;
  updateFile: (id: string, name: string) => void | { error: string };
  deleteFile: (id: string) => void;
  getFileContent: (id: string) => string | null;
  
  // Navigation
  navigateToFolder: (folderId: string | null) => void;
  
  // Selection
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  toggleItemSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // UI Actions
  setDialogState: (state: DialogState) => void;
  setSearchQuery: (query: string) => void;
  
  // Helpers
  getCurrentItems: () => FileSystemItem[];
  getItemById: (id: string) => FileSystemItem | null;
  getFolderPath: (folderId: string | null) => BreadcrumbItem[];
}

export const useDataRoomStore = create<DataRoomState>()(
  persist(
    (set, get) => ({
      // Initial State
      dataRooms: [],
      folders: [],
      files: [],
      fileContents: {},
      currentDataRoomId: null,
      currentFolderId: null,
      selectedItems: [],
      breadcrumbs: [],
      dialogState: { type: null },
      uploadProgress: [],
      searchQuery: '',
      isLoading: false,

      // DataRoom Actions
      createDataRoom: (name, description) => {
        const newDataRoom: DataRoom = {
          id: uuidv4(),
          name,
          description,
          ownerId: 'local-user',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          dataRooms: [...state.dataRooms, newDataRoom],
        }));
        return newDataRoom;
      },

      updateDataRoom: (id, updates) => {
        set((state) => ({
          dataRooms: state.dataRooms.map((dr) =>
            dr.id === id ? { ...dr, ...updates, updatedAt: new Date() } : dr
          ),
        }));
      },

      deleteDataRoom: (id) => {
        set((state) => {
          // Delete all folders and files in this dataroom
          const fileIds = state.files
            .filter((f) => f.dataRoomId === id)
            .map((f) => f.id);
          
          const newFileContents = { ...state.fileContents };
          fileIds.forEach((fileId) => delete newFileContents[fileId]);

          return {
            dataRooms: state.dataRooms.filter((dr) => dr.id !== id),
            folders: state.folders.filter((f) => f.dataRoomId !== id),
            files: state.files.filter((f) => f.dataRoomId !== id),
            fileContents: newFileContents,
            currentDataRoomId: state.currentDataRoomId === id ? null : state.currentDataRoomId,
            currentFolderId: null,
            breadcrumbs: [],
          };
        });
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
      createFolder: (name, parentId) => {
        const state = get();
        const trimmedName = name.trim();
        
        if (!trimmedName) {
          return { error: 'Folder name cannot be empty' };
        }
        
        if (!state.currentDataRoomId) {
          return { error: 'No data room selected' };
        }

        // Check for duplicate names in the same location
        const existingFolder = state.folders.find(
          (f) =>
            f.dataRoomId === state.currentDataRoomId &&
            f.parentId === parentId &&
            f.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (existingFolder) {
          return { error: `A folder named "${trimmedName}" already exists in this location` };
        }

        const newFolder: Folder = {
          id: uuidv4(),
          name: trimmedName,
          parentId,
          dataRoomId: state.currentDataRoomId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          folders: [...state.folders, newFolder],
        }));

        return newFolder;
      },

      updateFolder: (id, name) => {
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

        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, name: trimmedName, updatedAt: new Date() } : f
          ),
        }));
      },

      deleteFolder: (id) => {
        // Recursively delete all child folders and files
        const state = get();
        const foldersToDelete: string[] = [id];
        const filesToDelete: string[] = [];

        // Find all descendant folders
        const findDescendants = (parentId: string) => {
          state.folders
            .filter((f) => f.parentId === parentId)
            .forEach((f) => {
              foldersToDelete.push(f.id);
              findDescendants(f.id);
            });
        };
        findDescendants(id);

        // Find all files in folders to delete
        foldersToDelete.forEach((folderId) => {
          state.files
            .filter((f) => f.folderId === folderId)
            .forEach((f) => filesToDelete.push(f.id));
        });

        // Also delete files directly in the folder
        state.files
          .filter((f) => f.folderId === id)
          .forEach((f) => filesToDelete.push(f.id));

        set((state) => {
          const newFileContents = { ...state.fileContents };
          filesToDelete.forEach((fileId) => delete newFileContents[fileId]);

          return {
            folders: state.folders.filter((f) => !foldersToDelete.includes(f.id)),
            files: state.files.filter((f) => !filesToDelete.includes(f.id)),
            fileContents: newFileContents,
            selectedItems: state.selectedItems.filter(
              (itemId) => !foldersToDelete.includes(itemId) && !filesToDelete.includes(itemId)
            ),
          };
        });
      },

      // File Actions
      uploadFile: async (file, folderId) => {
        const state = get();
        
        if (!state.currentDataRoomId) {
          return { error: 'No data room selected' };
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
            f.dataRoomId === state.currentDataRoomId &&
            f.folderId === folderId
        );

        let counter = 1;
        const baseName = fileName.replace(/\.pdf$/i, '');
        while (existingFiles.some((f) => f.name.toLowerCase() === fileName.toLowerCase())) {
          fileName = `${baseName} (${counter}).pdf`;
          counter++;
        }

        // Read file as base64
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Content = reader.result as string;
            const fileId = uuidv4();

            const newFile: File = {
              id: fileId,
              name: fileName,
              folderId,
              dataRoomId: state.currentDataRoomId!,
              size: file.size,
              mimeType: file.type,
              storageKey: fileId,
              uploadedBy: 'local-user',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            set((state) => ({
              files: [...state.files, newFile],
              fileContents: {
                ...state.fileContents,
                [fileId]: base64Content,
              },
            }));

            resolve(newFile);
          };
          reader.onerror = () => {
            resolve({ error: 'Failed to read file' });
          };
          reader.readAsDataURL(file);
        });
      },

      updateFile: (id, name) => {
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

        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, name: fileName, updatedAt: new Date() } : f
          ),
        }));
      },

      deleteFile: (id) => {
        set((state) => {
          const newFileContents = { ...state.fileContents };
          delete newFileContents[id];

          return {
            files: state.files.filter((f) => f.id !== id),
            fileContents: newFileContents,
            selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
          };
        });
      },

      getFileContent: (id) => {
        return get().fileContents[id] || null;
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
      selectItem: (id) => {
        set((state) => ({
          selectedItems: state.selectedItems.includes(id)
            ? state.selectedItems
            : [...state.selectedItems, id],
        }));
      },

      deselectItem: (id) => {
        set((state) => ({
          selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
        }));
      },

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

      selectAll: () => {
        const items = get().getCurrentItems();
        set({ selectedItems: items.map((item) => item.id) });
      },

      // UI Actions
      setDialogState: (state) => {
        set({ dialogState: state });
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

        // Filter by search query
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
    }),
    {
      name: 'dataroom-storage',
      partialize: (state) => ({
        dataRooms: state.dataRooms,
        folders: state.folders,
        files: state.files,
        fileContents: state.fileContents,
      }),
    }
  )
);
