'use client';

import { useState } from 'react';
import { Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CanvaViewerProps {
  designId: string; // Ej: DAF... 
  title?: string;
}

export function CanvaViewer({ designId, title = 'Diseño de Invitación' }: CanvaViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const embedUrl = `https://www.canva.com/design/${designId}/view?embed`;

  return (
    <div className={`relative bg-slate-100 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isFullscreen ? 'fixed inset-4 z-50 rounded-none md:rounded-3xl' : 'w-full aspect-[4/5] md:aspect-video'}`}>
      {/* Header overlay for controls */}
      <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/50 to-transparent z-10 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity">
        <h3 className="text-white font-bold drop-shadow-md">{title}</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="text-white hover:bg-white/20 rounded-full"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Loading state behind iframe */}
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>

      <iframe
        loading="lazy"
        className="w-full h-full border-0"
        src={embedUrl}
        allowFullScreen
        title={title}
      ></iframe>
    </div>
  );
}
