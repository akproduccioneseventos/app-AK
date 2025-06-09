
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
import { UserCircle, LogOut, Settings as SettingsIcon, UserCheck, MessageSquareText, LayoutGrid, Palette, ChefHat } from 'lucide-react';
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
  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathname === '/') return 'Dashboard';
  
  // Presupuestos
  if (pathname === '/presupuestos') return 'Presupuestos';
  if (pathname === '/presupuestos/nuevo') return 'Nuevo Presupuesto';
  if (pathSegments[0] === 'presupuestos' && pathSegments[2] === 'editar' && pathSegments.length === 3) return `Editar Presupuesto #${pathSegments[1]}`;
  if (pathSegments[0] === 'presupuestos' && pathSegments[2] === 'ver' && pathSegments.length === 3) return `Ver Presupuesto #${pathSegments[1]}`;
  
  // Facturas
  if (pathname === '/invoices') return 'Facturas';
  if (pathname === '/invoices/new') return 'Nueva Factura';
  if (pathSegments[0] === 'invoices' && pathSegments[2] === 'edit' && pathSegments.length === 3) return `Editar Factura #${pathSegments[1]}`;
  if (pathSegments[0] === 'invoices' && pathSegments[1] && pathSegments.length === 2 && !pathSegments[2]) return `Detalle de Factura #${pathSegments[1]}`;

  // Clientes
  if (pathname === '/customers') return 'Clientes';
  if (pathname === '/customers/new') return 'Añadir Nuevo Cliente';
  if (pathSegments[0] === 'customers' && pathSegments[2] === 'edit' && pathSegments.length === 3) return `Editar Cliente #${pathSegments[1]}`;

  // Empleados
  if (pathname === '/empleados') return 'Gestión de Personal';
  if (pathname === '/empleados/nuevo') return 'Añadir Nuevo Empleado';
  if (pathSegments[0] === 'empleados' && pathSegments[2] === 'editar' && pathSegments.length === 3) return `Editar Empleado #${pathSegments[1]}`;


  // Fiestas (Planificador)
  if (pathname === '/fiestas/nueva') return 'Planificador de Fiestas';
  if (pathname === '/fiestas/nueva/tareas') return 'Tareas del Evento';
  if (pathname === '/fiestas/nueva/invitados') return 'Gestión de Invitados';
  if (pathname === '/fiestas/nueva/proveedores') return 'Proveedores y Servicios';
  if (pathname === '/fiestas/nueva/decoracion') return 'Diseño y Decoración';
  if (pathname === '/fiestas/nueva/diseno-salon') return 'Diseño del Salón';
  if (pathname === '/fiestas/nueva/configuracion') return 'Configuración del Evento';
  if (pathname === '/fiestas/nueva/pagina-web') return 'Página Web del Evento';
  if (pathname === '/fiestas/nueva/catering') return 'Catering y Menú del Evento';
  if (pathname === '/fiestas/nueva/catering/nuevo-menu') return 'Crear Nuevo Menú Personalizado';
  if (pathname === '/fiestas/nueva/catering/modificar-menu') return 'Seleccionar Menú para Modificar';
  if (pathSegments[0] === 'fiestas' && pathSegments[1] === 'nueva' && pathSegments[2] === 'catering' && pathSegments[3] === 'menu' && pathSegments[5] === 'editar') {
    return `Editando Menú: ${pathSegments[4]}`;
  }
  if (pathname === '/fiestas/nueva/personal') return 'Asignar Personal al Evento';
  if (pathname === '/fiestas/nueva/reuniones') return 'Gestión de Reuniones';


  // Configuración
  if (pathname === '/settings') return 'Configuración General';
  if (pathname === '/settings/templates') return 'Personalizar Plantillas';
  if (pathname === '/settings/company') return 'Información de la Empresa';
  if (pathname === '/settings/notifications') return 'Configurar Notificaciones';
  if (pathname === '/settings/account') return 'Cuenta y Seguridad';
  
  // Rutas Generales (menos específicas)
  if (pathname.startsWith('/eventos')) return 'Eventos';
  if (pathname.startsWith('/proveedores')) return 'Proveedores';
  if (pathname.startsWith('/compras')) return 'Compras';
  if (pathname.startsWith('/calendario')) return 'Calendario';
  if (pathname.startsWith('/notas')) return 'Notas';
  
  // Fallback para rutas no definidas explícitamente
  if (pathSegments.length > 0) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    let title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
    if (pathSegments.length > 1 && pathSegments[pathSegments.length-2]) {
        const parentSegment = pathSegments[pathSegments.length-2];
        const parentTitle = parentSegment.charAt(0).toUpperCase() + parentSegment.slice(1).replace(/-/g, ' ');
        if (!isNaN(Number(title))) { // Es un ID
            // Casos especiales para IDs
            if (parentTitle.toLowerCase() === 'invoices' && title) return `Factura #${title}`;
            if (parentTitle.toLowerCase() === 'presupuestos' && title) return `Presupuesto #${title}`;
            if (parentTitle.toLowerCase() === 'customers' && title) return `Cliente #${title}`;
            if (parentTitle.toLowerCase() === 'empleados' && title) return `Empleado #${title}`;
            return `${parentTitle}: #${title}`;
        }
        // Si no es un ID, puede ser una subpágina con nombre
        if(title.toLowerCase() === 'edit' || title.toLowerCase() === 'editar') title = "Editar";
        if(title.toLowerCase() === 'new' || title.toLowerCase() === 'nuevo' || title.toLowerCase() === 'nueva') title = "Nuevo";
        
        // Evitar duplicar el título padre si es muy similar
        if(parentTitle.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(parentTitle.toLowerCase())){
             return title;
        }

        return `${parentTitle} - ${title}`;
    }
    return title;
  }
  
  return 'AK Producciones'; // Default fallback
};

const getPageIcon = (pathname: string): React.ElementType | null => {
  if (pathname === '/fiestas/nueva/personal') return UserCheck;
  if (pathname === '/fiestas/nueva/reuniones') return MessageSquareText;
  if (pathname === '/fiestas/nueva/diseno-salon') return LayoutGrid;
  if (pathname === '/fiestas/nueva/decoracion') return Palette;
  if (pathname === '/fiestas/nueva/catering') return ChefHat;
  // Add other icons for other pages if needed
  return null;
}


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const PageIcon = getPageIcon(pathname);

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
                  <AvatarImage src="https://placehold.co/40x40.png" alt="Avatar de Usuario" data-ai-hint="user avatar" />
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
             {PageIcon && <PageIcon className="w-6 h-6 md:w-7 md:h-7 text-primary hidden sm:block" />}
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
