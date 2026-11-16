'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SunMedium,
  PartyPopper,
  KanbanSquare,
  Wallet,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isActive: (pathname: string) => boolean;
}

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  {
    title: 'Inicio',
    href: '/mi-dia',
    icon: SunMedium,
    isActive: (pathname: string) =>
      pathname === '/mi-dia' ||
      pathname === '/admin' ||
      pathname === '/centro-de-control' ||
      pathname === '/',
  },
  {
    title: 'Fiestas',
    href: '/eventos',
    icon: PartyPopper,
    isActive: (pathname: string) =>
      pathname.startsWith('/eventos') ||
      pathname.startsWith('/fiestas') ||
      pathname.startsWith('/calendario') ||
      pathname.startsWith('/empresa/red-social-eventos'),
  },
  {
    title: 'Vender',
    href: '/contabilidad/crm',
    icon: KanbanSquare,
    isActive: (pathname: string) =>
      (pathname.startsWith('/contabilidad/crm') && !pathname.startsWith('/contabilidad/crm/outbox')) ||
      pathname.startsWith('/presupuestos') ||
      pathname.startsWith('/customers'),
  },
  {
    title: 'Plata',
    href: '/pagos-rapidos',
    icon: Wallet,
    isActive: (pathname: string) =>
      pathname.startsWith('/pagos-rapidos') ||
      pathname.startsWith('/empresa/contabilidad') ||
      pathname.startsWith('/invoices'),
  },
  {
    title: 'Más',
    href: '/mas',
    icon: LayoutGrid,
    isActive: (pathname: string) =>
      pathname.startsWith('/mas') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/empresa/menus') ||
      pathname.startsWith('/compras') ||
      pathname.startsWith('/marketing') ||
      pathname.startsWith('/incidentes') ||
      pathname.startsWith('/playbooks'),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname() || '/';

  return (
    <nav
      data-testid="barra-inferior-celular"
      aria-label="Navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-lg md:hidden print:hidden"
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.title}
            href={item.href}
            aria-label={item.title}
            className={cn(
              'flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-xl transition-all duration-150',
              active
                ? 'text-indigo-600 font-black'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            )}
          >
            <Icon className={cn('h-5 w-5 mb-0.5 shrink-0', active ? 'text-indigo-600 scale-110' : 'text-slate-400')} />
            <span className="text-[10px] leading-tight tracking-tight">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
