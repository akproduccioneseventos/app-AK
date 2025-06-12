
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
  ImageIcon,
  Building2, // Added Building2
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
    icon: Building2, // Changed to Building2 for main Empresa hub
    basePath: '/empresa', // Main hub page for Empresa
    subItems: [
      { href: '/empleados', label: 'Empleados', icon: ContactRound },
      { href: '/proveedores', label: 'Proveedores', icon: Briefcase }, // UsersIcon could also work
      { href: '/empresa/todos-los-servicios', label: 'Catálogo de Servicios', icon: Sparkles },
      { href: '/customers', label: 'Clientes', icon: Users },
      { href: '/empresa/contabilidad', label: 'Contabilidad', icon: CircleDollarSign }, 
    ]
  },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
];

export function MainNav() {
  const pathname = usePathname();

  const isActiveParent = (itemHref: string, subItemPaths?: string[]) => {
    // Exact match for the main link or if the path starts with the item's href (for sections)
    if (itemHref === '/' && pathname === '/') return true;
    const isBasePathMatch = itemHref !== '/' && (pathname === itemHref || pathname.startsWith(itemHref + '/'));
    if (isBasePathMatch) return true;
    
    // Check if any sub-item path matches for group highlighting
    if (subItemPaths?.some(subPath => pathname === subPath || pathname.startsWith(subPath + '/'))) return true;
    return false;
  };


  return (
      <SidebarMenu>
        {navItems.map((item, index) => {
          if (item.isGroup && item.subItems) {
            const groupSubPaths = item.subItems.map(sub => sub.href);
            // Determine if the group itself or one of its children is active
            let isGroupActive = isActiveParent(item.basePath || '#', groupSubPaths);
            
            return (
              <SidebarMenuItem key={`group-${item.label}-${index}`}>
                 <Link href={item.basePath || '#'} legacyBehavior={false} passHref>
                    <SidebarMenuButton 
                    asChild={!!item.basePath} // Important: Use asChild if basePath is a link
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
                </Link>
                <SidebarMenuSub>
                  {item.subItems.map(subItem => (
                    <SidebarMenuSubItem key={subItem.href}>
                      <Link href={subItem.href} legacyBehavior={false} passHref>
                        <SidebarMenuSubButton
                           asChild // Ensure SidebarMenuSubButton can also act as a child for Link
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
          // For direct navigation items
          return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior={false} passHref>
                <SidebarMenuButton
                  asChild // Ensure SidebarMenuButton can act as a child for Link
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
