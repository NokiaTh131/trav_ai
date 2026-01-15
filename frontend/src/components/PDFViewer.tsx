import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { Source } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
        const viewport = page.getViewport({ scale: 2 });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

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
  };

  return (
    <div className="h-full flex flex-col border-l border-gray-300 bg-gray-100">
      {/* Header with toggle button */}
      <div className="p-3 bg-white text-gray-700 border-b border-gray-200 font-semibold flex items-center justify-between">
        <span>Guidebook Viewer</span>

        {/* Toggle sources button - only show if sources exist */}
        {sources.length > 0 && (
          <button
            onClick={() => setIsSourcesOpen(!isSourcesOpen)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
            title={isSourcesOpen ? 'Hide sources' : 'Show sources'}
          >
            <span>Sources ({sources.length})</span>
            {isSourcesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sources Sidebar */}
        {sources.length > 0 && isSourcesOpen && (
          <div className="w-36 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center justify-center">
                Ref Pages
              </h3>
              <div className="space-y-1">
                {sources.map((source, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSourceClick(source.page)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center
                      ${pageNumber === source.page
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {source.page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PDF Canvas Area */}
        <div className="flex-1 overflow-auto flex justify-center p-4">
          {isLoading && <div className="p-4">Loading PDF...</div>}
          {error && <div className="p-4 text-red-500">Error: {error}</div>}
          {!isLoading && !error && (
            <canvas ref={canvasRef} className="shadow-lg" />
          )}
        </div>
      </div>

      {/* Footer - Page Counter */}
      {numPages && (
        <div className="p-2 bg-white border-t border-gray-200 text-center text-sm text-gray-500">
          Page {pageNumber || 1} of {numPages}
        </div>
      )}
    </div>
  );
}
