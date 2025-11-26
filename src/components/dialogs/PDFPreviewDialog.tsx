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
import { Download, ZoomIn, ZoomOut, RotateCw, Loader2, AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  // Fetch file URL when dialog opens
  useEffect(() => {
    if (open && item && item.type === 'file') {
      setIsLoading(true);
      setFileUrl(null);
      setError(null);
      getFileUrl(item.id).then((url) => {
        if (url) {
          setFileUrl(url);
          setIsLoading(false);
        } else {
          setError('Could not load file');
          setIsLoading(false);
        }
      }).catch(() => {
        setError('Error loading file');
        setIsLoading(false);
      });
    }
  }, [open, item, getFileUrl]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setScale(1);
      setRotation(0);
      setIsLoading(true);
      setFileUrl(null);
      setError(null);
    }
  }, [open]);

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
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0" showCloseButton={false}>
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{item.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom out">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom in">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRotate} title="Rotate">
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownload} title="Download">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/50 p-4">
          {isLoading && !error ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download instead
              </Button>
            </div>
          ) : fileUrl ? (
            <div className="flex items-center justify-center min-h-full">
              <object
                data={fileUrl}
                type="application/pdf"
                className="w-full h-full min-h-[70vh] border-0 bg-white rounded-lg shadow-lg"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-in-out',
                }}
                onLoad={() => setIsLoading(false)}
              >
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    PDF preview not available in your browser
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </object>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
