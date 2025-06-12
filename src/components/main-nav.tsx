
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
  PartyPopper,
  Filter,
  Sparkles,
  FileText,
  Banknote,
  ImageIcon
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Menú Principal', icon: LayoutDashboard },
  { href: '/eventos', label: 'Todas las Fiestas', icon: CalendarClock },
  { href: '/fiestas/nueva', label: 'Crear Fiesta', icon: PartyPopper },
  {
    isGroup: true,
    label: 'Empresa',
    icon: Briefcase,
    basePath: '/empresa',
    subItems: [
      { href: '/proveedores', label: 'Proveedores', icon: Briefcase },
      { href: '/empleados', label: 'Empleados', icon: ContactRound },
    ]
  },
  {
    isGroup: true,
    label: 'Contabilidad',
    icon: CircleDollarSign,
    basePath: '/contabilidad', // basePath can cover customers & sales-funnel if they are under it logically
    subItems: [
      { href: '/presupuestos', label: 'Presupuestos', icon: ListChecks },
      { href: '/invoices', label: 'Facturas', icon: FileText },
      { href: '/contabilidad/pagos', label: 'Pagos', icon: Banknote },
      { href: '/customers', label: 'Clientes', icon: Users },
      { href: '/sales-funnel', label: 'Embudo de Ventas', icon: Filter },
    ]
  },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/galeria', label: 'Galería', icon: ImageIcon },
  
];

export function MainNav() {
  const pathname = usePathname();

  const isActiveParent = (itemHref: string, subItemPaths?: string[]) => {
    if (itemHref === '/' && pathname === '/') return true;
    // Check if the current path starts with the item's href or exactly matches it.
    // Also, ensure that if itemHref is not '/', it's not a partial match of a longer path segment.
    // For example, if itemHref is '/customer' and pathname is '/customers', it shouldn't match.
    // It should match if pathname is '/customer' or '/customer/details'.
    const isBasePathMatch = itemHref !== '/' && (pathname === itemHref || pathname.startsWith(itemHref + '/'));
    if (isBasePathMatch) return true;
    
    if (subItemPaths?.some(subPath => pathname === subPath || pathname.startsWith(subPath + '/'))) return true;
    return false;
  };


  return (
      <SidebarMenu>
        {navItems.map((item, index) => {
          if (item.isGroup && item.subItems) {
            const groupSubPaths = item.subItems.map(sub => sub.href);
            // For a group, it's active if its own basePath matches or any of its subItems are active.
            // The basePath itself might not be a direct navigable link but a logical grouping.
            // We use a broader check for group activation.
            let isGroupActive = groupSubPaths.some(subPath => pathname === subPath || pathname.startsWith(subPath + '/'));
            if (item.basePath && (pathname === item.basePath || pathname.startsWith(item.basePath + '/')) && !isGroupActive) {
                 // This condition handles cases where the group's basePath itself is a route, 
                 // or if we want the group active even if no sub-item is explicitly matched but path is under basePath.
                 // However, typically for groups, activity is determined by sub-items.
                 // For this specific rearrangement, we rely on subItemPaths for activity.
            }


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
                      <Link href={subItem.href} legacyBehavior={false} asChild={true}>
                        <SidebarMenuSubButton
                          isActive={pathname === subItem.href || pathname.startsWith(subItem.href + '/')}
                        >
                           {subItem.label}
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            );
          }
          // For direct navigation items
          return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior={false} asChild>
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

