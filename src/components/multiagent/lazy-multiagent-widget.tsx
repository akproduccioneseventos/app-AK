'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';

const MultiAgentWidget = dynamic(
  () => import('./multiagent-widget').then((module) => module.MultiAgentWidget),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-24 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl ring-4 ring-white">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    ),
  },
);

export function LazyMultiAgentWidget() {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return <MultiAgentWidget defaultOpen />;
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      className="fixed bottom-24 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl ring-4 ring-white transition hover:-translate-y-1 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-red-300"
      aria-label="Abrir asistentes inteligentes AK"
      title="Abrir asistentes inteligentes AK"
    >
      <Bot className="h-6 w-6" />
    </button>
  );
}
