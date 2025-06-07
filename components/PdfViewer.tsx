"use client";

import { useState, useEffect } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PdfViewerProps {
  file: File | null;
}

export function PdfViewer({ file }: PdfViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setFileUrl(null);
    }
  }, [file]);

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <p className="text-lg">Select a PDF file to start learning.</p>
        <p className="text-sm">Use the "Add content" button in the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer 
                fileUrl={fileUrl}
                plugins={[defaultLayoutPluginInstance]}
                theme="dark"
            />
        </Worker>
    </div>
  );
} 