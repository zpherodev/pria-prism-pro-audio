
import { useState, useEffect } from 'react';
import { AutomationLane, AutomationType } from '@/types/automation';

export const useAutomationState = (duration: number) => {
  const [automationLanes, setAutomationLanes] = useState<AutomationLane[]>([]);
  
  // Initialize with default tempo lane
  useEffect(() => {
    if (automationLanes.length === 0) {
      const tempoLane: AutomationLane = {
        id: 'default-tempo',
        name: 'Tempo',
        visible: true,
        color: '#f87171',
        minValue: 40,
        maxValue: 240,
        defaultValue: 120,
        type: 'tempo' as AutomationType,
        points: [
          { id: 'tempo-start', time: 0, value: 0.5 }, // 120 BPM normalized
          { id: 'tempo-end', time: duration, value: 0.5 }
        ]
      };
      
      const velocityLane: AutomationLane = {
        id: 'default-velocity',
        name: 'Velocity',
        visible: true,
        color: '#4f9ef8',
        minValue: 0,
        maxValue: 127,
        defaultValue: 100,
        type: 'velocity' as AutomationType,
        points: [
          { id: 'velocity-start', time: 0, value: 0.78 }, // 100/127 normalized
          { id: 'velocity-end', time: duration, value: 0.78 }
        ]
      };
      
      setAutomationLanes([tempoLane, velocityLane]);
    }
  }, [duration]);
  
  // Get automation value at specific time
  const getValueAtTime = (laneId: string, time: number): number => {
    const lane = automationLanes.find(l => l.id === laneId);
    if (!lane || lane.points.length === 0) {
      return lane?.defaultValue || 0;
    }
    
    // Sort points by time
    const sortedPoints = [...lane.points].sort((a, b) => a.time - b.time);
    
    // If time is before first point or after last point
    if (time <= sortedPoints[0].time) {
      return denormalizeValue(lane, sortedPoints[0].value);
    }
    
    if (time >= sortedPoints[sortedPoints.length - 1].time) {
      return denormalizeValue(lane, sortedPoints[sortedPoints.length - 1].value);
    }
    
    // Find the points between which our time falls
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const currentPoint = sortedPoints[i];
      const nextPoint = sortedPoints[i + 1];
      
      if (time >= currentPoint.time && time <= nextPoint.time) {
        // Linear interpolation between points
        const timeRange = nextPoint.time - currentPoint.time;
        const valueRange = nextPoint.value - currentPoint.value;
        const timePosition = (time - currentPoint.time) / timeRange;
        const interpolatedValue = currentPoint.value + timePosition * valueRange;
        
        return denormalizeValue(lane, interpolatedValue);
      }
    }
    
    return lane.defaultValue;
  };
  
  // Convert normalized value (0-1) to actual value based on lane min/max
  const denormalizeValue = (lane: AutomationLane, normalizedValue: number): number => {
    return lane.minValue + normalizedValue * (lane.maxValue - lane.minValue);
  };
  
  // Convert actual value to normalized value (0-1)
  const normalizeValue = (lane: AutomationLane, actualValue: number): number => {
    return (actualValue - lane.minValue) / (lane.maxValue - lane.minValue);
  };
  
  return {
    automationLanes,
    setAutomationLanes,
    getValueAtTime,
    denormalizeValue,
    normalizeValue
  };
};
