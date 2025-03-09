import React, { useState } from 'react';
import { MediaBin } from './editor/MediaBin';
import { Timeline } from './editor/Timeline';
import { Preview } from './editor/Preview';
import { EffectsPanel } from './editor/EffectsPanel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
export const AudioEditor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Handle selection from Timeline
  const handleTimelineChange = (startTime: number, endTime: number) => {
    console.log(`Selection from ${startTime}s to ${endTime}s`);
    // In a full implementation, this would trigger audio editing features
  };
  const handleAudioBufferLoaded = (buffer: AudioBuffer) => {
    setAudioBuffer(buffer);
  };

  // Calculate panel widths based on collapse state
  const getGridClasses = () => {
    if (leftPanelCollapsed && rightPanelCollapsed) {
      return "grid-cols-[1fr_98fr_1fr]";
    } else if (leftPanelCollapsed) {
      return "grid-cols-[1fr_79fr_20fr]";
    } else if (rightPanelCollapsed) {
      return "grid-cols-[20fr_79fr_1fr]";
    } else {
      return "grid-cols-[20fr_60fr_20fr]";
    }
  };
  return <div className="flex flex-col gap-4">
      {/* Main Content Area */}
      <div className={`grid gap-4 ${getGridClasses()}`}>
        {/* Left Panel - Media Bin with collapse toggle */}
        <div className={`panel flex flex-col ${leftPanelCollapsed ? "items-center" : ""}`}>
          {leftPanelCollapsed ? <Button variant="ghost" size="icon" onClick={() => setLeftPanelCollapsed(false)} className="mb-2">
              <ChevronRight className="h-4 w-4" />
            </Button> : <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Media Library</h3>
                <Button variant="ghost" size="icon" onClick={() => setLeftPanelCollapsed(true)} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <MediaBin onFileSelect={file => {
            setSelectedFile(file);
            // Reset audio buffer when file changes
            setAudioBuffer(null);
          }} />
            </>}
        </div>

        {/* Center Panel - Waveform Preview and Timeline */}
        <div className="flex flex-col gap-4">
          <div className="panel flex-grow">
            <Preview file={selectedFile} onAudioBufferLoaded={handleAudioBufferLoaded} />
          </div>
          
          {/* Multitrack Timeline */}
          <div className="panel">
            <Timeline label="Multitrack Timeline" audioBuffer={audioBuffer} onTimelineChange={handleTimelineChange} multitrack={true} />
          </div>
        </div>

        {/* Right Panel - Effects with collapse toggle */}
        <div className={`panel flex flex-col ${rightPanelCollapsed ? "items-center" : ""}`}>
          {rightPanelCollapsed ? <Button variant="ghost" size="icon" onClick={() => setRightPanelCollapsed(false)} className="mb-2">
              <ChevronLeft className="h-4 w-4" />
            </Button> : <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Effects</h3>
                <Button variant="ghost" size="icon" onClick={() => setRightPanelCollapsed(true)} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <EffectsPanel audioBuffer={audioBuffer} />
            </>}
        </div>
      </div>
    </div>;
};