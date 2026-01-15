import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  pageNumber: number | null;
}

export default function PDFViewer({ fileUrl, pageNumber }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
        const viewport = page.getViewport({ scale: 1.2 });

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

  return (
    <div className="h-full flex flex-col border-l border-gray-200 bg-gray-100">
      <div className="p-3 bg-white border-b border-gray-200 font-semibold">
        Guidebook Viewer
      </div>

      <div className="flex-1 overflow-auto flex justify-center p-4">
        {isLoading && <div className="p-4">Loading PDF...</div>}
        {error && <div className="p-4 text-red-500">Error: {error}</div>}
        {!isLoading && !error && (
          <canvas ref={canvasRef} className="shadow-lg" />
        )}
      </div>

      {numPages && (
        <div className="p-2 bg-white border-t border-gray-200 text-center text-sm text-gray-500">
          Page {pageNumber || 1} of {numPages}
        </div>
      )}
    </div>
  );
}
