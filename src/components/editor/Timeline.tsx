import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from "@/components/ui/button";

export const Timeline = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Video Timeline</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="timeline-track"></div>
    </div>
  );
};