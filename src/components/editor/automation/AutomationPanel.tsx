
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Eye, EyeOff } from 'lucide-react';
import { AutomationLaneComponent } from './AutomationLane';
import { AutomationLane, AutomationType, AutomationPoint } from '@/types/automation';

interface AutomationPanelProps {
  lanes: AutomationLane[];
  onLanesChange: (lanes: AutomationLane[]) => void;
  zoom: number;
  duration: number;
  currentPosition?: number;
  snapValue?: string;
}

export const AutomationPanel: React.FC<AutomationPanelProps> = ({
  lanes,
  onLanesChange,
  zoom,
  duration,
  currentPosition = 0,
  snapValue = '1/16'
}) => {
  const [expanded, setExpanded] = useState(true);
  
  // Toggle lane visibility
  const toggleLaneVisibility = (laneId: string) => {
    const updatedLanes = lanes.map(lane => {
      if (lane.id === laneId) {
        return { ...lane, visible: !lane.visible };
      }
      return lane;
    });
    onLanesChange(updatedLanes);
  };
  
  // Add a new automation lane
  const addNewLane = (type: AutomationType) => {
    const newLane: AutomationLane = {
      id: `automation-${Date.now()}`,
      name: getDefaultNameForType(type),
      points: getDefaultPointsForType(type),
      visible: true,
      color: getColorForType(type),
      minValue: getMinValueForType(type),
      maxValue: getMaxValueForType(type),
      defaultValue: getDefaultValueForType(type),
      type
    };
    
    onLanesChange([...lanes, newLane]);
  };
  
  // Remove an automation lane
  const removeLane = (laneId: string) => {
    const updatedLanes = lanes.filter(lane => lane.id !== laneId);
    onLanesChange(updatedLanes);
  };
  
  // Update points for a specific lane
  const handlePointsChange = (laneId: string, points: AutomationPoint[]) => {
    const updatedLanes = lanes.map(lane => {
      if (lane.id === laneId) {
        return { ...lane, points };
      }
      return lane;
    });
    onLanesChange(updatedLanes);
  };
  
  // Helper functions for lane creation
  const getDefaultNameForType = (type: AutomationType): string => {
    switch (type) {
      case 'velocity': return 'Velocity';
      case 'tempo': return 'Tempo';
      case 'volume': return 'Volume';
      case 'pan': return 'Panning';
      case 'filter': return 'Filter Cutoff';
      case 'custom': return 'Custom Parameter';
      default: return 'Automation';
    }
  };
  
  const getColorForType = (type: AutomationType): string => {
    switch (type) {
      case 'velocity': return '#4f9ef8';
      case 'tempo': return '#f87171';
      case 'volume': return '#10b981';
      case 'pan': return '#f59e0b';
      case 'filter': return '#8b5cf6';
      case 'custom': return '#ec4899';
      default: return '#64748b';
    }
  };
  
  const getMinValueForType = (type: AutomationType): number => {
    switch (type) {
      case 'velocity': return 0;
      case 'tempo': return 40;
      case 'volume': return -60;
      case 'pan': return -100;
      case 'filter': return 20;
      case 'custom': return 0;
      default: return 0;
    }
  };
  
  const getMaxValueForType = (type: AutomationType): number => {
    switch (type) {
      case 'velocity': return 127;
      case 'tempo': return 240;
      case 'volume': return 6;
      case 'pan': return 100;
      case 'filter': return 20000;
      case 'custom': return 100;
      default: return 100;
    }
  };
  
  const getDefaultValueForType = (type: AutomationType): number => {
    switch (type) {
      case 'velocity': return 100;
      case 'tempo': return 120;
      case 'volume': return 0;
      case 'pan': return 0;
      case 'filter': return 2000;
      case 'custom': return 50;
      default: return 50;
    }
  };
  
  const getDefaultPointsForType = (type: AutomationType): AutomationPoint[] => {
    // Create default points based on type
    const defaultValue = getDefaultValueForType(type);
    const min = getMinValueForType(type);
    const max = getMaxValueForType(type);
    
    // Normalize default value to 0-1 range
    const normalizedValue = (defaultValue - min) / (max - min);
    
    return [
      { id: `${type}-start-${Date.now()}`, time: 0, value: normalizedValue },
      { id: `${type}-end-${Date.now() + 1}`, time: duration, value: normalizedValue }
    ];
  };
  
  if (!expanded) {
    return (
      <div className="automation-panel-collapsed bg-zinc-900 border border-zinc-800 rounded-md p-2 flex justify-between items-center">
        <span className="text-sm">Automation</span>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="automation-panel bg-zinc-900 border border-zinc-800 rounded-md">
      <div className="automation-header flex justify-between items-center p-2 border-b border-zinc-800">
        <h3 className="text-sm font-medium">Automation</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addNewLane('velocity')}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(false)}>
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="automation-lanes-container h-[300px]">
        <div className="automation-lanes p-2 space-y-4">
          {lanes.map(lane => (
            <div key={lane.id} className="automation-lane-container">
              <div className="lane-header flex justify-between items-center mb-1">
                <span className="text-xs font-medium" style={{ color: lane.color }}>{lane.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleLaneVisibility(lane.id)}
                  >
                    {lane.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500"
                    onClick={() => removeLane(lane.id)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {lane.visible && (
                <AutomationLaneComponent
                  lane={lane}
                  zoom={zoom}
                  height={120}
                  duration={duration}
                  onPointsChange={(points) => handlePointsChange(lane.id, points)}
                  snapValue={snapValue}
                  currentPosition={currentPosition}
                />
              )}
            </div>
          ))}
          
          {lanes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
              <p className="text-sm mb-2">No automation lanes</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => addNewLane('velocity')}>
                  Add Velocity
                </Button>
                <Button size="sm" variant="outline" onClick={() => addNewLane('tempo')}>
                  Add Tempo
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
