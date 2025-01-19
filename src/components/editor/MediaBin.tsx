import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MediaBinProps {
  onFileSelect: (file: File) => void;
}

export const MediaBin = ({ onFileSelect }: MediaBinProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Media Bin</h3>
      <div className="border-2 border-dashed border-editor-text-secondary rounded-lg p-4 text-center">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept="video/*,audio/*,image/*"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-editor-text-secondary mb-2" />
          <p className="text-sm text-editor-text-secondary">
            Drag & drop files or click to upload
          </p>
        </label>
      </div>
    </div>
  );
};