import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { Source } from '../types';
import { ChevronDown, ChevronLeft, ChevronRight, BookOpen, Search, Map } from 'lucide-react';

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  pageNumber: number | null;
  sources?: Source[];
  onPageChange?: (page: number) => void;
}

export default function PDFViewer({ fileUrl, pageNumber, sources = [], onPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  // Load PDF document
  useEffect(() => {
    let isMounted = true;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;

        if (isMounted) {
          pdfDocRef.current = pdf;
          setNumPages(pdf.numPages);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
          setIsLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
      }
    };
  }, [fileUrl]);

  // Render page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocRef.current || !canvasRef.current) return;

      const currentPage = pageNumber || 1;

      try {
        const page: PDFPageProxy = await pdfDocRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale: 2 }); // High res scale

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Maintain aspect ratio in CSS
        canvas.style.width = '100%';
        canvas.style.height = 'auto';

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    if (!isLoading && pdfDocRef.current) {
      renderPage();
    }
  }, [pageNumber, isLoading]);

  const handleSourceClick = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
    setIsSourcesOpen(false);
  };

  const handlePrevPage = () => {
    if (onPageChange && pageNumber && pageNumber > 1) {
      onPageChange(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (onPageChange && numPages && (!pageNumber || pageNumber < numPages)) {
      onPageChange((pageNumber || 1) + 1);
    }
  };

  return (
    <div className="h-full flex flex-col border-l border-slate-200 bg-slate-100 relative">
      {/* Header */}
      <div className="h-16 shrink-0 px-5 bg-white border-b border-slate-200 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-2 text-slate-900 font-serif">
          <BookOpen className="text-orange-500" size={20} />
          <span className="font-bold tracking-tight text-lg">Travel Guide</span>
        </div>

        {/* Sources Dropdown */}
        {sources.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsSourcesOpen(!isSourcesOpen)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                ${isSourcesOpen
                  ? 'bg-slate-100 text-slate-900 ring-2 ring-slate-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}
              `}
            >
              <Search size={14} />
              <span>Found {sources.length} Refs</span>
              <ChevronDown size={14} className={`transform transition-transform duration-200 ${isSourcesOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isSourcesOpen && (
              <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Related Pages</span>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {sources.map((source, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSourceClick(source.page)}
                      className={`
                        w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3
                        ${pageNumber === source.page
                          ? 'bg-orange-50 text-orange-900 font-semibold border-l-4 border-orange-500'
                          : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                        }
                      `}
                    >
                      <Map size={14} className={pageNumber === source.page ? 'text-orange-500' : 'text-slate-400'} />
                      <span>Jump to Page {source.page}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto flex justify-center p-6 custom-scrollbar bg-slate-200/50">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <span className="font-medium animate-pulse">Opening Guidebook...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
            <span className="font-bold">⚠️ Unable to load PDF</span>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <div className="relative shadow-xl shadow-slate-900/10 rounded-sm overflow-hidden bg-white h-fit">
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
        )}
      </div>

      {/* Floating Navigation Controls */}
      {numPages && !isLoading && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-slate-900/60 hover:bg-slate-900/90 px-4 py-2 rounded-full shadow-lg transition-transform">
          <button
            onClick={handlePrevPage}
            disabled={!pageNumber || pageNumber <= 1}
            className="p-1.5 rounded-full hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm font-medium text-white font-mono">
            {pageNumber || 1} / {numPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={!pageNumber || pageNumber >= numPages}
            className="p-1.5 rounded-full hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

