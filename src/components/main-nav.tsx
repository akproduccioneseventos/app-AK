"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Users,
  KanbanSquare,
  FileText,
  CalendarDays,
  PartyPopper,
  Wallet,
  Bell,
  SunMedium,
  BarChart3,
  Camera,
  LayoutGrid,
  Target,
  Building2,
  Settings,
} from "lucide-react";
import AppLogo from "./app-logo";
import { cn } from "@/lib/utils";
import { getAlertasGlobalesConLeidas } from "@/app/actions/alertas.actions";
import { getMisPermisos } from "@/app/actions/sesion";
import { puede, perfilDe, esPerfilValido, type Permiso } from "@/lib/auth/perfiles";
import { CASAS } from "@/lib/navegacion/mapa";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  active?: (pathname: string) => boolean;
  highlight?: boolean;
  subgroup?: string;
  permiso?: Permiso | Permiso[];
};

export type NavGroup = {
  label: string;
  emoji: string;
  items: NavItem[];
};

const isPathActive = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`);

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  SunMedium,
  PartyPopper,
  KanbanSquare,
  Wallet,
  Target,
  Building2,
  Settings,
  LayoutGrid,
};

/**
 * Determina si un usuario con su perfil/permisos puede ver una entrada del menú lateral.
 */
export function puedeVerEntradaMenu(
  item: NavItem,
  user: { role?: string; perfil?: string; profile?: string; permissions?: string[] } | null
): boolean {
  if (!user) return false;
  const perfilRaw = user.perfil ?? user.profile;
  if (perfilRaw !== undefined && perfilRaw !== null && String(perfilRaw) !== '') {
    if (!esPerfilValido(perfilRaw)) {
      return false;
    }
  }
  const userConPerfil = { ...user, perfil: perfilRaw };
  const perfil = perfilDe(userConPerfil);
  if (perfil === "personal" && (!user.permissions || user.permissions.length === 0)) {
    return false;
  }
  if (!item.permiso) {
    return true;
  }
  const requeridos = Array.isArray(item.permiso) ? item.permiso : [item.permiso];
  return requeridos.some((p) => puede(userConPerfil, p));
}

/**
 * Las 7 casas de la app más la puerta Más (Orden 284).
 * Lee directamente de CASAS en src/lib/navegacion/mapa.ts.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Casas",
    emoji: "🏛️",
    items: [
      ...CASAS.map((casa) => {
        const Icon = ICON_MAP[casa.icono] || SunMedium;
        return {
          title: casa.titulo,
          href: casa.inicio,
          icon: Icon,
          permiso: casa.permiso as Permiso | Permiso[] | undefined,
          active: (pathname: string) =>
            pathname === casa.inicio ||
            isPathActive(pathname, casa.inicio) ||
            casa.pestanas.some((p) => pathname === p.ruta || isPathActive(pathname, p.ruta)),
        };
      }),
      {
        title: "Más",
        href: "/mas",
        icon: LayoutGrid,
        active: (pathname: string) => isPathActive(pathname, "/mas"),
      },
    ],
  },
];

export function obtenerGruposMenuPorPerfil(
  user: { role?: string; profile?: string; permissions?: string[] } | null
): NavGroup[] {
  if (!user) return [];
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => puedeVerEntradaMenu(item, user)),
    }))
    .filter((group) => group.items.length > 0);
}

export function MainNav() {
  const pathname = usePathname();
  const [urgentAlertCount, setUrgentAlertCount] = useState(0);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [misPermisos, setMisPermisos] = useState<Permiso[] | null>(null);
  const prevPathname = React.useRef("");

  useEffect(() => {
    let cancelado = false;
    getMisPermisos()
      .then((res) => {
        if (!cancelado) setMisPermisos(res.permisos);
      })
      .catch(() => {
        if (!cancelado) setMisPermisos([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const refreshAlertCount = React.useCallback(() => {
    getAlertasGlobalesConLeidas()
      .then((alertas) => {
        const unread = alertas.filter((a) => !a.leida);
        setTotalUnreadCount(unread.length);
        setUrgentAlertCount(unread.filter((a) => a.tipo === "urgente").length);
      })
      // no pasa nada si falla: el contador de avisos urgentes queda en cero y el menú anda igual.
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

  const isActive = (item: NavItem) => (item.active ? item.active(pathname) : isPathActive(pathname, item.href));

  const visibleGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.permiso) return true;
          if (misPermisos === null) return false;
          const reqs = Array.isArray(item.permiso) ? item.permiso : [item.permiso];
          return reqs.some((p) => misPermisos.includes(p));
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [misPermisos]);

  return (
    <Sidebar className="border-r border-indigo-100/50 bg-white/98 backdrop-blur-xl shadow-[10px_0_40px_rgba(79,70,229,0.04)]">
      <SidebarHeader className="p-6">
        <Link href="/mi-dia">
          <div className="flex items-center justify-center gap-2 cursor-pointer py-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/60 hover:border-indigo-200/80 transition-all duration-300 shadow-sm shadow-indigo-100/50">
            <AppLogo />
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-5 gap-6 scrollbar-hide">
        {visibleGroups.map((group) => {
          let lastSubgroup = "";
          return (
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
                    const showSubgroupHeader = item.subgroup && item.subgroup !== lastSubgroup;
                    if (item.subgroup) lastSubgroup = item.subgroup;

                    return (
                      <React.Fragment key={item.href}>
                        {showSubgroupHeader && (
                          <div className="pt-2 pb-1 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500/80 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span>{item.subgroup}</span>
                          </div>
                        )}
                        <SidebarMenuItem>
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
                      </React.Fragment>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
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

/**
 * Catálogo completo de pantallas del staff (leído por scripts/generar-mapa-app.mjs para la asistente de IA).
 * No contiene pantallas duplicadas ni obsoletas (Orden 284 Bloque 4).
 */
export const TODAS_LAS_OPCIONES_STAFF_MAPA = [
  { title: "Mi Día", href: "/mi-dia" },
  { title: "Eventos Activos", href: "/eventos" },
  { title: "Calendario", href: "/calendario" },
  { title: "Muro Social", href: "/empresa/red-social-eventos" },
  { title: "Incidentes", href: "/incidentes" },
  { title: "Guias de Armado", href: "/playbooks" },
  { title: "Alergias y Dietas", href: "/fiestas/nueva/alergias" },
  { title: "Portal de Proveedores", href: "/fiestas/nueva/proveedores-portal" },
  { title: "Personal en dos fiestas", href: "/recursos-multi-evento" },
  { title: "Edición de Videos", href: "/edicion-videos" },
  { title: "Gestión de Empresa", href: "/empresa" },
  { title: "Prospectos", href: "/contabilidad/crm" },
  { title: "Presupuestos", href: "/presupuestos/nuevo" },
  { title: "Clientes", href: "/customers" },
  { title: "Simulador IA", href: "/simulador-ak" },
  { title: "Pagos Rápidos", href: "/pagos-rapidos" },
  { title: "Panel Contable", href: "/empresa/contabilidad" },
  { title: "Facturas", href: "/invoices" },
  { title: "Cambios a Aprobar", href: "/aprobaciones" },
  { title: "Métricas del Negocio", href: "/empresa/dashboard" },
  { title: "Comida / Menús", href: "/empresa/menus" },
  { title: "Lista de Compras", href: "/compras" },
  { title: "Salones", href: "/empresa/salones" },
  { title: "Catálogo de Servicios", href: "/empresa/servicios" },
  { title: "Proveedores", href: "/proveedores" },
  { title: "Empleados", href: "/empleados" },
  { title: "Marketing y Redes", href: "/marketing" },
  { title: "WhatsApp del Día", href: "/contabilidad/crm/outbox" },
  { title: "Presentación LED", href: "/empresa/presentacion-led/configuracion" },
  { title: "Ajustes Generales", href: "/settings" },
  { title: "Tareas Automáticas", href: "/settings/tareas-automaticas" },
  { title: "Conexiones", href: "/settings/sincronizaciones" },
  { title: "WhatsApp", href: "/settings/whatsapp" },
  { title: "Cláusulas de Contrato", href: "/settings/contratos/clausulas" },
  { title: "Seguridad", href: "/settings/account" },
  { title: "Promociones", href: "/settings/promos" },
  { title: "Asistente IA", href: "/settings/ai-assistant" },
  { title: "Mapa Tecnológico", href: "/settings/mapa-tecnologico-ak" },
  { title: "Laboratorio Experimental", href: "/settings/feature-flags" },
  { title: "Alertas", href: "/alertas" },
  { title: "Más Herramientas", href: "/mas" },
];
