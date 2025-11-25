'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileSystemItem } from '@/types';
import { getFileNameWithoutExtension } from '@/lib/utils';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileSystemItem | null;
  onConfirm: (id: string, newName: string) => void | { error: string };
}

export function RenameDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
}: RenameDialogProps) {
  const initialName = item 
    ? item.type === 'file' 
      ? getFileNameWithoutExtension(item.name)
      : item.name
    : '';
  
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && item) {
      setName(item.type === 'file' ? getFileNameWithoutExtension(item.name) : item.name);
      setError('');
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(`${item.type === 'folder' ? 'Folder' : 'File'} name is required`);
      return;
    }

    if (trimmedName.length > 255) {
      setError('Name must be less than 255 characters');
      return;
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setError('Name contains invalid characters');
      return;
    }

    const result = onConfirm(item.id, trimmedName);
    if (result && 'error' in result) {
      setError(result.error);
      return;
    }

    handleOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Rename {item.type === 'folder' ? 'Folder' : 'File'}
            </DialogTitle>
            <DialogDescription>
              Enter a new name for &ldquo;{item.name}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newName">
                {item.type === 'folder' ? 'Folder' : 'File'} Name
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="newName"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  placeholder={item.name}
                  autoFocus
                  className={item.type === 'file' ? 'flex-1' : ''}
                />
                {item.type === 'file' && (
                  <span className="text-muted-foreground">.pdf</span>
                )}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Rename</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
