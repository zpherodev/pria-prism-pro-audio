
import React, { useRef } from 'react';
import { 
  Play, Pause, SkipBack, ZoomIn, ZoomOut, 
  Repeat, Trash2, Pencil, Pointer, Scissors, Download, Upload
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SnapValue, ToolType } from '@/types/pianoRoll';
import { notesToMidiFile, midiFileToNotes, downloadBlob } from '@/utils/midiUtils';

interface PianoRollToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  snapValue: SnapValue;
  setSnapValue: (value: SnapValue) => void;
  isPlaying: boolean;
  togglePlayback: () => void;
  resetPlayback: () => void;
  handleZoomIn?: () => void;
  handleZoomOut?: () => void;
  loopEnabled: boolean;
  toggleLoopMode: () => void;
  clearAllNotes: () => void;
  notes: any[];
  onNotesImported?: (notes: any[]) => void;
}

export const PianoRollToolbar: React.FC<PianoRollToolbarProps> = ({
  activeTool,
  setActiveTool,
  snapValue,
  setSnapValue,
  isPlaying,
  togglePlayback,
  resetPlayback,
  handleZoomIn,
  handleZoomOut,
  loopEnabled,
  toggleLoopMode,
  clearAllNotes,
  notes,
  onNotesImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle MIDI export
  const handleExportMidi = () => {
    const midiBlob = notesToMidiFile(notes);
    downloadBlob(midiBlob, 'piano-roll-composition.mid');
  };

  // Handle MIDI import
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the uploaded MIDI file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onNotesImported) {
      try {
        const importedNotes = await midiFileToNotes(file);
        onNotesImported(importedNotes);
      } catch (error) {
        console.error('Error importing MIDI file:', error);
        alert('Failed to import MIDI file. Please try a different file.');
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-2 bg-zinc-800 p-2 rounded-md">
      {/* Hidden file input for MIDI import */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".mid,.midi"
        onChange={handleFileUpload}
      />
      
      {/* Tools Section */}
      <div className="flex items-center gap-1 border-r border-zinc-700 pr-2">
        <Toggle
          pressed={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
          aria-label="Select Tool"
          title="Select Tool"
        >
          <Pointer className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={activeTool === 'pencil'}
          onClick={() => setActiveTool('pencil')}
          aria-label="Pencil Tool"
          title="Pencil Tool"
        >
          <Pencil className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={activeTool === 'eraser'}
          onClick={() => setActiveTool('eraser')}
          aria-label="Eraser Tool"
          title="Eraser Tool"
        >
          <Scissors className="h-4 w-4" />
        </Toggle>
      </div>
      
      {/* Playback Controls */}
      <div className="flex items-center gap-1 border-r border-zinc-700 pr-2">
        <Button variant="ghost" size="icon" onClick={resetPlayback} title="Reset Playback">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={togglePlayback} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Toggle
          pressed={loopEnabled}
          onClick={toggleLoopMode}
          aria-label="Loop Mode"
          title="Loop Mode"
        >
          <Repeat className="h-4 w-4" />
        </Toggle>
      </div>
      
      {/* Snap Menu */}
      <div className="flex items-center gap-1 border-r border-zinc-700 pr-2">
        <Select
          value={snapValue}
          onValueChange={(value) => setSnapValue(value as SnapValue)}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue placeholder="Snap" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1/32">1/32</SelectItem>
            <SelectItem value="1/16">1/16</SelectItem>
            <SelectItem value="1/8">1/8</SelectItem>
            <SelectItem value="1/4">1/4</SelectItem>
            <SelectItem value="1/2">1/2</SelectItem>
            <SelectItem value="1">1</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Zoom Controls */}
      {handleZoomIn && handleZoomOut && (
        <div className="flex items-center gap-1 border-r border-zinc-700 pr-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* MIDI Import/Export */}
      <div className="flex items-center gap-1 border-r border-zinc-700 pr-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleImportClick} 
          title="Import MIDI"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleExportMidi} 
          title="Export as MIDI"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Clear Notes Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Clear Notes">
            <Trash2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={clearAllNotes}>
            Clear All Notes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
