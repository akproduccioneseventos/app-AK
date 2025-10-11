
'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, LayoutDashboard, Send } from 'lucide-react';

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
  ];

  return (
    <div className="space-y-6">
       <div className="border-b">
        <nav className="flex space-x-2 lg:space-x-4 overflow-x-auto pb-2">
          {navItems.map(item => (
            <Link key={item.label} href={item.href} passHref>
              <Button 
                variant={pathname.endsWith(item.pathSegment) || (item.pathSegment === '/invitados' && pathname.endsWith('/invitados')) ? 'default' : 'ghost'} 
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
