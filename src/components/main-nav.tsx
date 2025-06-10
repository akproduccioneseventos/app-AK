
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
  Filter, 
  Sparkles, 
  ShoppingBasket
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton, // Added this explicitly
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/eventos', label: 'Eventos', icon: CalendarClock },
  { href: '/fiestas/nueva', label: 'Crear Fiesta', icon: PartyPopper }, 
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/sales-funnel', label: 'Embudo de Ventas', icon: Filter }, 
  // EMPRESA SECTION - START
  { 
    isGroup: true,
    label: 'Empresa', 
    icon: Briefcase,
    basePath: '/empresa', // For parent active state
    subItems: [
      { href: '/proveedores', label: 'Proveedores', icon: Briefcase },
      { href: '/empresa/servicios', label: 'Servicios', icon: Sparkles },
      { href: '/compras', label: 'Compras', icon: ShoppingBasket },
      { href: '/empleados', label: 'Empleados', icon: ContactRound },
    ]
  },
  // EMPRESA SECTION - END
  { href: '/presupuestos', label: 'Presupuestos y pagos', icon: CircleDollarSign }, 
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/notas', label: 'Notas', icon: StickyNote },
];

export function MainNav() {
  const pathname = usePathname();

  const isActiveParent = (itemHref: string, subItemPaths?: string[]) => {
    if (itemHref === '/' && pathname === '/') return true;
    if (itemHref !== '/' && pathname.startsWith(itemHref)) return true;
    if (subItemPaths?.some(subPath => pathname.startsWith(subPath))) return true;
    return false;
  };


  return (
      <SidebarMenu>
        {navItems.map((item, index) => {
          if (item.isGroup && item.subItems) {
            const groupSubPaths = item.subItems.map(sub => sub.href);
            const isGroupActive = isActiveParent(item.basePath || '#', groupSubPaths);
            return (
              <SidebarMenuItem key={`group-${item.label}-${index}`}>
                <SidebarMenuButton
                  isActive={isGroupActive}
                  className={cn(
                    isGroupActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' 
                      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    'group-data-[collapsible=icon]:justify-center'
                  )}
                  tooltip={item.label}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {item.subItems.map(subItem => (
                    <SidebarMenuSubItem key={subItem.href}>
                      <Link href={subItem.href} passHref legacyBehavior>
                        <SidebarMenuSubButton isActive={pathname === subItem.href}>
                           {subItem.label}
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            );
          }
          return (
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
                  <item.icon className="w-5 h-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
  );
}
