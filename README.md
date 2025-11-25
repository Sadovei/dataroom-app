# DataRoom - Secure Document Management

A modern, secure virtual data room application built with Next.js 14 for organizing and managing documents. This MVP was built as a take-home project demonstrating React/TypeScript best practices.

![DataRoom Screenshot](./public/screenshot.png)

## 🚀 Live Demo

[View Live Demo](https://your-vercel-url.vercel.app)

## ✨ Features

### Core Functionality
- **Data Rooms**: Create multiple data rooms to organize different projects/deals
- **Folder Management**: Create nested folders with unlimited depth
- **File Upload**: Upload PDF files with drag-and-drop support
- **PDF Preview**: View PDF documents directly in the browser
- **Search**: Real-time search across files and folders
- **View Modes**: Toggle between grid and list views

### Edge Cases Handled
- Duplicate file/folder name detection with auto-renaming
- File type validation (PDF only)
- File size limits (50MB max)
- Invalid character detection in names
- Empty state handling
- Confirmation dialogs for destructive actions

### UX Features
- Responsive design (mobile-friendly)
- Dark mode ready (CSS variables configured)
- Keyboard navigation support
- Toast notifications for actions
- Loading states
- Breadcrumb navigation

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand with localStorage persistence
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── globals.css        # Global styles with CSS variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/
│   ├── dataroom/          # Data room components
│   │   ├── DataRoomApp.tsx    # Main app orchestrator
│   │   ├── DataRoomList.tsx   # Data room cards grid
│   │   └── FileExplorer.tsx   # File/folder explorer
│   ├── dialogs/           # Modal dialogs
│   │   ├── CreateDataRoomDialog.tsx
│   │   ├── CreateFolderDialog.tsx
│   │   ├── DeleteDialog.tsx
│   │   ├── PDFPreviewDialog.tsx
│   │   └── RenameDialog.tsx
│   ├── layout/            # Layout components
│   │   └── Header.tsx
│   └── ui/                # shadcn/ui components
├── lib/
│   └── utils.ts           # Utility functions
├── store/
│   └── dataroom-store.ts  # Zustand store with persistence
└── types/
    └── index.ts           # TypeScript type definitions
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dataroom-app.git
cd dataroom-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 🎯 Design Decisions

### 1. State Management with Zustand
Chose Zustand over Redux for its simplicity and minimal boilerplate. The store uses localStorage persistence to maintain data across sessions without needing a backend.

### 2. Data Structure
```typescript
interface DataRoom {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;  // null = root level
  dataRoomId: string;
}

interface File {
  id: string;
  name: string;
  folderId: string | null;  // null = root level
  dataRoomId: string;
  size: number;
  mimeType: string;
  storageKey: string;
}
```

This flat structure with `parentId` references allows for:
- Efficient querying of items at any level
- Easy recursive operations (delete folder with children)
- Simple breadcrumb generation

### 3. File Storage
Files are stored as Base64 in localStorage for the MVP. This approach:
- Works without a backend
- Persists across sessions
- Has limitations (localStorage ~5-10MB limit)

For production, this would be replaced with cloud storage (S3, Supabase Storage).

### 4. Component Architecture
- **DataRoomApp**: Orchestrates all dialogs and actions
- **FileExplorer**: Handles navigation, search, and item display
- **DataRoomList**: Landing page with data room cards

This separation makes testing easier and follows single-responsibility principle.

### 5. UI/UX Choices
- Used shadcn/ui for consistent, accessible components
- Grid view default with list view option
- Contextual actions via dropdown menus
- Toast notifications for feedback
- Confirmation dialogs for destructive actions

## 🔮 Future Improvements

Given more time, I would add:

1. **Backend Integration**
   - Supabase for auth, database, and file storage
   - Real-time collaboration

2. **Authentication**
   - Google OAuth / Magic links
   - User permissions and sharing

3. **Enhanced Features**
   - Move/copy files between folders
   - Multi-select operations
   - File versioning
   - Activity log/audit trail
   - Full-text search in PDFs

4. **Performance**
   - Virtual scrolling for large lists
   - Lazy loading of PDF previews
   - File chunking for large uploads

## 📝 License

MIT

## 👤 Author

Radu Sadovei - [GitHub](https://github.com/yourusername)
