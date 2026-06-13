'use client';

import Link from 'next/link';
import {
  BadgeDollarSign,
  ClipboardCheck,
  DatabaseBackup,
  GitPullRequest,
  ImagePlus,
  KeyRound,
  Monitor,
  Rocket,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const links = [
  { label: 'Comando', href: '/eventos', icon: ClipboardCheck, eventPath: 'comando-total' },
  { label: 'Final', href: '/settings/cierre-operativo-final', icon: Rocket },
  { label: 'Portfolio fiesta', href: '/presentacion-led/portafolio', icon: Monitor, portfolioEvent: true },
  { label: 'Experiencia', href: '/eventos', icon: Sparkles, eventPath: 'centro-experiencia' },
  { label: 'Cierre mundial', href: '/eventos', icon: Rocket, eventPath: 'cierre-mundial' },
  { label: 'Global', href: '/settings/cierre-global-producto', icon: Route },
  { label: 'Visuales', href: '/settings/biblioteca-visual-ak', icon: ImagePlus },
  { label: 'Portfolio', href: '/presentacion-led/portafolio', icon: Monitor },
  { label: 'CTO', href: '/settings/lanzamiento-cto', icon: ShieldCheck },
  { label: 'Integracion', href: '/fiestas/nueva/integracion-post-445', icon: GitPullRequest },
  { label: 'Cierre 100', href: '/fiestas/nueva/cierre-100', icon: Rocket },
  { label: 'Backup', href: '/settings/backup-final', icon: DatabaseBackup },
  { label: 'Social Fiesta', href: '/fiestas/nueva/social-fiesta-pro', icon: Monitor },
  { label: 'Cliente', href: '/fiestas/nueva/portal-cliente/experiencia-mundial', icon: KeyRound },
  { label: 'Comercial 360', href: '/contabilidad/comercial-360', icon: BadgeDollarSign },
];

function withFiestaId(href: string, fiestaId: string | null): string {
  if (!fiestaId) return href;
  return `${href}?fiestaId=${encodeURIComponent(fiestaId)}`;
}

function resolveHref(item: (typeof links)[number], fiestaId: string | null): string {
  if ('eventPath' in item && item.eventPath) {
    return fiestaId ? `/fiestas/${encodeURIComponent(fiestaId)}/${item.eventPath}` : '/eventos';
  }

  if ('portfolioEvent' in item && item.portfolioEvent) {
    return fiestaId ? `/presentacion-led/portafolio/fiesta/${encodeURIComponent(fiestaId)}` : item.href;
  }

  return withFiestaId(item.href, fiestaId);
}

export function Post445QuickAccess() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  if (searchParams.has('token')) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-widest text-white">
          <Sparkles className="h-4 w-4" />
          Post #445
        </div>
        {links.map(item => (
          <Link
            key={item.href + item.label}
            href={resolveHref(item, fiestaId)}
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
