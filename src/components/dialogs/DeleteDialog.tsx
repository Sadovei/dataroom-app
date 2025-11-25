'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileSystemItem, DataRoom } from '@/types';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileSystemItem | DataRoom | null;
  itemType: 'file' | 'folder' | 'dataroom';
  onConfirm: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  item,
  itemType,
  onConfirm,
}: DeleteDialogProps) {
  if (!item) return null;

  const getTitle = () => {
    switch (itemType) {
      case 'dataroom':
        return 'Delete Data Room';
      case 'folder':
        return 'Delete Folder';
      case 'file':
        return 'Delete File';
    }
  };

  const getDescription = () => {
    switch (itemType) {
      case 'dataroom':
        return `Are you sure you want to delete "${item.name}"? This will permanently delete all folders and files inside this data room. This action cannot be undone.`;
      case 'folder':
        return `Are you sure you want to delete "${item.name}"? This will also delete all files and subfolders inside. This action cannot be undone.`;
      case 'file':
        return `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
