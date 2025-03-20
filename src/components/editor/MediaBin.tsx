
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
      
      {/* Default sound mapping buttons */}
      {onLoadDefaultSounds && (
        <div>
          <h4 className="text-sm font-medium mb-2">Map Sound To Instrument:</h4>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button 
              variant="outline" 
              className="flex items-center justify-center" 
              onClick={() => onLoadDefaultSounds('PIANO')}
            >
              <Piano className="mr-2 h-4 w-4" />
              Piano (C4)
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center" 
              onClick={() => onLoadDefaultSounds('BASS')}
            >
              <Radio className="mr-2 h-4 w-4" />
              Bass (C2)
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center" 
              onClick={() => onLoadDefaultSounds('DRUMS')}
            >
              <Drumstick className="mr-2 h-4 w-4" />
              Drums (Kick)
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center" 
              onClick={() => onLoadDefaultSounds('GUITAR')}
            >
              <Guitar className="mr-2 h-4 w-4" />
              Guitar (C3)
            </Button>
          </div>
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
            Upload your own sounds (.wav, .mp3, etc.)
          </p>
          <p className="text-xs text-editor-text-secondary mt-1">
            Drag & drop or click to browse files
          </p>
        </label>
      </div>
    </div>
  );
};
