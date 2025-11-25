'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileSystemItem } from '@/types';
import { useDataRoomStore } from '@/store/supabase-store';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react';

interface PDFPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileSystemItem | null;
}

export function PDFPreviewDialog({
  open,
  onOpenChange,
  item,
}: PDFPreviewDialogProps) {
  const { getFileUrl } = useDataRoomStore();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Fetch file URL when dialog opens
  useEffect(() => {
    if (open && item && item.type === 'file') {
      setIsLoading(true);
      setFileUrl(null);
      getFileUrl(item.id).then((url) => {
        setFileUrl(url);
        if (!url) setIsLoading(false);
      });
    }
  }, [open, item, getFileUrl]);

  if (!item || item.type !== 'file') return null;

  const handleDownload = () => {
    if (!fileUrl) return;
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = item.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{item.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRotate}>
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/50 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !fileUrl ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">File content not available</p>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-full">
              <iframe
                src={fileUrl}
                className="w-full h-full min-h-[70vh] border-0 bg-white rounded-lg shadow-lg"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-in-out',
                }}
                onLoad={() => setIsLoading(false)}
                title={item.name}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
