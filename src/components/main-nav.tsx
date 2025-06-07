'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Settings, Palette, Building, Bell, ShieldCheck, ClipboardList, CalendarClock, ShoppingBag, StickyNote, Briefcase, UserCheck, HandCoins } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import * as Accordion from "@radix-ui/react-accordion"; 

const navItems = [
  { href: '/', label: 'Panel Principal', icon: LayoutDashboard },
  { href: '/eventos', label: 'Eventos', icon: CalendarClock },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/proveedores', label: 'Proveedores', icon: Briefcase },
  { href: '/empleados', label: 'Empleados', icon: UserCheck },
  { href: '/presupuestos', label: 'Presupuestos', icon: ClipboardList }, // Updated from /invoices
  { href: '/pagos', label: 'Pagos', icon: HandCoins },
  { href: '/compras', label: 'Compras', icon: ShoppingBag },
  { href: '/calendario', label: 'Calendario', icon: CalendarClock }, // Consider a more distinct calendar icon if available
  { href: '/notas', label: 'Notas', icon: StickyNote },
  {
    href: '/settings',
    label: 'Configuración',
    icon: Settings,
    subItems: [
      { href: '/settings/templates', label: 'Plantillas', icon: Palette },
      { href: '/settings/company', label: 'Empresa', icon: Building },
      { href: '/settings/notifications', label: 'Notificaciones', icon: Bell },
      { href: '/settings/account', label: 'Cuenta', icon: ShieldCheck },
    ],
  },
];

export function MainNav() {
  const pathname = usePathname();

  const isActiveParent = (itemHref: string) => {
    if (itemHref === '/') return pathname === '/';
    return pathname.startsWith(itemHref);
  }


  return (
    <Accordion.Root type="single" collapsible className="w-full" defaultValue={navItems.find(item => item.subItems && isActiveParent(item.href))?.href}>
      <SidebarMenu>
        {navItems.map((item) =>
          item.subItems ? (
            <Accordion.Item value={item.href} key={item.href} className="border-none">
              <SidebarMenuItem>
                <Accordion.Trigger asChild>
                  <SidebarMenuButton
                    className="justify-between w-full"
                    isActive={isActiveParent(item.href) && !item.subItems.some(sub => pathname === sub.href)}
                    aria-expanded={isActiveParent(item.href)}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </SidebarMenuButton>
                </Accordion.Trigger>
              </SidebarMenuItem>
              <Accordion.Content>
                <SidebarMenuSub>
                  {item.subItems.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.href}>
                      <Link href={subItem.href} legacyBehavior passHref>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.href}
                          className={cn(
                            'w-full justify-start',
                            pathname === subItem.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <a> 
                            <subItem.icon className="w-4 h-4 mr-2" />
                            {subItem.label}
                          </a>
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </Accordion.Content>
            </Accordion.Item>
          ) : (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveParent(item.href)}
                  className={cn(isActiveParent(item.href) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}
                >
                  <a> 
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </Accordion.Root>
  );
}
