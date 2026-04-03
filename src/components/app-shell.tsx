'use client';

import { ReactNode, useState, useEffect } from 'react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, Settings as SettingsIcon, MessageSquareText, LayoutGrid, Palette, ChefHat, Globe, Music2, CalendarClock, ListChecks, Briefcase, StickyNote, ShoppingCart, CalendarDays as CalendarDaysIcon, LogIn as LogInIcon, UserPlus2 as UserPlus2Icon, Sparkles, Building2, FileText, Banknote, LayoutDashboard, PlusCircle as PlusCircleIcon, CircleDollarSign, ContactRound, Users, DollarSign, Printer, KanbanSquare, PartyPopper, ClipboardCheck, UserCheck, Calculator, HardHat, Cake, GlassWater, ClipboardList as ClipboardListIcon, Archive, Ticket, PackageSearch, Package, Edit, BarChart3, PackagePlus, BellRing, UserCog, Link as LinkIcon, Camera, Gift, Star, QrCode, Clock, TrendingUp, HardDriveDownload, Wand2, Film, FileArchive, KeyRound, History, Zap, Bot } from 'lucide-react';
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
import { triggerAppLogout } from '@/components/auth-guard';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationsHub } from '@/components/notifications-hub';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from './main-nav';


const getPageTitle = (pathname: string): string => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const idSegment = pathSegments[pathSegments.length -1];

  if (pathname === '/') return 'Menú Principal';
  
  if (pathname === '/presupuestos/nuevo') return 'Central de Presupuestos';
  if (pathSegments[0] === 'presupuestos' && pathSegments[2] === 'editar' && pathSegments.length === 3) return `Editar Presupuesto #${idSegment?.substring(0,5)}`;
  if (pathSegments[0] === 'presupuestos' && pathSegments[2] === 'ver' && pathSegments.length === 3) return `Ver Presupuesto #${idSegment?.substring(0,5)}`;

  if (pathname === '/invoices') return 'Gestión de Facturas';
  if (pathname === '/invoices/new') return 'Nueva Factura';
  if (pathSegments[0] === 'invoices' && pathSegments[2] === 'edit' && pathSegments.length === 3) return `Editar Factura #${idSegment}`;
  if (pathSegments[0] === 'invoices' && pathSegments[1] && pathSegments.length === 2 && !pathname.endsWith('/edit')) return `Detalle de Factura #${idSegment}`;

  if (pathname === '/customers') return 'Clientes';
  if (pathname === '/customers/new') return 'Añadir Nuevo Cliente';
  if (pathSegments[0] === 'customers' && pathSegments[2] === 'edit' && pathSegments.length === 3) return `Editar Cliente #${idSegment}`;
  if (pathSegments[0] === 'customers' && pathSegments[1] && pathSegments.length === 2 && !pathname.endsWith('/edit')) return `Detalle de Cliente`;
  if (pathname === '/customers/reporte') return 'Reporte de Clientes';
  
  if (pathname === '/empresa') return 'Gestión de la Empresa';
  if (pathname === '/empresa/salones') return 'Gestor de Salones';
  if (pathname === '/empresa/servicios') return 'Catálogo de Servicios';
  if (pathname === '/empresa/servicios/nuevo') return 'Añadir Nuevo Servicio';
  if (pathname === '/empresa/servicios/reporte') return 'Reporte de Servicios';
  if (pathSegments[0] === 'empresa' && pathSegments[1] === 'servicios' && pathSegments[2] === 'editar') return `Editar Servicio`;
  if (pathname === '/empresa/contabilidad') return 'Panel Contable y Financiero';
  if (pathname === '/empresa/contabilidad/reportes') return 'Reporte de Ganancias y Pérdidas';
  if (pathname === '/proveedores') return 'Proveedores';
  if (pathname === '/proveedores/new') return 'Añadir Nuevo Proveedor';
  if (pathname === '/proveedores/reporte') return 'Reporte de Proveedores';
  if (pathname === '/empresa/activos-fijos') return 'Gestión de Activos Fijos';
  if (pathname === '/empresa/activos-fijos/nuevo') return 'Añadir Nuevo Activo Fijo';
  if (pathname === '/empresa/activos-fijos/reporte') return 'Reporte de Stock de Activos';
  if (pathSegments[0] === 'empresa' && pathSegments[1] === 'activos-fijos' && pathSegments[2] === 'editar') return `Editar Activo`;
  if (pathname === '/empresa/redes-sociales') return 'Planificador de Contenido';
  if (pathname === '/empresa/redes-sociales/ia-marketing') return 'Asesor de Marketing IA';
  if (pathname === '/empresa/menus') return 'Planificador Gastronómico Maestro';
  if (pathname === '/empresa/menus/catalogo') return 'Catálogo de Platos';
  if (pathname === '/empresa/menus/reporte') return 'Reporte Gastronómico Maestro';
  if (pathname === '/empresa/menus/nuevo') return 'Crear Nuevo Menú';
  if (pathSegments[0] === 'empresa' && pathSegments[1] === 'menus' && pathSegments[3] === 'editar') return `Editando Menú`;
  if (pathname === '/empresa/insumos') return 'Gestión de Insumos';
  if (pathname === '/empresa/insumos/nuevo') return 'Añadir Nuevo Insumo';
  if (pathname === '/empresa/insumos/reporte') return 'Reporte de Stock de Insumos';
  if (pathSegments[0] === 'empresa' && pathSegments[1] === 'insumos' && pathSegments[2] === 'editar') return `Editar Insumo`;

  if (pathname === '/empleados') return 'Gestión de Personal';
  if (pathname === '/empleados/nuevo') return 'Añadir Nuevo Empleado';
  if (pathSegments[0] === 'empleados' && pathSegments[2] === 'editar' && pathSegments.length === 3) return `Editar Empleado`;
  if (pathname === '/empleados/roles') return 'Configuración de Roles';
  if (pathname === '/empleados/reporte') return 'Reporte de Personal';

  if (pathname === '/fiestas/nueva') return 'Planificador de Fiestas General';
  if (pathname === '/fiestas/nueva/tareas') return 'Tareas del Evento';
  if (pathname === '/fiestas/nueva/invitados') return 'Gestión de Invitados';
  if (pathname === '/fiestas/nueva/invitados/layout') return 'Diseño de Mesas y Salón';
  if (pathname === '/fiestas/nueva/itinerario') return 'Cronograma de la Fiesta';
  if (pathname === '/fiestas/nueva/servicios-contratados') return 'Servicios Contratados';
  if (pathname === '/fiestas/nueva/decoracion') return 'Decoración y Diseño del Evento';
  if (pathname === '/fiestas/nueva/decoracion/pdf') return 'PDF Decoración';
  if (pathname === '/fiestas/nueva/configuracion') return 'Configuración del Evento';
  if (pathname === '/fiestas/nueva/catering') return 'Catering y Menú del Evento';
  if (pathname === '/fiestas/nueva/catering/lista-compras') return 'Lista de Compras (Catering)';
  if (pathname === '/fiestas/nueva/personal') return 'Asignar Personal al Evento';
  if (pathname === '/fiestas/nueva/personal/recibos') return 'Recibos de Pago de Personal';
  if (pathname === '/fiestas/nueva/reuniones') return 'Reuniones y Portal Cliente';
  if (pathname === '/fiestas/nueva/musica') return 'Música de la Fiesta';
  if (pathname === '/fiestas/nueva/musica/pdf') return 'PDF de Música';
  if (pathname === '/fiestas/nueva/fotografia') return 'Fotografía y Filmación';
  if (pathname === '/fiestas/nueva/gestion-documental') return 'Gestión Documental y Financiera';
  if (pathname === '/fiestas/nueva/gestion-costos-rentabilidad') return 'Costos y Rentabilidad del Evento';
  if (pathname === '/fiestas/nueva/carga-operativa') return 'Lista de Carga Operativa';
  if (pathname === '/fiestas/nueva/carga-operativa/pdf') return 'PDF Lista de Carga';
  if (pathname === '/fiestas/nueva/video-vida') return 'Video de Vida';
  if (pathname === '/fiestas/nueva/regalos') return 'Lista de Regalos';
  if (pathname === '/fiestas/nueva/resumen-imprimible') return 'Resumen Imprimible del Evento';
  if (pathname === '/fiestas/nueva/pagina-web') return 'Página Pública del Evento';
  if (pathname === '/fiestas/nueva/en-vivo') return 'Evento en Vivo (Táctico)';
  if (pathname === '/planner-costo-fiesta') return 'Planificador Gastronómico Integral';

  if (pathname === '/contabilidad/crm') return 'Gestión de Prospectos (CRM)';
  if (pathname === '/contabilidad/crm/agenda') return 'Agenda de Prospectos (CRM)';


  if (pathname === '/settings') return 'Configuración General';
  if (pathname === '/settings/templates') return 'Personalizar Plantillas';
  if (pathname === '/settings/budget-display') return 'Configuración del Simulador';
  if (pathname === '/settings/company') return 'Información de la Empresa';
  if (pathname === '/settings/social-connections') return 'Cuentas Sociales Vinculadas';
  if (pathname === '/settings/notifications') return 'Configurar Notificaciones';
  if (pathname === '/settings/account') return 'Cuenta y Seguridad';
  if (pathname === '/settings/feedback') return 'Feedback y Testimonios';
  if (pathname === '/admin/aaiff-fiesta') return 'Análisis de Evento con IA';
  if (pathname === '/admin/asistente-ak') return 'Asistente de Marketing IA';
  if (pathname === '/settings/backup') return 'Backup y Restauración';
  if (pathname === '/admin/carga-historicos') return 'Carga Rápida de Históricos';
  if (pathname === '/admin/ventas') return 'Tablero Comercial';
  if (pathname === '/admin/finanzas') return 'Dashboard de Rentabilidad';
  
  if (pathname === '/simulador-de-presupuesto') return 'Wand2';
  
  if (pathname === '/evento/actual') return 'PartyPopper';
  if (pathname === '/evento/actual/mesa') return 'Ticket';
  if (pathname === '/evento/actual/checkin') return 'UserCheck';
  if (pathname.startsWith('/evento/social')) return 'Camera';
  if (pathname.startsWith('/video-vida')) return 'Camera';
  if (pathname.startsWith('/feedback')) return 'Star';
  if (pathname.startsWith('/acceso-personal')) return 'UserCog';
  if (pathname.startsWith('/portal')) return 'KeyRound';

  return 'AK Producciones';
};

const getPageIcon = (pathname: string): React.ElementType | null => {
  if (pathname === '/') return LayoutDashboard;
  if (pathname.startsWith('/fiestas/nueva')) {
    if (pathname === '/fiestas/nueva/personal') return UserCheck;
    if (pathname === '/fiestas/nueva/personal/recibos') return Printer;
    if (pathname === '/fiestas/nueva/reuniones') return MessageSquareText;
    if (pathname === '/fiestas/nueva/portal-cliente') return Globe;
    if (pathname === '/fiestas/nueva/decoracion') return Palette;
    if (pathname === '/fiestas/nueva/decoracion/pdf') return Printer;
    if (pathname === '/fiestas/nueva/catering') return ChefHat;
    if (pathname === '/fiestas/nueva/catering/lista-compras') return ShoppingCart;
    if (pathname === '/fiestas/nueva/musica') return Music2;
    if (pathname === '/fiestas/nueva/musica/pdf') return Printer;
    if (pathname === '/fiestas/nueva/fotografia') return Film;
    if (pathname === '/fiestas/nueva/invitados') return Users;
    if (pathname === '/fiestas/nueva/invitados/layout') return LayoutDashboard;
    if (pathname === '/fiestas/nueva/itinerario') return Clock;
    if (pathname === '/fiestas/nueva/tareas') return ClipboardListIcon;
    if (pathname === '/fiestas/nueva/configuracion') return SettingsIcon;
    if (pathname === '/fiestas/nueva/servicios-contratados') return ClipboardCheck;
    if (pathname === '/fiestas/nueva/gestion-documental') return Archive;
    if (pathname === '/fiestas/nueva/gestion-costos-rentabilidad') return BarChart3;
    if (pathname === '/fiestas/nueva/carga-operativa') return PackageSearch;
    if (pathname === '/fiestas/nueva/carga-operativa/pdf') return Printer;
    if (pathname === '/fiestas/nueva/video-vida') return Camera;
    if (pathname === '/fiestas/nueva/regalos') return Gift;
    if (pathname === '/fiestas/nueva/resumen-imprimible') return Printer;
    if (pathname === '/fiestas/nueva/pagina-web') return Globe;
    if (pathname === '/fiestas/nueva/en-vivo') return Zap;
    if (pathname === '/planner-costo-fiesta') return Calculator;
    return PartyPopper;
  }

  if (pathname === '/empresa') return Building2;
  if (pathname === '/empresa/servicios' || pathname === '/empresa/servicios/reporte' || pathname === '/empresa/servicios/nuevo' || pathname.startsWith('/empresa/servicios/editar')) return Sparkles;
  if (pathname === '/empresa/contabilidad') return BarChart3; 
  if (pathname === '/empresa/contabilidad/reportes') return TrendingUp; 
  if (pathname === '/empresa/activos-fijos' || pathname === '/empresa/activos-fijos/reporte' || pathname === '/empresa/activos-fijos/nuevo' || pathname.startsWith('/empresa/activos-fijos/editar')) return Package;
  if (pathname === '/empresa/insumos' || pathname === '/empresa/insumos/reporte' || pathname === '/empresa/insumos/nuevo' || pathname.startsWith('/empresa/insumos/editar')) return Package;
  if (pathname.startsWith('/empresa/redes-sociales')) return Sparkles;
  if (pathname.startsWith('/empresa/menus')) return ChefHat;

  if (pathname === '/proveedores' || pathname === '/proveedores/reporte') return Briefcase;
  if (pathname === '/proveedores/new') return UserPlus2Icon;
  if (pathname === '/empleados' || pathname === '/empleados/reporte') return ContactRound;
  if (pathname === '/empleados/roles') return SettingsIcon;
  if (pathname === '/customers' || pathname === '/customers/reporte') return Users;

  if (pathname === '/eventos') return CalendarClock;
  if (pathname === '/calendario') return CalendarDaysIcon;
  
  if (pathname === '/login') return LogInIcon;

  if (pathname === '/presupuestos/nuevo') return ListChecks;
  if (pathname.startsWith('/presupuestos')) return ListChecks;
  if (pathname === '/invoices') return FileText;
  if (pathname === '/contabilidad/crm') return KanbanSquare;
  if (pathname === '/contabilidad/crm/agenda') return CalendarDaysIcon;


  if (pathname === '/settings') return SettingsIcon;
  if (pathname === '/settings/templates') return Palette;
  if (pathname === '/settings/budget-display') return Wand2;
  if (pathname === '/settings/company') return Building2;
  if (pathname === '/settings/social-connections') return LinkIcon;
  if (pathname === '/settings/notifications') return BellRing;
  if (pathname === '/settings/account') return UserCog;
  if (pathname === '/settings/feedback') return Star;
  if (pathname === '/admin/aaiff-fiesta') return PartyPopper;
  if (pathname === '/settings/backup') return HardDriveDownload;
  if (pathname === '/admin/carga-historicos') return FileArchive;
  if (pathname === '/admin/ventas') return KanbanSquare;
  if (pathname === '/admin/finanzas') return TrendingUp;
  if (pathname === '/settings/task-templates') return ListChecks;
  if (pathname === '/settings/accesos-personal') return UserCog;
  
  if (pathname === '/simulador-de-presupuesto') return Wand2;
  
  if (pathname === '/evento/actual') return PartyPopper;
  if (pathname === '/evento/actual/mesa') return Ticket;
  if (pathname === '/evento/actual/checkin') return UserCheck;
  if (pathname.startsWith('/evento/social')) return Camera;
  if (pathname.startsWith('/video-vida')) return Camera;
  if (pathname.startsWith('/feedback')) return Star;
  if (pathname.startsWith('/acceso-personal')) return UserCog;
  if (pathname.startsWith('/portal')) return KeyRound;

  return null;
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const PageIcon = getPageIcon(pathname);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    async function fetchLogo() {
      try {
        const settings = await getInvoiceTemplateSettings();
        setLogoUrl(settings.logoUrl);
      } catch (error) {
        console.error("Failed to fetch company logo for avatar", error);
        setLogoUrl(null);
      }
    }
    fetchLogo();
  }, []);


  // Define public-facing paths that should not have the main AppShell (header, etc.)
  const isAuthPage = pathname === '/login';
  const isPublicEventPage = pathname.startsWith('/evento/actual') || pathname.startsWith('/evento/social') || pathname.startsWith('/evento/accesos') || pathname.startsWith('/evento/muro-en-vivo') || pathname.startsWith('/invitacion') || pathname.startsWith('/video-vida') || pathname.startsWith('/feedback') || pathname.startsWith('/acceso-personal') || pathname.startsWith('/portal') || pathname.startsWith('/landing') || pathname.startsWith('/public') || pathname.startsWith('/portal-cliente') || pathname.startsWith('/simulador') || pathname.startsWith('/proveedor');
  const isClientFacingTool = pathname === '/simulador-de-presupuesto';

  // Define pages that are printable views and should not have the shell.
  const isPdfPage = pathname.endsWith('/pdf') || pathname.endsWith('/resumen-imprimible') || pathname.endsWith('/reporte');
  
  // Define special pages that might have their own layout
  const isBudgetViewPage = /^\/presupuestos\/[^/]+\/ver$/.test(pathname);
  const isInvoiceViewPage = /^\/invoices\/[^/]+$/.test(pathname) && !pathname.endsWith('/edit');

  const isSpecialRender = 
    isAuthPage || 
    isPublicEventPage || 
    isClientFacingTool ||
    isPdfPage ||
    isBudgetViewPage ||
    isInvoiceViewPage;

  // Simplified logic for when to render the shell
  if (isSpecialRender) {
    return <main className="min-h-screen">{children}</main>;
  }

  const handleLogoutClick = () => {
    triggerAppLogout();
  };

  return (
    <SidebarProvider>
      <MainNav />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 print:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              {PageIcon && <PageIcon className="h-6 w-6 text-primary" />}
              <h1 className="text-lg md:text-xl font-semibold text-foreground">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationsHub />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      {logoUrl === undefined ? (
                        <Skeleton className="h-9 w-9 rounded-full" />
                      ) : logoUrl ? (
                        <AvatarImage src={logoUrl} alt="Logo de la Empresa" />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          AK
                        </AvatarFallback>
                      )}
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
                  <Link href="/settings">
                    <DropdownMenuItem>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogoutClick}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
