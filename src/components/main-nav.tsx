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

const navGroups: NavGroup[] = [
  {
    label: "Ventas",
    emoji: "💼",
    items: [
      { title: "CRM / Prospectos", href: "/contabilidad/crm", icon: KanbanSquare },
      { title: "Nuevo Presupuesto", href: "/presupuestos/nuevo", icon: PlusCircle, highlight: true },
      { title: "Presupuestos", href: "/presupuestos", icon: FileText, active: (pathname) => isPathActive(pathname, "/presupuestos") && !isPathActive(pathname, "/presupuestos/nuevo") },
      { title: "Simulador", href: "/simulador-de-presupuesto", icon: Wand2 },
      { title: "Clientes", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Eventos",
    emoji: "🎉",
    items: [
      { title: "Eventos Activos", href: "/eventos", icon: PartyPopper, active: (pathname) => isPathActive(pathname, "/eventos") || isPathActive(pathname, "/fiestas") },
      { title: "Calendario", href: "/calendario", icon: CalendarDays },
      { title: "Comida / Menús", href: "/empresa/menus", icon: ChefHat },
      { title: "Salones", href: "/empresa/salones", icon: DoorOpen },
    ],
  },
  {
    label: "Dinero",
    emoji: "💰",
    items: [
      { title: "Pagos Rápidos", href: "/pagos-rapidos", icon: Wallet, highlight: true },
      { title: "Panel Contable", href: "/empresa/contabilidad", icon: BarChart3 },
      { title: "Facturas", href: "/invoices", icon: FileText },
    ],
  },
  {
    label: "Comunicación",
    emoji: "💬",
    items: [
      { title: "WhatsApp del Día", href: "/contabilidad/crm/outbox", icon: Send, highlight: true },
      { title: "Configurar WhatsApp", href: "/settings/whatsapp", icon: MessageCircle },
    ],
  },
  {
    label: "Empresa",
    emoji: "🏢",
    items: [
      { title: "Catálogo de Servicios", href: "/empresa/servicios", icon: Package },
      { title: "Empleados", href: "/empleados", icon: Briefcase },
      { title: "Seguridad", href: "/settings/account", icon: ShieldCheck },
    ],
  },
];

export function MainNav() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);
  const prevPathname = React.useRef("");

  useEffect(() => {
    const wasOnAlertas = prevPathname.current === "/alertas";
    prevPathname.current = pathname;
    if (wasOnAlertas || pathname !== "/alertas") {
      getAlertasGlobalesConLeidas()
        .then((alertas) => setAlertCount(alertas.filter((a) => !a.leida).length))
        .catch(() => {});
    }
  }, [pathname]);

  const isExactly = (path: string) => pathname === path;
  const isActive = (item: NavItem) => item.active ? item.active(pathname) : isPathActive(pathname, item.href);

  return (
    <Sidebar className="border-r border-indigo-100/50 bg-white/98 backdrop-blur-xl shadow-[10px_0_40px_rgba(79,70,229,0.04)]">
      <SidebarHeader className="p-6">
        <Link href="/">
          <div className="flex items-center justify-center gap-2 cursor-pointer py-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/60 hover:border-indigo-200/80 transition-all duration-300 shadow-sm shadow-indigo-100/50">
            <AppLogo />
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-5 gap-6 scrollbar-hide">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/">
              <SidebarMenuButton
                isActive={isExactly("/")}
                tooltip="Inicio"
                className={cn(
                  "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em]",
                  isExactly("/")
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                    : "hover:bg-indigo-50 text-slate-500 hover:text-indigo-600"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="ml-2">Inicio</span>
              </SidebarMenuButton>
            </Link>
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
                      <Link href={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          className={cn(
                            "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                            item.highlight && !active && "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                            active ? "bg-indigo-600 text-white shadow-md shadow-indigo-400/30" : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="ml-2">{item.title}</span>
                        </SidebarMenuButton>
                      </Link>
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
            <Link href="/alertas">
              <SidebarMenuButton
                isActive={isPathActive(pathname, "/alertas")}
                className={cn(
                  "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em] relative",
                  isPathActive(pathname, "/alertas") ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                )}
              >
                <Bell className="w-4 h-4" />
                <span className="ml-2">Alertas</span>
                {alertCount > 0 && (
                  <span className="absolute right-3 top-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow">
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/settings">
              <SidebarMenuButton
                isActive={isPathActive(pathname, "/settings")}
                className={cn(
                  "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em]",
                  isPathActive(pathname, "/settings") ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Settings className="w-4 h-4" />
                <span className="ml-2">Configuración</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
