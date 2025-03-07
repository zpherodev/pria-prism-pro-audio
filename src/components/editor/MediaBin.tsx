
import React from 'react';
import { Upload, AudioLines } from 'lucide-react';

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
      <h3 className="text-lg font-medium mb-4">Audio Library</h3>
      <div className="border-2 border-dashed border-editor-text-secondary rounded-lg p-4 text-center">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept="audio/*"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <AudioLines className="mx-auto h-12 w-12 text-editor-text-secondary mb-2" />
          <p className="text-sm text-editor-text-secondary">
            Drag & drop audio files or click to upload
          </p>
        </label>
      </div>
    </div>
  );
};
