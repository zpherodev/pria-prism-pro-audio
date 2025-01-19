import React, { useState } from 'react';
import { Menu, Upload, Play, Pause, Plus, Minus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { VideoEditor } from '@/components/VideoEditor';

const Index = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-editor-bg p-4">
      {/* Header */}
      <header className="panel mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ZiplinEAR Editor</h1>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Main Editor Component */}
      <VideoEditor />
    </div>
  );
};

export default Index;