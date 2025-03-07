
import React from 'react';
import { Plus, Minus, Scissors, MoveHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TimelineProps {
  label?: string;
}

export const Timeline = ({ label = "Audio Timeline" }: TimelineProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{label}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" title="Split">
            <Scissors className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Move">
            <MoveHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Zoom Out">
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Zoom In">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="timeline-track"></div>
    </div>
  );
};
