"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Settings,
  Users,
  KanbanSquare,
  FileText,
  CalendarDays,
  Wand2,
  PartyPopper,
  Wallet,
  Bell,
  PlusCircle,
  MessageCircle,
  ChefHat,
  Package,
  Briefcase,
  BarChart3,
  DoorOpen,
  Send,
  ShieldCheck,
  Building2,
  Camera,
  AlertTriangle,
  ClipboardList,
  CheckSquare,
  Zap,
  Link as LinkIcon,
  ShoppingCart,
  Wheat,
  Scale,
  HardHat,
  SunMedium,
  Users2,
  TrendingUp,
  Target,
  Tv,
  Tag,
  Bot,
  Cpu,
} from "lucide-react";
import AppLogo from "./app-logo";
import { cn } from "@/lib/utils";
import { getAlertasGlobalesConLeidas } from "@/app/actions/alertas.actions";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  active?: (pathname: string) => boolean;
  highlight?: boolean;
};

type NavGroup = {
  label: string;
  emoji: string;
  items: NavItem[];
};

const isPathActive = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`);

/**
 * Cinco módulos operativos. Cada destino existente conserva su ruta:
 * esto reagrupa la navegación, no mueve páginas.
 */
const navGroups: NavGroup[] = [
  {
    label: "Mi Día",
    emoji: "☀️",
    items: [
      { title: "Mi Día", href: "/mi-dia", icon: SunMedium, highlight: true, active: (pathname) => isPathActive(pathname, "/mi-dia") || isPathActive(pathname, "/repaso-diario") },
    ],
  },
  {
    label: "Fiestas",
    emoji: "🎉",
    items: [
      { title: "Eventos Activos", href: "/eventos", icon: PartyPopper, active: (pathname) => isPathActive(pathname, "/eventos") || isPathActive(pathname, "/fiestas") },
      { title: "Calendario", href: "/calendario", icon: CalendarDays },
      { title: "Muro Social", href: "/empresa/red-social-eventos", icon: Camera },
      { title: "Incidentes", href: "/incidentes", icon: AlertTriangle },
      { title: "Guias de Armado", href: "/playbooks", icon: ClipboardList },
      { title: "Alergias y Dietas", href: "/fiestas/nueva/alergias", icon: Wheat },
      { title: "Portal de Proveedores", href: "/fiestas/nueva/proveedores-portal", icon: HardHat },
      { title: "Personal en dos fiestas", href: "/recursos-multi-evento", icon: Users2 },
    ],
  },
  {
    label: "Vender",
    emoji: "💼",
    items: [
      { title: "Gestión de Empresa", href: "/empresa", icon: Building2, active: (pathname) => pathname === "/empresa" },
      { title: "Prospectos", href: "/contabilidad/crm", icon: KanbanSquare, active: (pathname) => isPathActive(pathname, "/contabilidad/crm") && !isPathActive(pathname, "/contabilidad/crm/outbox") && !isPathActive(pathname, "/contabilidad/crm/marketing-ads") },
      { title: "Presupuestos", href: "/presupuestos/nuevo", icon: FileText, highlight: true, active: (pathname) => isPathActive(pathname, "/presupuestos") },
      { title: "Clientes", href: "/customers", icon: Users },
      { title: "Simulador IA", href: "/simulador-ak", icon: Wand2 },
    ],
  },
  {
    label: "Plata",
    emoji: "💰",
    items: [
      { title: "Pagos Rápidos", href: "/pagos-rapidos", icon: Wallet, highlight: true },
      { title: "Panel Contable", href: "/empresa/contabilidad", icon: BarChart3 },
      { title: "Facturas", href: "/invoices", icon: FileText },
      { title: "Cambios a Aprobar", href: "/aprobaciones", icon: CheckSquare },
      { title: "Métricas del Negocio", href: "/empresa/dashboard", icon: TrendingUp },
    ],
  },
  {
    label: "Recursos",
    emoji: "📦",
    items: [
      { title: "Comida / Menús", href: "/empresa/menus", icon: ChefHat },
      { title: "Lista de Compras", href: "/compras", icon: ShoppingCart },
      { title: "Salones", href: "/empresa/salones", icon: DoorOpen },
      { title: "Catálogo de Servicios", href: "/empresa/servicios", icon: Package },
      { title: "Proveedores", href: "/proveedores", icon: Building2 },
      { title: "Empleados", href: "/empleados", icon: Briefcase },
    ],
  },
  {
    label: "Marketing",
    emoji: "🚀",
    items: [
      { title: "Marketing y Difusión", href: "/empresa/marketing", icon: Target, highlight: true },
      { title: "Redes Sociales", href: "/empresa/redes-sociales", icon: Camera },
      { title: "WhatsApp del Día", href: "/contabilidad/crm/outbox", icon: Send },
      { title: "Rendimiento Anuncios", href: "/contabilidad/crm/marketing-ads", icon: TrendingUp },
      { title: "Presentación LED", href: "/empresa/presentacion-led/configuracion", icon: Tv },
    ],
  },
  {
    label: "Configuración",
    emoji: "⚙️",
    items: [
      { title: "Ajustes Generales", href: "/settings", icon: Settings, active: (pathname) => pathname === "/settings" },
      { title: "Tareas Automáticas", href: "/settings/tareas-automaticas", icon: Zap },
      { title: "Conexiones", href: "/settings/sincronizaciones", icon: LinkIcon },
      { title: "WhatsApp", href: "/settings/whatsapp", icon: MessageCircle },
      { title: "Cláusulas de Contrato", href: "/settings/contratos/clausulas", icon: Scale },
      { title: "Seguridad", href: "/settings/account", icon: ShieldCheck },
      { title: "Promociones", href: "/settings/promos", icon: Tag },
      { title: "Asistente IA", href: "/settings/ai-assistant", icon: Bot },
      { title: "Mapa Tecnológico", href: "/settings/mapa-tecnologico-ak", icon: Cpu },
      { title: "Laboratorio Experimental", href: "/settings/feature-flags", icon: Wand2 },
    ],
  },
];

export function MainNav() {
  const pathname = usePathname();
  const [urgentAlertCount, setUrgentAlertCount] = useState(0);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const prevPathname = React.useRef("");

  const refreshAlertCount = React.useCallback(() => {
    getAlertasGlobalesConLeidas()
      .then((alertas) => {
        const unread = alertas.filter((a) => !a.leida);
        setTotalUnreadCount(unread.length);
        setUrgentAlertCount(unread.filter((a) => a.tipo === "urgente").length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const wasOnAlertas = prevPathname.current === "/alertas";
    prevPathname.current = pathname;
    if (wasOnAlertas || pathname !== "/alertas") {
      refreshAlertCount();
    }
  }, [pathname, refreshAlertCount]);

  useEffect(() => {
    const interval = setInterval(refreshAlertCount, 5 * 60 * 1000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshAlertCount();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshAlertCount]);

  const isExactly = (path: string) => pathname === path;
  const isActive = (item: NavItem) => item.active ? item.active(pathname) : isPathActive(pathname, item.href);

  return (
    <Sidebar className="border-r border-indigo-100/50 bg-white/98 backdrop-blur-xl shadow-[10px_0_40px_rgba(79,70,229,0.04)]">
      <SidebarHeader className="p-6">
        <Link href="/admin">
          <div className="flex items-center justify-center gap-2 cursor-pointer py-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/60 hover:border-indigo-200/80 transition-all duration-300 shadow-sm shadow-indigo-100/50">
            <AppLogo />
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-5 gap-6 scrollbar-hide">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isExactly("/")}
              tooltip="Centro de Control"
              className={cn(
                "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em]",
                isExactly("/") ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-600 hover:bg-slate-100/80"
              )}
            >
              <Link href="/">
                <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                <span className="ml-2">Centro de Control</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="p-0 space-y-2">
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-3 flex items-center justify-between">
              <span>{group.label}</span>
              <span className="text-xs opacity-70">{group.emoji}</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "h-10 rounded-xl transition-all duration-200 font-bold text-xs tracking-tight",
                          active
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black"
                            : item.highlight
                            ? "text-indigo-950 font-black bg-indigo-50/50 hover:bg-indigo-100/60"
                            : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                        )}
                      >
                        <Link href={item.href}>
                          <Icon className={cn("w-4 h-4 mr-2", active ? "text-white" : item.highlight ? "text-indigo-600" : "text-slate-400")} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-5 space-y-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isPathActive(pathname, "/alertas")}
              tooltip="Alertas"
              className={cn(
                "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em] relative",
                isPathActive(pathname, "/alertas") ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:bg-red-50 hover:text-red-600"
              )}
            >
              <Link href="/alertas">
                <Bell className="w-4 h-4" />
                <span className="ml-2">Alertas</span>
                {urgentAlertCount > 0 ? (
                  <span className="absolute right-3 top-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow">
                    {urgentAlertCount > 99 ? "99+" : urgentAlertCount}
                  </span>
                ) : totalUnreadCount > 0 ? (
                  <span className="absolute right-3 top-3.5 w-2 h-2 bg-slate-400 rounded-full" />
                ) : null}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
