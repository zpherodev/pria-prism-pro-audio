import React, { useRef, useEffect, useState } from 'react';
import { Plus, Minus, Scissors, MoveHorizontal, Play, Pause, ChevronRight, ChevronLeft, Volume2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TimelineProps {
  label?: string;
  audioBuffer?: AudioBuffer | null;
  onTimelineChange?: (startTime: number, endTime: number) => void;
  multitrack?: boolean;
}

export const Timeline = ({
  label = "Audio Timeline",
  audioBuffer,
  onTimelineChange,
  multitrack = false
}: TimelineProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState(0); // Current playback position in seconds
  const [selection, setSelection] = useState<{
    start: number;
    end: number | null;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTool, setCurrentTool] = useState<'select' | 'split' | 'move'>('select');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [tracks, setTracks] = useState<Array<{
    id: string;
    name: string;
    color: string;
    gain: number;
  }>>([]);
  const [activeTrack, setActiveTrack] = useState('1');

  useEffect(() => {
    if (audioBuffer) {
      setDuration(audioBuffer.duration);

      if (multitrack && tracks.length === 0) {
        setTracks([
          {
            id: '1',
            name: 'Main Track',
            color: '#3B82F6',
            gain: 0
          },
          {
            id: '2',
            name: 'Vocal Track',
            color: '#10B981',
            gain: 0
          },
          {
            id: '3',
            name: 'Drums Track',
            color: '#EF4444',
            gain: 0
          },
          {
            id: '4',
            name: 'Bass Track',
            color: '#F59E0B',
            gain: 0
          },
          {
            id: '5',
            name: 'Effects Track',
            color: '#8B5CF6',
            gain: 0
          }
        ]);
      }
    }
  }, [audioBuffer, multitrack]);

  const handleGainChange = (trackId: string, newGain: number) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, gain: newGain } : track
    ));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth - (multitrack ? 120 : 0);
        canvas.height = multitrack ? 200 : 80;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawTimeline = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1F2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const secondsVisible = duration / zoom;
      const pixelsPerSecond = canvas.width / secondsVisible;
      const secondsBetweenMarkers = getSecondsBetweenMarkers(zoom);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';

      for (let i = 0; i < secondsVisible; i += secondsBetweenMarkers) {
        const x = i * pixelsPerSecond;
        ctx.strokeStyle = '#4B5563';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 15);
        ctx.stroke();
        const time = formatTime(i);
        ctx.fillText(time, x, 25);
      }

      if (multitrack && tracks.length > 0) {
        const trackHeight = (canvas.height - 30) / tracks.length;
        
        tracks.forEach((track, index) => {
          const yPos = 30 + index * trackHeight;
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, yPos);
          ctx.lineTo(canvas.width, yPos);
          ctx.stroke();

          if (track.id === activeTrack) {
            ctx.fillStyle = `${track.color}20`;
            ctx.fillRect(0, yPos, canvas.width, trackHeight);
          }
        });
      }

      if (selection) {
        const startX = selection.start * pixelsPerSecond;
        const endX = selection.end !== null ? selection.end * pixelsPerSecond : position * pixelsPerSecond;
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.fillRect(startX, 0, endX - startX, canvas.height);

        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, canvas.height);
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, canvas.height);
        ctx.stroke();
      }

      const playheadX = position * pixelsPerSecond;
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.stroke();

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX, 5);
      ctx.closePath();
      ctx.fill();

      if (audioBuffer) {
        if (multitrack && tracks.length > 0) {
          const trackHeight = (canvas.height - 30) / tracks.length;
          
          tracks.forEach((track, index) => {
            const yPos = 30 + index * trackHeight;
            const centerY = yPos + trackHeight / 2;
            ctx.strokeStyle = track.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            const amplitude = 15;

            for (let x = 0; x < canvas.width; x++) {
              const time = x / pixelsPerSecond;
              let y;
              if (index === 0) {
                y = centerY + Math.sin(time * 10) * amplitude * Math.min(0.8, Math.random() + 0.2);
              } else if (index === 1) {
                y = centerY + Math.sin(time * 15) * amplitude * Math.min(0.6, Math.random() + 0.4);
              } else if (index === 2) {
                y = centerY + Math.sin(time * 20) * amplitude * Math.min(0.7, Math.random() + 0.3);
              } else if (index === 3) {
                y = centerY + Math.sin(time * 5) * amplitude * Math.min(0.9, Math.random() + 0.1);
              } else {
                y = centerY + Math.sin(time * 8) * amplitude * Math.min(0.5, Math.random() + 0.5);
              }
              if (x === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.stroke();
          });
        } else {
          ctx.strokeStyle = '#60A5FA';
          ctx.lineWidth = 1;
          ctx.beginPath();
          const centerY = canvas.height / 2 + 15;
          const amplitude = 20;
          for (let x = 0; x < canvas.width; x++) {
            const time = x / pixelsPerSecond;
            const y = centerY + Math.sin(time * 10) * amplitude * Math.min(0.8, Math.random() + 0.2);
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      }
    };
    drawTimeline();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [zoom, position, selection, audioBuffer, duration, currentTool, multitrack, tracks, activeTrack]);

  const getSecondsBetweenMarkers = (zoom: number) => {
    if (zoom > 5) return 0.1;
    if (zoom > 2) return 0.5;
    if (zoom > 1) return 1;
    if (zoom > 0.5) return 5;
    if (zoom > 0.2) return 10;
    return 30;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor(seconds % 1 * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const secondsVisible = duration / zoom;
    const pixelsPerSecond = canvasRef.current.width / secondsVisible;
    const clickTimePosition = x / pixelsPerSecond;

    if (multitrack && y > 30) {
      const trackHeight = (canvasRef.current.height - 30) / tracks.length;
      const trackIndex = Math.floor((y - 30) / trackHeight);
      if (trackIndex >= 0 && trackIndex < tracks.length) {
        setActiveTrack(tracks[trackIndex].id);
      }
    }
    if (currentTool === 'select') {
      setSelection({
        start: clickTimePosition,
        end: null
      });
      setIsDragging(true);
    } else if (currentTool === 'split') {
      console.log('Split at', formatTime(clickTimePosition));
    } else if (currentTool === 'move') {
      setPosition(clickTimePosition);
    }
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || !selection) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const secondsVisible = duration / zoom;
    const pixelsPerSecond = canvasRef.current.width / secondsVisible;
    const currentPosition = x / pixelsPerSecond;

    setSelection({
      ...selection,
      end: currentPosition
    });
  };
  const handleMouseUp = () => {
    setIsDragging(false);

    if (selection && selection.end !== null) {
      const normalizedSelection = {
        start: Math.min(selection.start, selection.end),
        end: Math.max(selection.start, selection.end)
      };
      setSelection(normalizedSelection);

      if (onTimelineChange) {
        onTimelineChange(normalizedSelection.start, normalizedSelection.end);
      }
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 10));
  };
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const jumpBackward = () => {
    setPosition(Math.max(0, position - 5));
  };
  const jumpForward = () => {
    setPosition(Math.min(duration, position + 5));
  };

  return (
    <div className="timeline-container">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">{label}</h3>
          <div className="text-xs text-gray-400">
            {formatTime(position)} / {formatTime(duration)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex">
            <Button variant="ghost" size="icon" title="Split at playhead" onClick={() => setCurrentTool('split')} className={currentTool === 'split' ? 'bg-blue-800/20' : ''}>
              <Scissors className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Move tool" onClick={() => setCurrentTool('move')} className={currentTool === 'move' ? 'bg-blue-800/20' : ''}>
              <MoveHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Zoom Out" onClick={handleZoomOut}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Zoom In" onClick={handleZoomIn}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="icon" title="Jump Backward" onClick={jumpBackward}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title={isPlaying ? "Pause" : "Play"} onClick={togglePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" title="Jump Forward" onClick={jumpForward}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex">
        {multitrack && tracks.length > 0 && (
          <div className="track-info w-28 mr-2">
            <div className="h-[30px] flex items-center">
              <div className="text-xs font-semibold text-gray-400 pl-2 pb-2">Track # / Gain</div>
            </div>
            
            {tracks.map((track, index) => (
              <div 
                key={track.id}
                className={`flex flex-col justify-center p-1 h-[34px] border-b border-gray-700 cursor-pointer ${track.id === activeTrack ? 'bg-blue-900/20' : ''}`}
                onClick={() => setActiveTrack(track.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-1" 
                      style={{ backgroundColor: track.color }}
                    ></div>
                    <span className="text-xs">{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Volume2 className="h-3 w-3 text-gray-400" />
                    <Slider 
                      className="w-10 h-3" 
                      value={[track.gain]} 
                      min={-12}
                      max={12}
                      step={0.1}
                      onValueChange={(values) => handleGainChange(track.id, values[0])}
                    />
                    <span className="text-xs w-6 text-right">{track.gain}dB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <ScrollArea className="w-full" type="always">
          <div ref={containerRef} 
            style={{ height: multitrack && tracks.length > 0 ? '200px' : '80px' }}
            className="relative w-full border border-gray-700 rounded-md overflow-hidden bg-zinc-800"
          >
            <canvas 
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full cursor-text"
            />
          </div>
          <ScrollBar orientation="horizontal" className="h-3" />
        </ScrollArea>
      </div>
    </div>
  );
};
