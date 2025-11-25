'use client';

import { useState } from 'react';
import { useDataRoomStore } from '@/store/dataroom-store';
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

type DialogType = 
  | { type: 'createDataRoom' }
  | { type: 'editDataRoom'; dataRoom: DataRoom }
  | { type: 'deleteDataRoom'; dataRoom: DataRoom }
  | { type: 'createFolder' }
  | { type: 'rename'; item: FileSystemItem }
  | { type: 'delete'; item: FileSystemItem }
  | { type: 'preview'; item: FileSystemItem }
  | null;

export function DataRoomApp() {
  const [dialog, setDialog] = useState<DialogType>(null);
  
  const {
    currentDataRoomId,
    currentFolderId,
    createDataRoom,
    updateDataRoom,
    deleteDataRoom,
    createFolder,
    updateFolder,
    deleteFolder,
    updateFile,
    deleteFile,
  } = useDataRoomStore();

  // DataRoom handlers
  const handleCreateDataRoom = (name: string, description?: string) => {
    const newDataRoom = createDataRoom(name, description);
    toast.success(`Data room "${newDataRoom.name}" created successfully`);
  };

  const handleEditDataRoom = (name: string, description?: string) => {
    if (dialog?.type === 'editDataRoom') {
      updateDataRoom(dialog.dataRoom.id, { name, description });
      toast.success('Data room updated successfully');
    }
  };

  const handleDeleteDataRoom = () => {
    if (dialog?.type === 'deleteDataRoom') {
      deleteDataRoom(dialog.dataRoom.id);
      toast.success('Data room deleted successfully');
    }
    setDialog(null);
  };

  // Folder handlers
  const handleCreateFolder = (name: string) => {
    const result = createFolder(name, currentFolderId);
    if ('error' in result) {
      return result;
    }
    toast.success(`Folder "${result.name}" created successfully`);
    setDialog(null);
  };

  // Rename handler
  const handleRename = (id: string, newName: string) => {
    if (!dialog || dialog.type !== 'rename') return;
    
    const item = dialog.item;
    let result;
    
    if (item.type === 'folder') {
      result = updateFolder(id, newName);
    } else {
      result = updateFile(id, newName);
    }
    
    if (result && 'error' in result) {
      return result;
    }
    
    toast.success(`${item.type === 'folder' ? 'Folder' : 'File'} renamed successfully`);
  };

  // Delete handler
  const handleDelete = () => {
    if (!dialog || dialog.type !== 'delete') return;
    
    const item = dialog.item;
    
    if (item.type === 'folder') {
      deleteFolder(item.id);
    } else {
      deleteFile(item.id);
    }
    
    toast.success(`${item.type === 'folder' ? 'Folder' : 'File'} deleted successfully`);
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
