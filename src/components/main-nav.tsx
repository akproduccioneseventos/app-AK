'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Settings, Palette, Building, Bell, ShieldCheck } from 'lucide-react';
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
  { href: '/invoices', label: 'Facturas', icon: FileText },
  { href: '/customers', label: 'Clientes', icon: Users },
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

  return (
    <Accordion.Root type="single" collapsible className="w-full" defaultValue={navItems.find(item => item.subItems && pathname.startsWith(item.href))?.href}>
      <SidebarMenu>
        {navItems.map((item) =>
          item.subItems ? (
            <Accordion.Item value={item.href} key={item.href} className="border-none">
              <SidebarMenuItem>
                <Accordion.Trigger asChild>
                  <SidebarMenuButton
                    className="justify-between w-full"
                    isActive={pathname.startsWith(item.href) && !item.subItems.some(sub => pathname === sub.href)}
                    aria-expanded={pathname.startsWith(item.href)}
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
                          <a> {/*<a> tag is required by legacyBehavior with asChild and SidebarMenuSubButton */}
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
                  isActive={pathname === item.href}
                  className={cn(pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}
                >
                  <a> {/*<a> tag is required by legacyBehavior with asChild and SidebarMenuButton */}
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
