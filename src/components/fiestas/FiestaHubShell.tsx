'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface FiestaHubTab {
  id: string;
  label: string;
}

export function FiestaHubShell({
  basePath,
  tabs,
  renderDefault,
  renderTab,
}: {
  basePath: string;
  tabs: FiestaHubTab[];
  renderDefault: () => React.ReactNode;
  renderTab: (tabId: string) => React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => {
    const t = searchParams.get('tab') || tabs[0].id;
    return tabs.some((x) => x.id === t) ? t : tabs[0].id;
  }, [searchParams, tabs]);

  const selectTab = (tabId: string) => {
    const q = new URLSearchParams(searchParams.toString());
    q.set('tab', tabId);
    router.replace(`${basePath}?${q.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 pt-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
              activeTab === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {activeTab === tabs[0].id ? renderDefault() : renderTab(activeTab)}
    </div>
  );
}
