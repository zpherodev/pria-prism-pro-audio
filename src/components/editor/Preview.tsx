import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PreviewProps {
  file: File | null;
}

export const Preview = ({ file }: PreviewProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Preview</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Play className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Pause className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="preview-window">
        {file ? (
          <video className="w-full h-full" controls>
            <source src={URL.createObjectURL(file)} type={file.type} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-editor-text-secondary">
            No media selected
          </div>
        )}
      </div>
    </div>
  );
};