
import React, { useRef, useState, useEffect } from 'react';
import { AutomationLane, AutomationPoint } from '@/types/automation';
import { snapTimeToGrid, getSnapValueInSeconds } from '@/utils/pianoRollUtils';

interface AutomationLaneProps {
  lane: AutomationLane;
  zoom: number;
  height: number;
  duration: number;
  onPointsChange: (points: AutomationPoint[]) => void;
  snapValue?: string;
  currentPosition?: number;
}

export const AutomationLaneComponent: React.FC<AutomationLaneProps> = ({
  lane,
  zoom,
  height,
  duration,
  onPointsChange,
  snapValue = '1/16',
  currentPosition = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  // Create a sorted copy of points for rendering and interaction
  const sortedPoints = [...lane.points].sort((a, b) => a.time - b.time);

  // For snapping points to grid
  const snapToGrid = (time: number): number => {
    if (!snapValue) return time;
    return snapTimeToGrid(time, snapValue as any);
  };

  // Draw the automation lane
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = Math.max(duration * zoom * 100, 300);
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    drawGrid(ctx, canvas.width, canvas.height, zoom);
    
    // Draw automation path
    drawAutomationPath(ctx, sortedPoints, canvas.width, canvas.height, zoom);
    
    // Draw points
    drawPoints(ctx, sortedPoints, canvas.width, canvas.height, zoom, hoveredPointId, selectedPointId);
    
    // Draw playhead position
    if (currentPosition >= 0) {
      const playheadX = currentPosition * zoom * 100;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [lane, zoom, height, duration, hoveredPointId, selectedPointId, currentPosition]);

  // Draw background grid
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    zoom: number
  ) => {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw horizontal lines
    ctx.beginPath();
    for (let y = 0; y <= height; y += height / 4) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    // Draw vertical lines (measures)
    const pixelsPerBeat = 25 * zoom;
    const beatsPerMeasure = 4; // Assuming 4/4 time signature
    
    for (let x = 0; x <= width; x += pixelsPerBeat * beatsPerMeasure) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    // Draw beat lines (lighter)
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.beginPath();
    for (let x = 0; x <= width; x += pixelsPerBeat) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  };

  // Draw the automation path
  const drawAutomationPath = (
    ctx: CanvasRenderingContext2D,
    points: AutomationPoint[],
    width: number,
    height: number,
    zoom: number
  ) => {
    if (points.length < 2) return;
    
    ctx.beginPath();
    
    // Move to first point
    const firstX = points[0].time * zoom * 100;
    const firstY = height - points[0].value * height;
    ctx.moveTo(firstX, firstY);
    
    // Draw lines to each point
    for (let i = 1; i < points.length; i++) {
      const x = points[i].time * zoom * 100;
      const y = height - points[i].value * height;
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = lane.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Draw automation points
  const drawPoints = (
    ctx: CanvasRenderingContext2D,
    points: AutomationPoint[],
    width: number,
    height: number,
    zoom: number,
    hoveredId: string | null,
    selectedId: string | null
  ) => {
    points.forEach(point => {
      const x = point.time * zoom * 100;
      const y = height - point.value * height;
      const isHovered = hoveredId === point.id;
      const isSelected = selectedId === point.id;
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, isHovered || isSelected ? 6 : 4, 0, Math.PI * 2);
      
      if (isSelected) {
        ctx.fillStyle = '#ffffff';
      } else if (isHovered) {
        ctx.fillStyle = '#aaaaaa';
      } else {
        ctx.fillStyle = lane.color;
      }
      
      ctx.fill();
      
      // Add border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  // Handle mouse down for creating or selecting points
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on existing point
    const pointIndex = findPointNearPosition(x, y, zoom);
    
    if (pointIndex !== -1) {
      // Selected existing point
      setSelectedPointId(sortedPoints[pointIndex].id);
      setIsDragging(true);
    } else {
      // Create new point
      const time = snapToGrid(x / (zoom * 100));
      const value = 1 - (y / canvas.height);
      
      const newPoint: AutomationPoint = {
        id: `${lane.id}-point-${Date.now()}`,
        time,
        value: Math.max(0, Math.min(1, value))
      };
      
      const newPoints = [...lane.points, newPoint];
      onPointsChange(newPoints);
      
      setSelectedPointId(newPoint.id);
      setIsDragging(true);
    }
  };

  // Handle mouse move for dragging points
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update hovered point
    const pointIndex = findPointNearPosition(x, y, zoom);
    if (pointIndex !== -1) {
      setHoveredPointId(sortedPoints[pointIndex].id);
    } else {
      setHoveredPointId(null);
    }
    
    // Handle dragging
    if (isDragging && selectedPointId) {
      const time = snapToGrid(x / (zoom * 100));
      const value = 1 - (y / canvas.height);
      
      const newPoints = lane.points.map(point => {
        if (point.id === selectedPointId) {
          return {
            ...point,
            time: Math.max(0, time),
            value: Math.max(0, Math.min(1, value))
          };
        }
        return point;
      });
      
      onPointsChange(newPoints);
    }
  };

  // Handle mouse up to finish dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle right-click to delete points
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (hoveredPointId) {
      const newPoints = lane.points.filter(point => point.id !== hoveredPointId);
      onPointsChange(newPoints);
      setHoveredPointId(null);
      
      if (selectedPointId === hoveredPointId) {
        setSelectedPointId(null);
      }
    }
    
    return false;
  };

  // Find point near mouse position
  const findPointNearPosition = (x: number, y: number, zoom: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    
    for (let i = 0; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      const pointX = point.time * zoom * 100;
      const pointY = canvas.height - point.value * canvas.height;
      
      const distance = Math.sqrt(Math.pow(pointX - x, 2) + Math.pow(pointY - y, 2));
      if (distance <= 8) { // 8px radius for interaction
        return i;
      }
    }
    
    return -1;
  };

  return (
    <div className="automation-lane w-full">
      <div className="flex items-center justify-between bg-zinc-900 px-2 py-1 text-xs text-zinc-300 border-b border-zinc-800">
        <span>{lane.name}</span>
        <span className="text-zinc-500">
          {lane.minValue} - {lane.maxValue} {lane.type === 'tempo' ? 'BPM' : ''}
        </span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
        />
      </div>
    </div>
  );
};
