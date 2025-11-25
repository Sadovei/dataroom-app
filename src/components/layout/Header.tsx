'use client';

import { FolderLock, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <FolderLock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">DataRoom</h1>
            <p className="text-xs text-muted-foreground">Secure Document Management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">View on GitHub</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
