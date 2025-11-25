'use client';

import { useDataRoomStore } from '@/store/supabase-store';
import { DataRoom } from '@/types';
import { 
  FolderOpen, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Calendar,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface DataRoomListProps {
  onCreateDataRoom: () => void;
  onEditDataRoom: (dataRoom: DataRoom) => void;
  onDeleteDataRoom: (dataRoom: DataRoom) => void;
}

export function DataRoomList({ 
  onCreateDataRoom, 
  onEditDataRoom, 
  onDeleteDataRoom 
}: DataRoomListProps) {
  const { dataRooms, setCurrentDataRoom, folders, files } = useDataRoomStore();

  const getDataRoomStats = (dataRoomId: string) => {
    const folderCount = folders.filter(f => f.dataRoomId === dataRoomId).length;
    const fileCount = files.filter(f => f.dataRoomId === dataRoomId).length;
    return { folderCount, fileCount };
  };

  if (dataRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
          <FolderOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No Data Rooms Yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create your first data room to start organizing and storing your documents securely.
        </p>
        <Button onClick={onCreateDataRoom} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Create Data Room
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Your Data Rooms</h2>
          <p className="text-muted-foreground">
            {dataRooms.length} data room{dataRooms.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={onCreateDataRoom}>
          <Plus className="w-4 h-4 mr-2" />
          New Data Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataRooms.map((dataRoom) => {
          const stats = getDataRoomStats(dataRoom.id);
          return (
            <Card 
              key={dataRoom.id} 
              className="group cursor-pointer hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700"
              onClick={() => setCurrentDataRoom(dataRoom.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEditDataRoom(dataRoom);
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 dark:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDataRoom(dataRoom);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg mt-3">{dataRoom.name}</CardTitle>
                {dataRoom.description && (
                  <CardDescription className="line-clamp-2">
                    {dataRoom.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FolderOpen className="w-4 h-4" />
                    {stats.folderCount} folder{stats.folderCount !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {stats.fileCount} file{stats.fileCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                  <Calendar className="w-3 h-3" />
                  Created {formatDate(dataRoom.createdAt)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
