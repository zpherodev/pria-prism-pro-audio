
import React from 'react';
import { Button } from "@/components/ui/button";
import { Pencil, Eraser, IterationCcw, Music4, Trash2, Plus, Minus, Play, Pause, SkipBack, Repeat } from 'lucide-react';
import { SnapValue, ToolType } from '@/types/pianoRoll';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface PianoRollToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  snapValue: SnapValue;
  setSnapValue: (value: SnapValue) => void;
  isPlaying: boolean;
  togglePlayback: () => void;
  resetPlayback: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  loopEnabled: boolean;
  toggleLoopMode: () => void;
  clearAllNotes: () => void;
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
  clearAllNotes
}) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Piano Roll</h3>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex bg-editor-panel rounded-md overflow-hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            title="Select Tool" 
            onClick={() => setActiveTool('select')} 
            className={activeTool === 'select' ? 'bg-blue-800/20' : ''}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
              <path d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13C3.77614 13 4 12.7761 4 12.5V2.5C4 2.22386 3.77614 2 3.5 2ZM5.5 4C5.22386 4 5 4.22386 5 4.5V10.5C5 10.7761 5.22386 11 5.5 11C5.77614 11 6 10.7761 6 10.5V4.5C6 4.22386 5.77614 4 5.5 4ZM7 6.5C7 6.22386 7.22386 6 7.5 6C7.77614 6 8 6.22386 8 6.5V8.5C8 8.77614 7.77614 9 7.5 9C7.22386 9 7 8.77614 7 8.5V6.5ZM9.5 4C9.22386 4 9 4.22386 9 4.5V10.5C9 10.7761 9.22386 11 9.5 11C9.77614 11 10 10.7761 10 10.5V4.5C10 4.22386 9.77614 4 9.5 4ZM11 2.5C11 2.22386 11.2239 2 11.5 2C11.7761 2 12 2.22386 12 2.5V12.5C12 12.7761 11.7761 13 11.5 13C11.2239 13 11 12.7761 11 12.5V2.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Pencil Tool" 
            onClick={() => setActiveTool('pencil')} 
            className={activeTool === 'pencil' ? 'bg-blue-800/20' : ''}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Erase Tool" 
            onClick={() => setActiveTool('erase')} 
            className={activeTool === 'erase' ? 'bg-blue-800/20' : ''}
          >
            <Eraser className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Loop Tool" 
            onClick={() => setActiveTool('loop')} 
            className={activeTool === 'loop' ? 'bg-blue-800/20' : ''}
          >
            <IterationCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="bg-zinc-700 hover:bg-zinc-600 flex items-center gap-1 text-xs"
            >
              <Music4 className="h-3 w-3 mr-1" />
              Snap: {snapValue}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => setSnapValue('1/32')}
              className={snapValue === '1/32' ? 'bg-blue-900/20' : ''}
            >
              1/32 Note
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSnapValue('1/16')}
              className={snapValue === '1/16' ? 'bg-blue-900/20' : ''}
            >
              1/16 Note
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSnapValue('1/8')}
              className={snapValue === '1/8' ? 'bg-blue-900/20' : ''}
            >
              1/8 Note
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSnapValue('1/4')}
              className={snapValue === '1/4' ? 'bg-blue-900/20' : ''}
            >
              1/4 Note
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSnapValue('1/2')}
              className={snapValue === '1/2' ? 'bg-blue-900/20' : ''}
            >
              1/2 Note
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSnapValue('1')}
              className={snapValue === '1' ? 'bg-blue-900/20' : ''}
            >
              Whole Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex bg-editor-panel rounded-md overflow-hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            title="Reset" 
            onClick={resetPlayback} 
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title={isPlaying ? "Pause" : "Play"}
            onClick={togglePlayback} 
            className="bg-zinc-600 hover:bg-zinc-500"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title={loopEnabled ? "Disable Loop" : "Enable Loop"}
            onClick={toggleLoopMode} 
            className={`bg-zinc-600 hover:bg-zinc-500 ${loopEnabled ? 'text-blue-400' : ''}`}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex bg-editor-panel rounded-md overflow-hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            title="Zoom Out" 
            onClick={handleZoomOut} 
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Zoom In" 
            onClick={handleZoomIn} 
            className="bg-zinc-600 hover:bg-zinc-500"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={clearAllNotes} 
          className="bg-red-900/30 hover:bg-red-900/50 text-red-500 h-8 text-xs"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Clear All
        </Button>
      </div>
    </div>
  );
};
