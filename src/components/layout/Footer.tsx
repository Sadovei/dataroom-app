'use client';

import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} DataRoom. Built for secure document management.
        </p>
        <p className="flex items-center gap-1">
          Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by Radu Sadovei
        </p>
      </div>
    </footer>
  );
}
