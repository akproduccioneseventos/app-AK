'use client';

import React, { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface TabHostItem {
  id: string;
  label: string;
}

export function TabHostShell({
  tabs,
  queryKey = 'tab',
  defaultContent,
  renderDefault,
  renderTab,
}: {
  tabs: TabHostItem[];
  queryKey?: string;
  defaultContent?: React.ReactNode;
  renderDefault?: () => React.ReactNode;
  renderTab: (tabId: string) => React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = useMemo(() => {
    const fromQueryKey = searchParams.get(queryKey);
    const fromTabFallback = queryKey !== 'tab' ? searchParams.get('tab') : null;
    const raw =
      (fromQueryKey && tabs.some((t) => t.id === fromQueryKey) ? fromQueryKey : null) ??
      (fromTabFallback && tabs.some((t) => t.id === fromTabFallback) ? fromTabFallback : null);
    return raw || tabs[0].id;
  }, [searchParams, queryKey, tabs]);

  const selectTab = (tabId: string) => {
    const q = new URLSearchParams(searchParams.toString());
    q.set(queryKey, tabId);
    const query = q.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-1.5 px-4 pt-4">
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
      {activeTab === tabs[0].id ? (defaultContent ?? renderDefault?.()) : renderTab(activeTab)}
    </div>
  );
}
