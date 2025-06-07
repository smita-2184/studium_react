"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PdfUploaderProps {
  onPdfSelect: (file: File) => void;
}

export function PdfUploader({ onPdfSelect }: PdfUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      onPdfSelect(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center p-4">
      <Input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="max-w-sm"
      />
      {selectedFile && (
        <p className="text-sm text-gray-500">
          Selected file: {selectedFile.name}
        </p>
      )}
    </div>
  );
} 