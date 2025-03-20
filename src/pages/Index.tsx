import React, { useState } from 'react';
import { Menu, AudioLines } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AudioEditor } from '@/components/AudioEditor';
const Index = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return <div className="min-h-screen bg-editor-bg p-4">
      {/* Header */}
      <header className="panel mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AudioLines className="h-6 w-6" />
          <h1 className="text-xl text-right font-thin">P R I A P R I S M - P R O . AUDIOPHILE .S Y N T H &amp;. S H E E T .R O L L</h1>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Main Editor Component */}
      <AudioEditor />
    </div>;
};
export default Index;