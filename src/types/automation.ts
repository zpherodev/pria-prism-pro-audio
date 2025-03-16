
export interface AutomationPoint {
  id: string;
  time: number;     // Time position in seconds
  value: number;    // Normalized value (0-1)
}

export interface AutomationLane {
  id: string;
  name: string;
  points: AutomationPoint[];
  visible: boolean;
  color: string;    // CSS color for the lane
  minValue: number; // Actual min value (will be scaled from normalized)
  maxValue: number; // Actual max value (will be scaled from normalized)
  defaultValue: number; // Default value when no automation
  type: AutomationType;
}

export type AutomationType = 'velocity' | 'tempo' | 'volume' | 'pan' | 'filter' | 'custom';

export interface AutomationLaneProps {
  lane: AutomationLane;
  zoom: number;
  height: number;
  duration: number;
  onPointsChange: (points: AutomationPoint[]) => void;
  snapValue?: string;  // For snapping points to grid
  currentPosition?: number; // Playhead position for visual indicator
}
