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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Settings,
  Users,
  Briefcase,
  Sparkles,
  Package,
  ChefHat,
  KanbanSquare,
  FileText,
  ListChecks,
  CalendarDays,
  Wand2,
  ShoppingCart,
  PartyPopper,
  FileArchive,
  History,
  Camera,
  Printer,
  Wallet,
  Calculator,
  TrendingUp,
  Megaphone,
  MessageSquare,
  Layout,
  Globe,
  Bell,
} from "lucide-react";
import AppLogo from "./app-logo";
import { cn } from "@/lib/utils";
import { getAlertasGlobalesConLeidas } from "@/app/actions/alertas.actions";

export function MainNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);
  const isExactly = (path: string) => pathname === path;
  const [alertCount, setAlertCount] = useState(0);
  const prevPathname = React.useRef('');

  useEffect(() => {
    // Only fetch when mounting or when navigating away from the alerts page
    const wasOnAlertas = prevPathname.current === '/alertas';
    prevPathname.current = pathname;
    if (alertCount === 0 || wasOnAlertas) {
      getAlertasGlobalesConLeidas()
        .then(alertas => setAlertCount(alertas.filter(a => !a.leida).length))
        .catch(() => {});
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Sidebar className="border-r border-indigo-100/50 bg-white/98 backdrop-blur-xl shadow-[10px_0_40px_rgba(79,70,229,0.04)]">
      <SidebarHeader className="p-6">
        <Link href="/">
          <div className="flex items-center justify-center gap-2 cursor-pointer py-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/60 hover:border-indigo-200/80 hover:from-indigo-100/50 hover:to-purple-100/50 transition-all duration-500 group shadow-sm shadow-indigo-100/50">
            <div className="group-hover:scale-110 transition-transform duration-700 ease-out">
                <AppLogo />
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-5 gap-6 scrollbar-hide">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/">
              <SidebarMenuButton 
                isActive={isExactly("/")} 
                tooltip="Dashboard Principal"
                className={cn(
                    "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em]",
                    isExactly("/") 
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30" 
                      : "hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
                )}
              >
                <LayoutDashboard className={cn("w-4 h-4", isExactly("/") ? "text-white" : "text-indigo-400")} />
                <span className="ml-2">Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">Planificación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <Link href="/eventos">
                  <SidebarMenuButton 
                    isActive={isActive("/eventos") || isActive("/fiestas/nueva")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        (isActive("/eventos") || isActive("/fiestas/nueva")) 
                          ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <PartyPopper className={cn("w-4 h-4", (isActive("/eventos") || isActive("/fiestas/nueva")) ? "text-indigo-600" : "text-purple-400")} />
                    <span className="ml-2">Eventos Activos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/calendario">
                  <SidebarMenuButton 
                    isActive={isActive("/calendario")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/calendario") ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <CalendarDays className={cn("w-4 h-4", isActive("/calendario") ? "text-indigo-600" : "text-purple-400")} />
                    <span className="ml-2">Calendario</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">Gestión Empresa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={(isActive("/empresa") && !isActive('/empresa/redes-sociales')) || isActive('/empleados') || isActive('/proveedores')}
                  isSubmenu
                  className={cn(
                    "h-10 rounded-xl font-bold text-xs transition-all duration-300",
                    (isActive("/empresa") && !isActive('/empresa/redes-sociales')) || isActive('/empleados') || isActive('/proveedores')
                      ? "text-blue-700 bg-blue-50"
                      : "text-slate-500 hover:bg-blue-50/50 hover:text-blue-600"
                  )}
                >
                  <Building2 className={cn("w-4 h-4", (isActive("/empresa") && !isActive('/empresa/redes-sociales')) || isActive('/empleados') || isActive('/proveedores') ? "text-blue-600" : "text-blue-400")} />
                  <span className="ml-2">Administración</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-5 border-l-2 border-blue-100 space-y-1 mt-1.5">
                  <SidebarMenuSubItem>
                    <Link href="/empresa/servicios">
                      <SidebarMenuSubButton isActive={isActive("/empresa/servicios")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Catálogo Maestro
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/menus">
                      <SidebarMenuSubButton isActive={isActive("/empresa/menus")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Gastronomía
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/activos-fijos">
                      <SidebarMenuSubButton isActive={isActive("/empresa/activos-fijos")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Activos Fijos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/insumos">
                      <SidebarMenuSubButton isActive={isActive("/empresa/insumos")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Insumos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empleados">
                      <SidebarMenuSubButton isActive={isActive("/empleados")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Recursos Humanos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/proveedores">
                      <SidebarMenuSubButton isActive={isActive("/proveedores")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Proveedores
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={
                    isActive("/contabilidad") ||
                    isActive("/presupuestos") ||
                    isActive("/invoices") ||
                    isActive("/customers") ||
                    isActive("/analytics")
                  }
                  isSubmenu
                  className={cn(
                    "h-10 rounded-xl font-bold text-xs transition-all duration-300",
                    isActive("/contabilidad") || isActive("/presupuestos") || isActive("/invoices") || isActive("/customers") || isActive("/analytics")
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-600"
                  )}
                >
                  <BarChart3 className={cn("w-4 h-4", isActive("/contabilidad") || isActive("/presupuestos") || isActive("/invoices") || isActive("/customers") || isActive("/analytics") ? "text-emerald-600" : "text-emerald-400")} />
                  <span className="ml-2">Finanzas & Ventas</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-5 border-l-2 border-emerald-100 space-y-1 mt-1.5">
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/crm">
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/crm")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter text-emerald-600 hover:text-emerald-700">
                        CRM Prospectos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/crm/agenda">
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/crm/agenda")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-emerald-600">
                        Agenda Citas
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                   <SidebarMenuSubItem>
                    <Link href="/customers">
                      <SidebarMenuSubButton isActive={isActive("/customers")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-emerald-600">
                        Base Clientes
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/presupuestos/nuevo">
                      <SidebarMenuSubButton isActive={isActive("/presupuestos")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-emerald-600">
                        Presupuestos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/invoices">
                      <SidebarMenuSubButton isActive={isActive("/invoices")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-emerald-600">
                        Facturación
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/contabilidad/flujo-caja">
                      <SidebarMenuSubButton isActive={isActive("/empresa/contabilidad/flujo-caja")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter text-blue-600 hover:text-blue-700">
                        Flujo de Caja
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/contabilidad/gastos">
                      <SidebarMenuSubButton isActive={isActive("/empresa/contabilidad/gastos")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-emerald-600">
                        Gastos Empresa
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/fiestas-historicas">
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/fiestas-historicas")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-emerald-600">
                        Historial Base
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/analytics">
                      <SidebarMenuSubButton isActive={isActive("/analytics")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter text-indigo-600 hover:text-indigo-700">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        Dashboard Analítico
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">Herramientas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <Link href="/simulador-de-presupuesto">
                  <SidebarMenuButton isActive={isActive("/simulador-de-presupuesto")} className={cn("h-10 rounded-xl font-bold text-xs transition-all duration-300", isActive("/simulador-de-presupuesto") ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:bg-amber-50/60 hover:text-amber-600")}>
                    <Wand2 className="w-4 h-4 text-amber-500" />
                    <span className="ml-2">Simulador Presupuesto</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/simulador-ak">
                  <SidebarMenuButton isActive={isActive("/simulador-ak")} className={cn("h-10 rounded-xl font-bold text-xs transition-all duration-300", isActive("/simulador-ak") ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-violet-50/60 hover:text-violet-600")}>
                    <MessageSquare className="w-4 h-4 text-violet-500" />
                    <span className="ml-2">Simulador Chat AK</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/redes-sociales">
                  <SidebarMenuButton isActive={isActive("/empresa/redes-sociales")} className={cn("h-10 rounded-xl font-bold text-xs transition-all duration-300", isActive("/empresa/redes-sociales") ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600")}>
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="ml-2">Marketing</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/settings/promos">
                  <SidebarMenuButton isActive={isActive("/settings/promos")} className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300">
                    <Megaphone className="w-5 h-5 text-purple-500" />
                    <span className="ml-2">Promos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/galeria">
                  <SidebarMenuButton isActive={isActive("/empresa/galeria")} className={cn("h-10 rounded-xl font-bold text-xs transition-all duration-300", isActive("/empresa/galeria") ? "bg-pink-50 text-pink-700" : "text-slate-500 hover:bg-pink-50/60 hover:text-pink-600")}>
                    <Camera className="w-4 h-4 text-pink-500" />
                    <span className="ml-2">Galería</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/landing-editor">
                  <SidebarMenuButton isActive={isActive("/empresa/landing-editor")} className={cn("h-10 rounded-xl font-bold text-xs transition-all duration-300", isActive("/empresa/landing-editor") ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:bg-cyan-50/60 hover:text-cyan-600")}>
                    <Layout className="w-4 h-4 text-cyan-500" />
                    <span className="ml-2">Editor Landing</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/landing" target="_blank">
                  <SidebarMenuButton className="h-10 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-300">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="ml-2">Ver Landing Pública</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter className="p-5 space-y-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/alertas">
              <SidebarMenuButton
                isActive={isActive("/alertas")}
                className={cn(
                    "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em] relative",
                    isActive("/alertas") ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                )}
              >
                <Bell className="w-4 h-4" />
                <span className="ml-2">Alertas</span>
                {alertCount > 0 && (
                  <span className="absolute right-3 top-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow">
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/settings">
              <SidebarMenuButton 
                isActive={isActive("/settings")}
                className={cn(
                    "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em]",
                    isActive("/settings") ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Settings className="w-4 h-4" />
                <span className="ml-2">Ajustes</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center justify-between pt-2 border-t border-indigo-50">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-200 select-none">
            © {new Date().getFullYear()} AK Producciones
          </p>
          <span className="text-[9px] font-bold text-indigo-200 select-none bg-indigo-50 px-1.5 py-0.5 rounded-full">v2.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
