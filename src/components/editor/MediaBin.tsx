
import React from 'react';
import { Upload, AudioLines, Music, Piano, Guitar, Drumstick, Radio } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MediaBinProps {
  onFileSelect: (file: File) => void;
  onLoadDefaultSounds?: (instrument: string) => void;
  hasDefaultSounds?: boolean;
}

export const MediaBin = ({ onFileSelect, onLoadDefaultSounds, hasDefaultSounds }: MediaBinProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Audio Library</h3>
      
      {/* Default sounds buttons */}
      {onLoadDefaultSounds && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button 
            variant="outline" 
            className="flex items-center justify-center" 
            onClick={() => onLoadDefaultSounds('PIANO')}
          >
            <Piano className="mr-2 h-4 w-4" />
            Piano
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center" 
            onClick={() => onLoadDefaultSounds('BASS')}
          >
            <Radio className="mr-2 h-4 w-4" />
            Bass
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center" 
            onClick={() => onLoadDefaultSounds('DRUMS')}
          >
            <Drumstick className="mr-2 h-4 w-4" />
            Drums
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center" 
            onClick={() => onLoadDefaultSounds('GUITAR')}
          >
            <Guitar className="mr-2 h-4 w-4" />
            Guitar
          </Button>
        </div>
      )}
      
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
