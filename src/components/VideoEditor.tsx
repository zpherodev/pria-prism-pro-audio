import React, { useState } from 'react';
import { MediaBin } from './editor/MediaBin';
import { Timeline } from './editor/Timeline';
import { Preview } from './editor/Preview';
import { Button } from "@/components/ui/button";
import { Upload, Play, Pause, Plus, Minus } from 'lucide-react';

export const VideoEditor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Panel - Media Bin */}
        <div className="panel w-full md:w-1/4">
          <MediaBin onFileSelect={setSelectedFile} />
        </div>

        {/* Right Panel - Preview */}
        <div className="panel flex-grow">
          <Preview file={selectedFile} />
        </div>
      </div>

      {/* Timeline Section */}
      <div className="panel">
        <Timeline />
      </div>

      {/* Audio Timeline */}
      <div className="panel">
        <div className="text-sm font-medium mb-2">Audio Timeline</div>
        <div className="timeline-track"></div>
      </div>
    </div>
  );
};