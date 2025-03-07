
import React, { useState } from 'react';
import { MediaBin } from './editor/MediaBin';
import { Timeline } from './editor/Timeline';
import { Preview } from './editor/Preview';
import { AudioLines } from 'lucide-react';

export const AudioEditor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Panel - Media Bin */}
        <div className="panel w-full md:w-1/4">
          <MediaBin onFileSelect={setSelectedFile} />
        </div>

        {/* Right Panel - Waveform Preview */}
        <div className="panel flex-grow">
          <Preview file={selectedFile} />
        </div>
      </div>

      {/* Audio Timeline Section */}
      <div className="panel">
        <Timeline label="Main Timeline" />
      </div>

      {/* Effects Timeline */}
      <div className="panel">
        <Timeline label="Effects Timeline" />
      </div>
    </div>
  );
};
