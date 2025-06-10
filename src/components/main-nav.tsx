
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
  ShoppingBasket,
  FileText, 
  Banknote 
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton, // Ensure this is imported
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/eventos', label: 'Todas las Fiestas', icon: CalendarClock },
  { href: '/fiestas/nueva', label: 'Crear Fiesta', icon: PartyPopper }, 
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/sales-funnel', label: 'Embudo de Ventas', icon: Filter }, 
  { 
    isGroup: true,
    label: 'Empresa', 
    icon: Briefcase,
    basePath: '/empresa', 
    subItems: [
      { href: '/proveedores', label: 'Proveedores', icon: Briefcase },
      { href: '/empresa/servicios', label: 'Servicios', icon: Sparkles },
      { href: '/empleados', label: 'Empleados', icon: ContactRound },
      { href: '/compras', label: 'Compras', icon: ShoppingBasket },
    ]
  },
  { 
    isGroup: true,
    label: 'Contabilidad', 
    icon: CircleDollarSign,
    basePath: '/contabilidad', 
    subItems: [
      { href: '/presupuestos', label: 'Presupuestos', icon: ListChecks },
      { href: '/invoices', label: 'Facturas', icon: FileText },
      { href: '/contabilidad/pagos', label: 'Pagos', icon: Banknote },
    ]
  },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/notas', label: 'Notas', icon: StickyNote },
];

export function MainNav() {
  const pathname = usePathname();

  const isActiveParent = (itemHref: string, subItemPaths?: string[]) => {
    if (itemHref === '/' && pathname === '/') return true;
    if (itemHref !== '/' && (pathname === itemHref || pathname.startsWith(itemHref + '/'))) return true;
    if (subItemPaths?.some(subPath => pathname === subPath || pathname.startsWith(subPath + '/'))) return true;
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
                      <Link href={subItem.href} passHref asChild>
                        <SidebarMenuSubButton isActive={pathname === subItem.href || pathname.startsWith(subItem.href + '/')}>
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
