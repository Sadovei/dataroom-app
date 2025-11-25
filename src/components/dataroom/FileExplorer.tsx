'use client';

import { useState, useRef, DragEvent } from 'react';
import { useDataRoomStore } from '@/store/supabase-store';
import { FileSystemItem } from '@/types';
import { 
  Folder, 
  FileText, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  FolderPlus,
  Grid,
  List,
  Search,
  ChevronRight,
  ArrowLeft,
  File as FileIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatFileSize, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface FileExplorerProps {
  onRename: (item: FileSystemItem) => void;
  onDelete: (item: FileSystemItem) => void;
  onPreview: (item: FileSystemItem) => void;
  onCreateFolder: () => void;
}

type ViewMode = 'grid' | 'list';

export function FileExplorer({ 
  onRename, 
  onDelete, 
  onPreview, 
  onCreateFolder 
}: FileExplorerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    currentDataRoomId,
    currentFolderId,
    breadcrumbs,
    searchQuery,
    setSearchQuery,
    getCurrentItems,
    navigateToFolder,
    setCurrentDataRoom,
    uploadFile,
    getFileUrl,
    dataRooms,
    selectedItems,
    toggleItemSelection,
    clearSelection,
  } = useDataRoomStore();

  const items = getCurrentItems();
  const currentDataRoom = dataRooms.find(dr => dr.id === currentDataRoomId);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!currentDataRoomId) return;

    for (const file of Array.from(files)) {
      const result = await uploadFile(file, currentDataRoomId, currentFolderId ?? undefined);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success(`${result.name} uploaded successfully`);
      }
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    await handleFileUpload(files);
  };

  const handleDownload = async (item: FileSystemItem) => {
    if (item.type !== 'file') return;
    
    const url = await getFileUrl(item.id);
    if (!url) {
      toast.error('File not found');
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = item.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const handleItemClick = (item: FileSystemItem, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      toggleItemSelection(item.id);
      return;
    }

    clearSelection();
    
    if (item.type === 'folder') {
      navigateToFolder(item.id);
    } else {
      onPreview(item);
    }
  };

  const handleItemDoubleClick = (item: FileSystemItem) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id);
    } else {
      onPreview(item);
    }
  };

  const handleBackToDataRooms = () => {
    setCurrentDataRoom(null);
    clearSelection();
  };

  return (
    <div 
      className="flex flex-col h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" onClick={handleBackToDataRooms}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{currentDataRoom?.name}</h1>
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id ?? 'root'} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="w-3 h-3" />}
                  <button
                    onClick={() => navigateToFolder(crumb.id)}
                    className={cn(
                      "hover:text-foreground transition-colors",
                      index === breadcrumbs.length - 1 && "text-foreground font-medium"
                    )}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={onCreateFolder}>
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Drag and drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-blue-600">Drop PDF files here</p>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              {searchQuery ? (
                <Search className="w-10 h-10 text-muted-foreground" />
              ) : (
                <Folder className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-1">
              {searchQuery ? 'No results found' : 'This folder is empty'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No files or folders match "${searchQuery}"`
                : 'Upload files or create folders to get started'
              }
            </p>
            {!searchQuery && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCreateFolder}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF
                </Button>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <GridItem
                key={item.id}
                item={item}
                isSelected={selectedItems.includes(item.id)}
                onClick={(e) => handleItemClick(item, e)}
                onDoubleClick={() => handleItemDoubleClick(item)}
                onRename={() => onRename(item)}
                onDelete={() => onDelete(item)}
                onDownload={() => handleDownload(item)}
              />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium w-32">Size</th>
                  <th className="text-left p-3 font-medium w-40">Modified</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ListItem
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.includes(item.id)}
                    onClick={(e) => handleItemClick(item, e)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    onRename={() => onRename(item)}
                    onDelete={() => onDelete(item)}
                    onDownload={() => handleDownload(item)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface ItemProps {
  item: FileSystemItem;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

function GridItem({ item, isSelected, onClick, onDoubleClick, onRename, onDelete, onDownload }: ItemProps) {
  return (
    <div
      className={cn(
        "group relative p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors",
        isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
            <Edit className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
          {item.type === 'file' && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600 dark:text-red-400"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="flex flex-col items-center text-center">
        <div className={cn(
          "w-16 h-16 rounded-lg flex items-center justify-center mb-3",
          item.type === 'folder' 
            ? "bg-blue-100 dark:bg-blue-900/30" 
            : "bg-red-100 dark:bg-red-900/30"
        )}>
          {item.type === 'folder' ? (
            <Folder className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          ) : (
            <FileIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          )}
        </div>
        <p className="text-sm font-medium truncate w-full">{item.name}</p>
        {item.type === 'file' && item.size && (
          <p className="text-xs text-muted-foreground mt-1">{formatFileSize(item.size)}</p>
        )}
      </div>
    </div>
  );
}

function ListItem({ item, isSelected, onClick, onDoubleClick, onRename, onDelete, onDownload }: ItemProps) {
  return (
    <tr
      className={cn(
        "border-b hover:bg-accent/50 cursor-pointer transition-colors",
        isSelected && "bg-blue-50 dark:bg-blue-900/20"
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            item.type === 'folder' 
              ? "bg-blue-100 dark:bg-blue-900/30" 
              : "bg-red-100 dark:bg-red-900/30"
          )}>
            {item.type === 'folder' ? (
              <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <span className="font-medium truncate">{item.name}</span>
        </div>
      </td>
      <td className="p-3 text-sm text-muted-foreground">
        {item.type === 'file' && item.size ? formatFileSize(item.size) : '—'}
      </td>
      <td className="p-3 text-sm text-muted-foreground">
        {formatDate(item.updatedAt)}
      </td>
      <td className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
              <Edit className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            {item.type === 'file' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 dark:text-red-400"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
