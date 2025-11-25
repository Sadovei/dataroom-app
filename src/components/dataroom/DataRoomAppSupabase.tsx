'use client';

import { useState, useEffect } from 'react';
import { useDataRoomStore } from '@/store/supabase-store';
import { useAuth } from '@/contexts/AuthContext';
import { DataRoomList } from './DataRoomList';
import { FileExplorer } from './FileExplorer';
import { 
  CreateDataRoomDialog, 
  CreateFolderDialog, 
  RenameDialog, 
  DeleteDialog,
  PDFPreviewDialog
} from '@/components/dialogs';
import { DataRoom, FileSystemItem } from '@/types';
import { Toaster, toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type DialogType = 
  | { type: 'createDataRoom' }
  | { type: 'editDataRoom'; dataRoom: DataRoom }
  | { type: 'deleteDataRoom'; dataRoom: DataRoom }
  | { type: 'createFolder' }
  | { type: 'rename'; item: FileSystemItem }
  | { type: 'delete'; item: FileSystemItem }
  | { type: 'preview'; item: FileSystemItem }
  | null;

export function DataRoomAppSupabase() {
  const [dialog, setDialog] = useState<DialogType>(null);
  const { user, isLoading: authLoading } = useAuth();
  
  const {
    currentDataRoomId,
    currentFolderId,
    isLoading,
    isInitialized,
    initialize,
    createDataRoom,
    updateDataRoom,
    deleteDataRoom,
    createFolder,
    updateFolder,
    deleteFolder,
    updateFile,
    deleteFile,
  } = useDataRoomStore();

  // Initialize store when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      initialize(user.id);
    }
  }, [user, isInitialized, initialize]);

  // Show loading while auth or data is loading
  if (authLoading || (user && !isInitialized) || isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Loading your data rooms...</p>
        </div>
      </div>
    );
  }

  // DataRoom handlers
  const handleCreateDataRoom = async (name: string, description?: string) => {
    try {
      const newDataRoom = await createDataRoom(name, description);
      toast.success(`Data room "${newDataRoom.name}" created successfully`);
    } catch {
      toast.error('Failed to create data room');
    }
  };

  const handleEditDataRoom = async (name: string, description?: string) => {
    if (dialog?.type === 'editDataRoom') {
      try {
        await updateDataRoom(dialog.dataRoom.id, { name, description });
        toast.success('Data room updated successfully');
      } catch {
        toast.error('Failed to update data room');
      }
    }
  };

  const handleDeleteDataRoom = async () => {
    if (dialog?.type === 'deleteDataRoom') {
      try {
        await deleteDataRoom(dialog.dataRoom.id);
        toast.success('Data room deleted successfully');
      } catch {
        toast.error('Failed to delete data room');
      }
    }
    setDialog(null);
  };

  // Folder handlers
  const handleCreateFolder = async (name: string) => {
    const result = await createFolder(name, currentFolderId);
    if ('error' in result) {
      return result;
    }
    toast.success(`Folder "${result.name}" created successfully`);
    setDialog(null);
  };

  // Rename handler
  const handleRename = async (id: string, newName: string) => {
    if (!dialog || dialog.type !== 'rename') return;
    
    const item = dialog.item;
    let result;
    
    if (item.type === 'folder') {
      result = await updateFolder(id, newName);
    } else {
      result = await updateFile(id, newName);
    }
    
    if (result && 'error' in result) {
      return result;
    }
    
    toast.success(`${item.type === 'folder' ? 'Folder' : 'File'} renamed successfully`);
  };

  // Delete handler
  const handleDelete = async () => {
    if (!dialog || dialog.type !== 'delete') return;
    
    const item = dialog.item;
    
    try {
      if (item.type === 'folder') {
        await deleteFolder(item.id);
      } else {
        await deleteFile(item.id);
      }
      
      toast.success(`${item.type === 'folder' ? 'Folder' : 'File'} deleted successfully`);
    } catch {
      toast.error(`Failed to delete ${item.type}`);
    }
    setDialog(null);
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      
      {currentDataRoomId ? (
        <FileExplorer
          onRename={(item) => setDialog({ type: 'rename', item })}
          onDelete={(item) => setDialog({ type: 'delete', item })}
          onPreview={(item) => setDialog({ type: 'preview', item })}
          onCreateFolder={() => setDialog({ type: 'createFolder' })}
        />
      ) : (
        <div className="p-6">
          <DataRoomList
            onCreateDataRoom={() => setDialog({ type: 'createDataRoom' })}
            onEditDataRoom={(dataRoom) => setDialog({ type: 'editDataRoom', dataRoom })}
            onDeleteDataRoom={(dataRoom) => setDialog({ type: 'deleteDataRoom', dataRoom })}
          />
        </div>
      )}

      {/* Create/Edit DataRoom Dialog */}
      <CreateDataRoomDialog
        open={dialog?.type === 'createDataRoom' || dialog?.type === 'editDataRoom'}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={dialog?.type === 'editDataRoom' ? handleEditDataRoom : handleCreateDataRoom}
        editMode={dialog?.type === 'editDataRoom'}
        initialName={dialog?.type === 'editDataRoom' ? dialog.dataRoom.name : ''}
        initialDescription={dialog?.type === 'editDataRoom' ? dialog.dataRoom.description : ''}
      />

      {/* Delete DataRoom Dialog */}
      <DeleteDialog
        open={dialog?.type === 'deleteDataRoom'}
        onOpenChange={(open) => !open && setDialog(null)}
        item={dialog?.type === 'deleteDataRoom' ? dialog.dataRoom : null}
        itemType="dataroom"
        onConfirm={handleDeleteDataRoom}
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={dialog?.type === 'createFolder'}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={handleCreateFolder}
      />

      {/* Rename Dialog */}
      <RenameDialog
        open={dialog?.type === 'rename'}
        onOpenChange={(open) => !open && setDialog(null)}
        item={dialog?.type === 'rename' ? dialog.item : null}
        onConfirm={handleRename}
      />

      {/* Delete File/Folder Dialog */}
      <DeleteDialog
        open={dialog?.type === 'delete'}
        onOpenChange={(open) => !open && setDialog(null)}
        item={dialog?.type === 'delete' ? dialog.item : null}
        itemType={dialog?.type === 'delete' ? dialog.item.type : 'file'}
        onConfirm={handleDelete}
      />

      {/* PDF Preview Dialog */}
      <PDFPreviewDialog
        open={dialog?.type === 'preview'}
        onOpenChange={(open) => !open && setDialog(null)}
        item={dialog?.type === 'preview' ? dialog.item : null}
      />
    </>
  );
}
