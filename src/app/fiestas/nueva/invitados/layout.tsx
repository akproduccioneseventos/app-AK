
'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, LayoutDashboard, TableProperties, Settings } from 'lucide-react';
import { Loader2 } from 'lucide-react';

function InvitadosLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const navItems = [
    { href: `/fiestas/nueva/invitados?fiestaId=${fiestaId}`, label: 'Invitados', icon: Users },
    { href: `/fiestas/nueva/invitados/layout?fiestaId=${fiestaId}`, label: 'Plano de Salón', icon: LayoutDashboard },
    { href: `/portal/mesas?fiestaId=${fiestaId}`, label: 'Distribución / Mesas', icon: TableProperties },
    { href: `/fiestas/nueva/configuracion?fiestaId=${fiestaId}`, label: 'Cliente (Configuración)', icon: Settings },
  ];

  const getIsActive = (href: string) => {
    // We need to check the base path, ignoring query params for comparison
    const currentBasePath = pathname;
    const linkBasePath = new URL(href, 'http://localhost').pathname;
    return currentBasePath === linkBasePath;
  };

  return (
    <div className="space-y-6">
       <div className="border-b">
        <nav className="flex space-x-2 lg:space-x-4 overflow-x-auto pb-2">
          {navItems.map(item => (
            <Link key={item.label} href={item.href}>
              <Button 
                variant={getIsActive(item.href) ? 'default' : 'ghost'} 
                className="h-auto py-2 px-3 flex-shrink-0"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function InvitadosLayout({ children }: { children: React.ReactNode; }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <InvitadosLayoutContent>{children}</InvitadosLayoutContent>
    </Suspense>
  );
}
