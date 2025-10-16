
'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, LayoutDashboard, Send, Printer } from 'lucide-react';

export default function InvitadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const navItems = [
    { href: `/fiestas/nueva/invitados?fiestaId=${fiestaId}`, label: 'Lista de Invitados', icon: Users, pathSegment: '/invitados' },
    { href: `/fiestas/nueva/invitados/layout?fiestaId=${fiestaId}`, label: 'Diseño de Salón', icon: LayoutDashboard, pathSegment: '/layout' },
    { href: `/fiestas/nueva/invitados/numeros-mesa?fiestaId=${fiestaId}`, label: 'Números de Mesa', icon: Printer, pathSegment: '/numeros-mesa' },
  ];

  const getIsActive = (itemPathSegment: string) => {
    // Exact match or if it's the base and the path is just the base
    if (pathname.endsWith(itemPathSegment)) {
      return true;
    }
    // Special case for the base '/invitados' path
    if (itemPathSegment === '/invitados' && !pathname.includes('/layout') && !pathname.includes('/numeros-mesa')) {
      return true;
    }
    return false;
  }

  return (
    <div className="space-y-6">
       <div className="border-b">
        <nav className="flex space-x-2 lg:space-x-4 overflow-x-auto pb-2">
          {navItems.map(item => (
            <Link key={item.label} href={item.href} passHref>
              <Button 
                variant={getIsActive(item.pathSegment) ? 'default' : 'ghost'} 
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
