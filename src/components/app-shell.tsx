
'use client'; 

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
import { UserCircle, LogOut, Settings as SettingsIcon } from 'lucide-react';
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
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/eventos')) return 'Eventos';
  if (pathname.startsWith('/clientes')) return 'Clientes';
  if (pathname.startsWith('/proveedores')) return 'Proveedores';
  if (pathname.startsWith('/empleados')) return 'Empleados';
  if (pathname.startsWith('/presupuestos/nuevo')) return 'Crear Nuevo Presupuesto';
  if (pathname.startsWith('/presupuestos')) return 'Presupuestos y Pagos';
  if (pathname.startsWith('/compras')) return 'Compras y Checklist';
  if (pathname.startsWith('/calendario')) return 'Calendario';
  if (pathname.startsWith('/notas')) return 'Notas';

  // Old routes, for reference or if needed
  if (pathname.startsWith('/invoices/new')) return 'Crear Nueva Factura';
  if (pathname.startsWith('/invoices')) return 'Facturas';
  if (pathname.startsWith('/customers/new')) return 'Añadir Nuevo Cliente';
  if (pathname.startsWith('/customers')) return 'Clientes Antiguo';


  if (pathname.startsWith('/settings/templates')) return 'Personalizar Plantillas';
  if (pathname.startsWith('/settings/company')) return 'Información de Empresa';
  if (pathname.startsWith('/settings/notifications')) return 'Notificaciones';
  if (pathname.startsWith('/settings/account')) return 'Seguridad y Cuenta';
  if (pathname.startsWith('/settings')) return 'Configuración';
  
  const capitalizedPath = pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2);
  return capitalizedPath.replace('-', ' ') || 'AK Producciones';
};


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <SidebarProvider defaultOpen={true} >
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <AppLogo />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <MainNav />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-left p-2 hover:bg-sidebar-accent focus:bg-sidebar-accent">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src="https://placehold.co/40x40.png?text=U" alt="User Avatar" data-ai-hint="user avatar" />
                  <AvatarFallback className="bg-sidebar-accent-foreground text-sidebar-background">U</AvatarFallback>
                </Avatar>
                <div className="group-data-[collapsible=icon]:hidden text-sidebar-foreground">
                  <p className="text-sm font-medium">Usuario</p>
                  <p className="text-xs text-sidebar-foreground/80">usuario@akproducciones.com</p>
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
                  <SettingsIcon className="w-4 h-4 mr-2" />
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
            <SidebarTrigger className="lg:hidden" /> 
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-foreground">
              {pageTitle}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-auto md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
