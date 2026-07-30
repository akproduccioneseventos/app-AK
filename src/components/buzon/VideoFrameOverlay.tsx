'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { drawBuzonVideoFrame } from '@/lib/buzon/video-frame-canvas';

export {
  FRAME_TEMPLATES,
  type FrameOption,
  type FrameTemplateId,
} from '@/lib/buzon/video-frame-templates';

interface VideoFrameOverlayProps {
  template: string | undefined;
  customText?: string;
  eventName?: string;
  className?: string;
}

export function VideoFrameOverlay({
  template,
  customText,
  eventName,
  className,
}: VideoFrameOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayText = customText || eventName || 'AK PRODUCCIONES';

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawBuzonVideoFrame(context, template, displayText, canvas.width, canvas.height);
  }, [displayText, template]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      aria-hidden="true"
      className={cn(
        'absolute inset-0 z-10 h-full w-full object-fill pointer-events-none',
        className,
      )}
    />
  );
}
