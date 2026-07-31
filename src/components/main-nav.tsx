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
    label: "CRM",
    emoji: "💼",
    items: [
      { title: "Prospectos", href: "/contabilidad/crm", icon: KanbanSquare, active: (pathname) => isPathActive(pathname, "/contabilidad/crm") && !isPathActive(pathname, "/contabilidad/crm/outbox") },
      { title: "Nuevo Presupuesto", href: "/presupuestos/nuevo", icon: PlusCircle, highlight: true },
      { title: "Presupuestos", href: "/presupuestos", icon: FileText, active: (pathname) => isPathActive(pathname, "/presupuestos") && !isPathActive(pathname, "/presupuestos/nuevo") },
      { title: "Clientes", href: "/customers", icon: Users },
      { title: "Simulador IA", href: "/simulador-ak", icon: Wand2 },
      { title: "WhatsApp del Día", href: "/contabilidad/crm/outbox", icon: Send, highlight: true },
    ],
  },
  {
    label: "Fiestas",
    emoji: "🎉",
    items: [
      { title: "Eventos Activos", href: "/eventos", icon: PartyPopper, active: (pathname) => isPathActive(pathname, "/eventos") || isPathActive(pathname, "/fiestas") },
      { title: "Calendario", href: "/calendario", icon: CalendarDays },
      { title: "Muro Social", href: "/empresa/red-social-eventos", icon: Camera },
    ],
  },
  {
    label: "Contabilidad",
    emoji: "💰",
    items: [
      { title: "Pagos Rápidos", href: "/pagos-rapidos", icon: Wallet, highlight: true },
      { title: "Panel Contable", href: "/empresa/contabilidad", icon: BarChart3 },
      { title: "Facturas", href: "/invoices", icon: FileText },
    ],
  },
  {
    label: "Insumos",
    emoji: "📦",
    items: [
      { title: "Comida / Menús", href: "/empresa/menus", icon: ChefHat },
      { title: "Salones", href: "/empresa/salones", icon: DoorOpen },
      { title: "Catálogo de Servicios", href: "/empresa/servicios", icon: Package },
      { title: "Proveedores", href: "/proveedores", icon: Building2 },
      { title: "Empleados", href: "/empleados", icon: Briefcase },
    ],
  },
  {
    label: "Configuración",
    emoji: "⚙️",
    items: [
      { title: "Ajustes Generales", href: "/settings", icon: Settings, active: (pathname) => pathname === "/settings" },
      { title: "WhatsApp", href: "/settings/whatsapp", icon: MessageCircle },
      { title: "Seguridad", href: "/settings/account", icon: ShieldCheck },
    ],
  },
];

export function MainNav() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);
  const prevPathname = React.useRef("");

  const refreshAlertCount = React.useCallback(() => {
    getAlertasGlobalesConLeidas()
      .then((alertas) => setAlertCount(alertas.filter((a) => !a.leida).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const wasOnAlertas = prevPathname.current === "/alertas";
    prevPathname.current = pathname;
    // Refresh when leaving /alertas or on any navigation
    if (wasOnAlertas || pathname !== "/alertas") {
      refreshAlertCount();
    }
  }, [pathname, refreshAlertCount]);

  // Polling every 5 minutes + refresh when tab becomes visible
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
              isActive={isExactly("/admin")}
              tooltip="Inicio"
              className={cn(
                "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em]",
                isExactly("/admin")
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "hover:bg-indigo-50 text-slate-500 hover:text-indigo-600"
              )}
            >
              <Link href="/admin">
                <LayoutDashboard className="w-4 h-4" />
                <span className="ml-2">Inicio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">
              {group.emoji} {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                          item.highlight && !active && "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                          active ? "bg-indigo-600 text-white shadow-md shadow-indigo-400/30" : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className="w-4 h-4" />
                          <span className="ml-2">{item.title}</span>
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
                {alertCount > 0 && (
                  <span className="absolute right-3 top-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow">
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
