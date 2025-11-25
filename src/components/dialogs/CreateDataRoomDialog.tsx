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

interface CreateDataRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, description?: string) => void;
  editMode?: boolean;
  initialName?: string;
  initialDescription?: string;
}

export function CreateDataRoomDialog({
  open,
  onOpenChange,
  onConfirm,
  editMode = false,
  initialName = '',
  initialDescription = '',
}: CreateDataRoomDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState('');

  // Reset state when dialog opens with new initial values
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setError('');
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }

    if (trimmedName.length > 100) {
      setError('Name must be less than 100 characters');
      return;
    }

    onConfirm(trimmedName, description.trim() || undefined);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edit Data Room' : 'Create New Data Room'}
            </DialogTitle>
            <DialogDescription>
              {editMode 
                ? 'Update the details for this data room.'
                : 'Create a new data room to organize your documents.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g., Project Alpha Documents"
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this data room"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editMode ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
