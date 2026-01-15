# Travai Frontend

This is the frontend application for Travai, an AI-powered Thailand Travel Guide. It provides a chat interface that interacts with the backend API and displays relevant information from the Thailand Guide PDF with direct citations.

## Features

- **AI Chat Interface**: Interactive chat with context-aware responses.
- **Session Management**: Create, delete, and switch between multiple chat sessions.
- **Integrated PDF Viewer**: seamless split-screen view of the "Tourist Thailand Guide" PDF.
- **Smart Citations**: Assistant responses include citation buttons that automatically open the PDF viewer to the relevant page.
- **Rich Text Support**: Full Markdown support including tables, lists, and code blocks using GitHub Flavored Markdown (GFM).
- **Responsive Design**: Collapsible sidebar and PDF viewer for optimal viewing on different screen sizes.
- **Configuration**: User-configurable API Key settings.

## Technology Stack

- **Framework**: React 19, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Markdown Rendering**: react-markdown, remark-gfm
- **PDF Rendering**: pdfjs-dist

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Building for Production

Build the application for production:

```bash
npm run build
```

The output will be in the `dist` directory.

### Configuration

On the first launch, open the settings (gear icon in the sidebar) and enter your API Key to authenticate with the backend services.

## Project Structure

- `src/components/`: Reusable UI components (ChatHeader, ChatInput, Sidebar, PDFViewer, etc.)
- `src/types.ts`: TypeScript definitions for the application.
- `src/App.tsx`: Main application layout and state management.
- `public/`: Static assets including the guide PDF.
