'use client';

import Link from 'next/link';
import { BadgeDollarSign, DatabaseBackup, GitPullRequest, KeyRound, Monitor, Rocket, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const links = [
  { label: 'Integracion', href: '/fiestas/nueva/integracion-post-445', icon: GitPullRequest },
  { label: 'Cierre 100', href: '/fiestas/nueva/cierre-100', icon: Rocket },
  { label: 'Backup', href: '/configuracion/backup-final', icon: DatabaseBackup },
  { label: 'Social Fiesta', href: '/fiestas/nueva/social-fiesta-pro', icon: Monitor },
  { label: 'Cliente', href: '/fiestas/nueva/portal-cliente/experiencia-mundial', icon: KeyRound },
  { label: 'Comercial 360', href: '/contabilidad/comercial-360', icon: BadgeDollarSign },
];

function withFiestaId(href: string, fiestaId: string | null): string {
  if (!fiestaId) return href;
  return `${href}?fiestaId=${encodeURIComponent(fiestaId)}`;
}

export function Post445QuickAccess() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-widest text-white">
          <Sparkles className="h-4 w-4" />
          Post #445
        </div>
        {links.map(item => (
          <Link
            key={item.href}
            href={withFiestaId(item.href, fiestaId)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-primary hover:text-primary"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
