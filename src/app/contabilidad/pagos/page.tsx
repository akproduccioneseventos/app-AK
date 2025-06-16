'use client';

import type { ReactNode } from 'react';
import AppLogo from './app-logo';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, Settings as SettingsIcon, MessageSquareText, LayoutGrid, Palette, ChefHat, Globe, Music2, CalendarClock, ListChecks, Briefcase, StickyNote, ShoppingCart, CalendarDays as CalendarDaysIcon, LogIn as LogInIcon, UserPlus2 as UserPlusIcon, Sparkles, Building2, FileText, Banknote, LayoutDashboard, PlusCircle as PlusCircleIcon, CircleDollarSign, ContactRound, Users, DollarSign as DollarSignIcon, Printer, KanbanSquare, PartyPopper, ClipboardCheck, UserCheck, Calculator, HardHat, Cake, GlassWater, ClipboardList as ClipboardListIcon, Archive, Ticket, PackageSearch, Package, Edit, BarChart3, PackagePlus } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const getPageTitle = (pathname: string): string => {
  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathname === '/') return 'Menú Principal';

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
  
  // Empresa
  if (pathname === '/empresa') return 'Gestión de la Empresa';
  if (pathname === '/empresa/contabilidad') return 'Panel Contable y Financiero';
  if (pathname === '/proveedores') return 'Proveedores';
  if (pathname === '/proveedores/new') return 'Añadir Nuevo Proveedor';
  if (pathname === '/empresa/todos-los-servicios') return 'Inventario General y Valor de Activos';
  if (pathname === '/empresa/todos-los-servicios/nuevo') return 'Añadir Nuevo Ítem al Inventario';
   if (pathSegments[0] === 'empresa' && pathSegments[1] === 'todos-los-servicios' && pathSegments[2] === 'editar' && pathSegments[3]) return `Editar Ítem #${pathSegments[3]}`;


  if (pathname === '/compras') return 'Compras y Checklist';

  // Empleados
  if (pathname === '/empleados') return 'Gestión de Personal';
  if (pathname === '/empleados/nuevo') return 'Añadir Nuevo Empleado';
  if (pathSegments[0] === 'empleados' && pathSegments[2] === 'editar' && pathSegments.length === 3) return `Editar Empleado #${pathSegments[1]}`;
  if (pathname === '/empleados/roles') return 'Configuración de Roles';


  // Fiestas (Planificador)
  if (pathname === '/fiestas/nueva') return 'Planificador de Fiestas';
  if (pathname === '/fiestas/nueva/tareas') return 'Tareas del Evento';
  if (pathname === '/fiestas/nueva/invitados') return 'Gestión de Invitados';
  if (pathname === '/fiestas/nueva/servicios-contratados') return 'Servicios Contratados';
  if (pathname === '/fiestas/nueva/decoracion') return 'Decoración y Diseño del Evento';
  if (pathname === '/fiestas/nueva/decoracion/pdf') return 'PDF Decoración';
  if (pathname === '/fiestas/nueva/configuracion') return 'Configuración del Evento';
  if (pathname === '/fiestas/nueva/pagina-web') return 'Página Web del Evento';
  if (pathname === '/fiestas/nueva/catering') return 'Catering y Menú del Evento';
  if (pathname === '/fiestas/nueva/catering/nuevo-menu') return 'Crear Nuevo Menú Personalizado';
  if (pathname === '/fiestas/nueva/catering/modificar-menu') return 'Seleccionar Menú para Modificar';
  if (pathSegments[0] === 'fiestas' && pathSegments[1] === 'nueva' && pathSegments[2] === 'catering' && pathSegments[3] === 'menu' && pathSegments[5] === 'editar') {
    return `Editando Menú: ${pathSegments[4]}`;
  }
  if (pathname === '/fiestas/nueva/catering/lista-compras') return 'Lista de Compras (Catering)';
  if (pathname === '/fiestas/nueva/personal') return 'Asignar Personal al Evento';
  if (pathname === '/fiestas/nueva/reuniones') return 'Gestión de Reuniones';
  if (pathname === '/fiestas/nueva/musica') return 'Música de la Fiesta';
  if (pathname === '/fiestas/nueva/gestion-documental') return 'Gestión Documental y Financiera';
  if (pathname === '/fiestas/nueva/carga-operativa') return 'Lista de Carga Operativa';


  // Contabilidad & CRM
  // if (pathname === '/contabilidad/pagos') return 'Registro de Pagos'; // Removed
  if (pathname === '/contabilidad/crm') return 'Gestión de Prospectos (CRM)';


  // Configuración
  if (pathname === '/settings') return 'Configuración General';
  if (pathname === '/settings/templates') return 'Personalizar Plantillas';
  if (pathname === '/settings/budget-display') return 'Configuración de Presupuestos';
  if (pathname === '/settings/company') return 'Información de la Empresa';
  if (pathname === '/settings/notifications') return 'Configurar Notificaciones';
  if (pathname === '/settings/account') return 'Cuenta y Seguridad';

  // Página Pública del Evento y Login/Signup
  if (pathname === '/evento/actual') return 'Página del Evento';
  if (pathname === '/evento/actual/mesa') return 'Consulta de Mesa';
  if (pathname === '/login') return 'Iniciar Sesión';
  if (pathname === '/signup') return 'Crear Cuenta';
  
  if (pathname === '/planner-costo-fiesta') return 'Planificador Gastronómico Integral';
  if (pathname === '/planner-costo-fiesta/reposteria') return 'Gestión de Repostería';
  if (pathname === '/planner-costo-fiesta/bebidas') return 'Gestión de Bebidas';


  // Rutas Actualizadas
  if (pathname === '/eventos') return 'Todas las Fiestas';
  if (pathname === '/calendario') return 'Calendario General';
  if (pathname === '/notas') return 'Bloc de Notas';

  // Fallback para rutas no definidas explícitamente
  if (pathSegments.length > 0) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    let title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
    if (pathSegments.length > 1 && pathSegments[pathSegments.length-2]) {
        const parentSegment = pathSegments[pathSegments.length-2];
        const parentTitle = parentSegment.charAt(0).toUpperCase() + parentSegment.slice(1).replace(/-/g, ' ');
        if (!isNaN(Number(title))) { // If the last segment is a number (likely an ID)
            if (parentTitle.toLowerCase() === 'invoices' && title) return `Factura #${title}`;
            if (parentTitle.toLowerCase() === 'presupuestos' && title) return `Presupuesto #${title}`;
            if (parentTitle.toLowerCase() === 'customers' && title) return `Cliente #${title}`;
            if (parentTitle.toLowerCase() === 'empleados' && title) return `Empleado #${title}`;
             if (parentTitle.toLowerCase() === 'editar' && pathSegments[pathSegments.length-3]?.toLowerCase() === 'todos-los-servicios') return `Editar Ítem #${title}`; // Specific for item edit
            return `${parentTitle}: #${title}`;
        }
        if(title.toLowerCase() === 'edit' || title.toLowerCase() === 'editar') title = "Editar";
        if(title.toLowerCase() === 'new' || title.toLowerCase() === 'nuevo' || title.toLowerCase() === 'nueva') title = "Nuevo";

        if(parentTitle.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(parentTitle.toLowerCase())){
             return title;
        }
        
        // Special case for item edit to avoid "Editar - Editar Ítem #id"
        if (title === "Editar" && parentTitle.startsWith("Editar Ítem #")) {
            return parentTitle;
        }


        return `${parentTitle} - ${title}`;
    }
    return title;
  }

  return 'AK Producciones';
};

const getPageIcon = (pathname: string): React.ElementType | null => {
  if (pathname === '/') return LayoutDashboard;
  if (pathname.startsWith('/fiestas/nueva')) {
    if (pathname === '/fiestas/nueva/personal') return UserCheck;
    if (pathname === '/fiestas/nueva/reuniones') return MessageSquareText;
    if (pathname === '/fiestas/nueva/decoracion') return Palette;
    if (pathname === '/fiestas/nueva/decoracion/pdf') return Printer;
    if (pathname === '/fiestas/nueva/catering') return ChefHat;
    if (pathname === '/fiestas/nueva/catering/lista-compras') return ShoppingCart;
    if (pathname === '/fiestas/nueva/pagina-web') return Globe;
    if (pathname === '/fiestas/nueva/musica') return Music2;
    if (pathname === '/fiestas/nueva/invitados') return Users;
    if (pathname === '/fiestas/nueva/tareas') return ClipboardListIcon;
    if (pathname === '/fiestas/nueva/configuracion') return SettingsIcon;
    if (pathname === '/fiestas/nueva/servicios-contratados') return ClipboardListIcon;
    if (pathname === '/fiestas/nueva/gestion-documental') return Archive;
    if (pathname === '/fiestas/nueva/carga-operativa') return PackageSearch;
    return PartyPopper;
  }


  if (pathname === '/empresa') return Building2;
  if (pathname === '/empresa/contabilidad') return BarChart3; 
  if (pathname === '/empresa/todos-los-servicios') return Package; 
  if (pathname === '/empresa/todos-los-servicios/nuevo') return PackagePlus;
  if (pathname.startsWith('/empresa/todos-los-servicios/editar')) return Edit;


  if (pathname === '/proveedores') return Briefcase;
  if (pathname === '/proveedores/new') return UserPlusIcon;
  if (pathname === '/empleados') return ContactRound;
  if (pathname === '/empleados/roles') return SettingsIcon;
  if (pathname === '/customers') return Users;


  if (pathname === '/eventos') return CalendarClock;
  if (pathname === '/compras') return ShoppingCart;
  if (pathname === '/calendario') return CalendarDaysIcon;
  if (pathname === '/notas') return StickyNote;

  if (pathname === '/login') return LogInIcon;
  if (pathname === '/signup') return UserPlusIcon;

  if (pathname === '/presupuestos') return ListChecks;
  if (pathname === '/invoices') return FileText;
  // if (pathname === '/contabilidad/pagos') return Banknote; // Removed
  if (pathname === '/contabilidad/crm') return KanbanSquare;
  
  if (pathname === '/settings') return SettingsIcon;
  if (pathname === '/settings/budget-display') return SettingsIcon;
  
  if (pathname === '/planner-costo-fiesta') return Calculator;
  if (pathname === '/planner-costo-fiesta/reposteria') return Cake;
  if (pathname === '/planner-costo-fiesta/bebidas') return GlassWater;
  
  if (pathname === '/evento/actual') return PartyPopper;
  if (pathname === '/evento/actual/mesa') return Ticket;


  return null;
}


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const PageIcon = getPageIcon(pathname);

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isPublicEventPage = pathname.startsWith('/evento/actual');
  const isDecoracionPdfPage = pathname === '/fiestas/nueva/decoracion/pdf';

  if (isAuthPage || isPublicEventPage || isDecoracionPdfPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <div className="flex items-center gap-2">
          <AppLogo />
          <span className="mx-2 text-muted-foreground">|</span>
          {PageIcon && <PageIcon className="h-6 w-6 text-primary" />}
          <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/40x40.png" alt="Avatar de Usuario" data-ai-hint="user avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <Link href="/settings" passHref>
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <Link href="/login" passHref>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
        {children}
      </main>
    </div>
  );
}