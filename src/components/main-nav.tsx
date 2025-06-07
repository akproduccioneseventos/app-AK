
// src/components/main-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarClock, 
  Users, 
  Briefcase, 
  ContactRound, // Changed from UserCheck
  CircleDollarSign, // Changed from ClipboardList/HandCoins
  ListChecks, // Changed from ShoppingBag
  CalendarDays, // Changed from CalendarClock (for a more general calendar icon)
  StickyNote,
  Settings as SettingsIcon // Added missing import if settings were to be in main nav
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  // Removed Sub menu items for now as per image
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
// Removed Accordion as sub-menu for settings is not in the image's main nav

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/eventos', label: 'Eventos', icon: CalendarClock },
  { href: '/customers', label: 'Clientes', icon: Users }, // Corrected href
  { href: '/proveedores', label: 'Proveedores', icon: Briefcase },
  { href: '/empleados', label: 'Empleados', icon: ContactRound },
  { href: '/presupuestos', label: 'Presupuestos y pagos', icon: CircleDollarSign }, 
  { href: '/compras', label: 'Compras y checklist', icon: ListChecks }, 
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/notas', label: 'Notas', icon: StickyNote },
  // Settings is usually in user dropdown, not main nav as per image
  // {
  //   href: '/settings',
  //   label: 'Configuración',
  //   icon: SettingsIcon,
  // },
];

export function MainNav() {
  const pathname = usePathname();

  const isActiveParent = (itemHref: string) => {
    if (itemHref === '/') return pathname === '/';
    // For items like /presupuestos, make sure /presupuestos/nuevo is also active
    if (pathname.startsWith(itemHref + '/') || pathname === itemHref) {
        // Handle special case for dashboard to avoid it being active for all sub-routes
        if (itemHref === '/' && pathname !== '/') return false;
        return true;
    }
    return false;
  };


  return (
      <SidebarMenu>
        {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveParent(item.href)}
                  className={cn(
                    isActiveParent(item.href) 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' 
                      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    'group-data-[collapsible=icon]:justify-center' // Center icon when collapsed
                  )}
                  tooltip={item.label} // Add tooltip for collapsed state
                >
                  <a> 
                    <item.icon className="w-5 h-5" /> {/* Slightly larger icons */}
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
  );
}

