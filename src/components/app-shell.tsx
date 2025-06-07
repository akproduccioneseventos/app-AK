// src/components/app-shell.tsx
'use client'; // This component uses hooks like usePathname indirectly via MainNav

import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppLogo } from './app-logo';
import { MainNav } from './main-nav';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Helper to get page title based on pathname
const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Panel Principal';
  if (pathname.startsWith('/invoices/new')) return 'Crear Nueva Factura';
  if (pathname.startsWith('/invoices')) return 'Facturas';
  if (pathname.startsWith('/customers/new')) return 'Añadir Nuevo Cliente';
  if (pathname.startsWith('/customers')) return 'Clientes';
  if (pathname.startsWith('/settings/templates')) return 'Personalizar Plantillas';
  if (pathname.startsWith('/settings/company')) return 'Información de Empresa';
  if (pathname.startsWith('/settings/notifications')) return 'Notificaciones';
  if (pathname.startsWith('/settings/account')) return 'Seguridad y Cuenta';
  if (pathname.startsWith('/settings')) return 'Configuración';
  return 'Presupuestador AK';
};


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <SidebarProvider defaultOpen={true} >
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
        <SidebarHeader className="p-4">
          <AppLogo />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <MainNav />
        </SidebarContent>
        <SidebarFooter className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-left p-2">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium">Usuario</p>
                  <p className="text-xs text-muted-foreground">usuario@example.com</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <Link href="/settings" passHref>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden" /> {/* Hidden on large screens where sidebar can be icon-only or open */}
            <h1 className="text-lg md:text-xl font-semibold font-headline">
              {pageTitle}
            </h1>
          </div>
          {/* Placeholder for global actions like notifications or search */}
        </header>
        <main className="flex-1 p-4 overflow-auto md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
