
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
      { href: '/empresa/todos-los-servicios', label: 'Todos los Servicios', icon: Sparkles },
      { href: '/presupuestos', label: 'Presupuestos', icon: ListChecks },
      { href: '/invoices', label: 'Facturas', icon: FileText },
      { href: '/contabilidad/pagos', label: 'Pagos', icon: Banknote },
      { href: '/customers', label: 'Clientes', icon: Users },
    ]
  },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  
];

export function MainNav() {
  const pathname = usePathname();

  const isActiveParent = (itemHref: string, subItemPaths?: string[]) => {
    if (itemHref === '/' && pathname === '/') return true;
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
            let isGroupActive = groupSubPaths.some(subPath => pathname === subPath || pathname.startsWith(subPath + '/'));
            // Special check for basePath when group is "Empresa" and subitems have different base paths
            if (item.basePath && (pathname === item.basePath || pathname.startsWith(item.basePath + '/'))) {
                isGroupActive = true;
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
                           {subItem.icon && <subItem.icon className="w-4 h-4 mr-2 opacity-80" />}
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
