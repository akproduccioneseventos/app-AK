'use client';

import { useEffect, useState } from 'react';

interface FormEmbedWidgetProps {
  url: string;
  type?: 'tally' | 'google-forms' | 'generic';
  title?: string;
  height?: string;
}

export function FormEmbedWidget({ url, type = 'generic', title = 'Cuestionario', height = '500px' }: FormEmbedWidgetProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Si es Tally, cargamos su script de embeds para que auto-ajuste la altura si lo necesita
    if (type === 'tally' && url.includes('tally.so')) {
      const script = document.createElement('script');
      script.src = 'https://tally.so/widgets/embed.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [type, url]);

  if (!isMounted) return <div className="animate-pulse bg-slate-100 rounded-2xl" style={{ height }} />;

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
      <div className="bg-slate-50 border-b border-slate-100 p-4">
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      </div>
      
      {type === 'tally' ? (
        <iframe
          data-tally-src={url}
          loading="lazy"
          width="100%"
          height={height}
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title={title}
          className="w-full bg-transparent"
        ></iframe>
      ) : (
        <iframe
          src={url}
          width="100%"
          height={height}
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title={title}
          className="w-full"
        >
          Cargando formulario...
        </iframe>
      )}
    </div>
  );
}
