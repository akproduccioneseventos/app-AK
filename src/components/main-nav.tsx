
// src/components/main-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarClock, 
  Users, 
  Briefcase, 
  ContactRound,
  CircleDollarSign,
  ListChecks,
  CalendarDays,
  StickyNote,
  PartyPopper,
  Filter // Added Filter icon
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/eventos', label: 'Eventos', icon: CalendarClock },
  { href: '/fiestas/nueva', label: 'Crear Fiesta', icon: PartyPopper }, 
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/sales-funnel', label: 'Embudo de Ventas', icon: Filter }, // New Sales Funnel link
  { href: '/proveedores', label: 'Proveedores', icon: Briefcase },
  { href: '/empleados', label: 'Empleados', icon: ContactRound },
  { href: '/presupuestos', label: 'Presupuestos y pagos', icon: CircleDollarSign }, 
  { href: '/compras', label: 'Compras y checklist', icon: ListChecks }, 
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/notas', label: 'Notas', icon: StickyNote },
];

export function MainNav() {
  const pathname = usePathname();

  const isActiveParent = (itemHref: string) => {
    if (itemHref === '/') return pathname === '/';
    if (pathname.startsWith(itemHref + '/') || pathname === itemHref) {
        if (itemHref === '/' && pathname !== '/') return false;
        return true;
    }
    return false;
  };


  return (
      <SidebarMenu>
        {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={isActiveParent(item.href)}
                  className={cn(
                    isActiveParent(item.href) 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' 
                      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    'group-data-[collapsible=icon]:justify-center'
                  )}
                  tooltip={item.label}
                >
                  {/* Content is now direct children of SidebarMenuButton */}
                  <item.icon className="w-5 h-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
  );
}

