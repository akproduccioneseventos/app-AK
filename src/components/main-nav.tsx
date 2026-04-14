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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  Settings,
  Users,
  KanbanSquare,
  FileText,
  CalendarDays,
  Wand2,
  PartyPopper,
  Wallet,
  MessageSquare,
  Bell,
  PlusCircle,
  BookOpen,
  MessageCircle,
  ChefHat,
  Package,
  Briefcase,
  BarChart3,
  DoorOpen,
  Wrench,
  Send,
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
    // Refresh alert count on mount and when navigating away from the alerts page
    const wasOnAlertas = prevPathname.current === '/alertas';
    prevPathname.current = pathname;
    if (wasOnAlertas || pathname !== '/alertas') {
      getAlertasGlobalesConLeidas()
        .then(alertas => setAlertCount(alertas.filter(a => !a.leida).length))
        .catch(() => {});
    }
  }, [pathname]);

  const isAdminActive =
    isActive("/empresa") ||
    isActive("/empleados") ||
    isActive("/proveedores") ||
    isActive("/invoices") ||
    isActive("/analytics") ||
    isActive("/contabilidad/fiestas-historicas") ||
    isActive("/playbooks") ||
    isActive("/aprobaciones") ||
    isActive("/auditoria") ||
    isActive("/incidentes") ||
    isActive("/settings/feature-flags") ||
    isActive("/settings/promos") ||
    isActive("/recursos-multi-evento");

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

        {/* 1. INICIO */}
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

        {/* 2. CLIENTES */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">👥 Clientes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <Link href="/contabilidad/crm">
                  <SidebarMenuButton 
                    isActive={isActive("/contabilidad/crm") && !isActive("/contabilidad/crm/agenda")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/contabilidad/crm") && !isActive("/contabilidad/crm/agenda")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <KanbanSquare className={cn("w-4 h-4", isActive("/contabilidad/crm") && !isActive("/contabilidad/crm/agenda") ? "text-indigo-600" : "text-purple-400")} />
                    <span className="ml-2">CRM / Prospectos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/contabilidad/crm/agenda">
                  <SidebarMenuButton 
                    isActive={isActive("/contabilidad/crm/agenda")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/contabilidad/crm/agenda")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <CalendarDays className={cn("w-4 h-4", isActive("/contabilidad/crm/agenda") ? "text-indigo-600" : "text-purple-400")} />
                    <span className="ml-2">Agenda Citas</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/customers">
                  <SidebarMenuButton 
                    isActive={isActive("/customers")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/customers")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <Users className={cn("w-4 h-4", isActive("/customers") ? "text-indigo-600" : "text-purple-400")} />
                    <span className="ml-2">Base de Clientes</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 3. PRESUPUESTOS */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">💰 Presupuestos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <Link href="/presupuestos/nuevo">
                  <SidebarMenuButton 
                    isActive={isActive("/presupuestos/nuevo")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/presupuestos/nuevo")
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-400/30"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                    )}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="ml-2">Nuevo Presupuesto</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/presupuestos">
                  <SidebarMenuButton 
                    isActive={isActive("/presupuestos") && !isActive("/presupuestos/nuevo")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/presupuestos") && !isActive("/presupuestos/nuevo")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <FileText className={cn("w-4 h-4", isActive("/presupuestos") && !isActive("/presupuestos/nuevo") ? "text-indigo-600" : "text-purple-400")} />
                    <span className="ml-2">Ver todos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/simulador-de-presupuesto">
                  <SidebarMenuButton 
                    isActive={isActive("/simulador-de-presupuesto")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/simulador-de-presupuesto")
                          ? "bg-amber-50 text-amber-700 shadow-sm" 
                          : "text-slate-500 hover:bg-amber-50/60 hover:text-amber-600"
                    )}
                  >
                    <Wand2 className={cn("w-4 h-4", isActive("/simulador-de-presupuesto") ? "text-amber-600" : "text-amber-400")} />
                    <span className="ml-2">Simulador</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/simulador-ak">
                  <SidebarMenuButton 
                    isActive={isActive("/simulador-ak")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/simulador-ak")
                          ? "bg-violet-50 text-violet-700 shadow-sm" 
                          : "text-slate-500 hover:bg-violet-50/60 hover:text-violet-600"
                    )}
                  >
                    <MessageSquare className={cn("w-4 h-4", isActive("/simulador-ak") ? "text-violet-600" : "text-violet-400")} />
                    <span className="ml-2">Simulador Chat AK</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/pagos-rapidos">
                  <SidebarMenuButton 
                    isActive={isActive("/pagos-rapidos")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/pagos-rapidos")
                          ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                          : "text-slate-500 hover:bg-emerald-50/60 hover:text-emerald-600"
                    )}
                  >
                    <Wallet className={cn("w-4 h-4", isActive("/pagos-rapidos") ? "text-emerald-600" : "text-emerald-400")} />
                    <span className="ml-2">Pagos Rápidos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 4. EVENTOS */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">🎉 Eventos</SidebarGroupLabel>
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
                        isActive("/calendario")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <CalendarDays className={cn("w-4 h-4", isActive("/calendario") ? "text-indigo-600" : "text-purple-400")} />
                    <span className="ml-2">Calendario</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/catalogo">
                  <SidebarMenuButton 
                    isActive={isActive("/catalogo")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/catalogo")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <BookOpen className={cn("w-4 h-4", isActive("/catalogo") ? "text-indigo-600" : "text-purple-400")} />
                    <span className="ml-2">Catálogo Digital</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 5. WHATSAPP */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-green-400 mb-3">💬 WhatsApp</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <Link href="/contabilidad/crm/outbox">
                  <SidebarMenuButton
                    isActive={isActive("/contabilidad/crm/outbox")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/contabilidad/crm/outbox")
                          ? "bg-green-500 text-white shadow-md shadow-green-400/30"
                          : "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                    )}
                  >
                    <Send className="w-4 h-4" />
                    <span className="ml-2">Envíos del Día</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/settings/whatsapp">
                  <SidebarMenuButton
                    isActive={isActive("/settings/whatsapp") && !isActive("/settings/whatsapp-templates") && !isActive("/settings/whatsapp-business")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/settings/whatsapp") && !isActive("/settings/whatsapp-templates") && !isActive("/settings/whatsapp-business")
                          ? "bg-green-50 text-green-700 shadow-sm"
                          : "text-slate-500 hover:bg-green-50/60 hover:text-green-700"
                    )}
                  >
                    <MessageCircle className={cn("w-4 h-4", isActive("/settings/whatsapp") && !isActive("/settings/whatsapp-templates") && !isActive("/settings/whatsapp-business") ? "text-green-600" : "text-green-400")} />
                    <span className="ml-2">Configuración WA</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 6. CONTABILIDAD */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">📊 Contabilidad</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <Link href="/empresa/contabilidad">
                  <SidebarMenuButton
                    isActive={isActive("/empresa/contabilidad") && !isActive("/empresa/contabilidad/gastos") && !isActive("/empresa/contabilidad/flujo-caja") && !isActive("/empresa/contabilidad/reportes")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/empresa/contabilidad") && !isActive("/empresa/contabilidad/gastos") && !isActive("/empresa/contabilidad/flujo-caja") && !isActive("/empresa/contabilidad/reportes")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <BarChart3 className={cn("w-4 h-4", isActive("/empresa/contabilidad") ? "text-indigo-600" : "text-indigo-400")} />
                    <span className="ml-2">Panel Contable</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/invoices">
                  <SidebarMenuButton
                    isActive={isActive("/invoices")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/invoices")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <FileText className={cn("w-4 h-4", isActive("/invoices") ? "text-indigo-600" : "text-indigo-400")} />
                    <span className="ml-2">Facturación</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/contabilidad/gastos">
                  <SidebarMenuButton
                    isActive={isActive("/empresa/contabilidad/gastos")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/empresa/contabilidad/gastos")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <Wallet className={cn("w-4 h-4", isActive("/empresa/contabilidad/gastos") ? "text-indigo-600" : "text-indigo-400")} />
                    <span className="ml-2">Gastos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/contabilidad/flujo-caja">
                  <SidebarMenuButton
                    isActive={isActive("/empresa/contabilidad/flujo-caja")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/empresa/contabilidad/flujo-caja")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <Wallet className={cn("w-4 h-4", isActive("/empresa/contabilidad/flujo-caja") ? "text-indigo-600" : "text-indigo-400")} />
                    <span className="ml-2">Flujo de Caja</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/analytics">
                  <SidebarMenuButton
                    isActive={isActive("/analytics")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/analytics")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <BarChart3 className={cn("w-4 h-4", isActive("/analytics") ? "text-indigo-600" : "text-indigo-400")} />
                    <span className="ml-2">Analytics</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/contabilidad/fiestas-historicas">
                  <SidebarMenuButton
                    isActive={isActive("/contabilidad/fiestas-historicas")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/contabilidad/fiestas-historicas")
                          ? "bg-indigo-50 text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-600"
                    )}
                  >
                    <BookOpen className={cn("w-4 h-4", isActive("/contabilidad/fiestas-historicas") ? "text-indigo-600" : "text-indigo-400")} />
                    <span className="ml-2">Historial</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 7. EMPRESA */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-blue-300 mb-3">🏢 Empresa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <Link href="/empleados">
                  <SidebarMenuButton
                    isActive={isActive("/empleados")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/empleados")
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-500 hover:bg-blue-50/60 hover:text-blue-600"
                    )}
                  >
                    <Briefcase className={cn("w-4 h-4", isActive("/empleados") ? "text-blue-600" : "text-blue-400")} />
                    <span className="ml-2">Empleados</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/proveedores">
                  <SidebarMenuButton
                    isActive={isActive("/proveedores")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/proveedores")
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-500 hover:bg-blue-50/60 hover:text-blue-600"
                    )}
                  >
                    <Users className={cn("w-4 h-4", isActive("/proveedores") ? "text-blue-600" : "text-blue-400")} />
                    <span className="ml-2">Proveedores</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/salones">
                  <SidebarMenuButton
                    isActive={isActive("/empresa/salones")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/empresa/salones")
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-500 hover:bg-blue-50/60 hover:text-blue-600"
                    )}
                  >
                    <DoorOpen className={cn("w-4 h-4", isActive("/empresa/salones") ? "text-blue-600" : "text-blue-400")} />
                    <span className="ml-2">Salones</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/activos-fijos">
                  <SidebarMenuButton
                    isActive={isActive("/empresa/activos-fijos")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/empresa/activos-fijos")
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-500 hover:bg-blue-50/60 hover:text-blue-600"
                    )}
                  >
                    <Wrench className={cn("w-4 h-4", isActive("/empresa/activos-fijos") ? "text-blue-600" : "text-blue-400")} />
                    <span className="ml-2">Activos Fijos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/menus">
                  <SidebarMenuButton
                    isActive={isActive("/empresa/menus")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/empresa/menus")
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-500 hover:bg-blue-50/60 hover:text-blue-600"
                    )}
                  >
                    <ChefHat className={cn("w-4 h-4", isActive("/empresa/menus") ? "text-blue-600" : "text-blue-400")} />
                    <span className="ml-2">Gastronomía / Menús</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/insumos">
                  <SidebarMenuButton
                    isActive={isActive("/empresa/insumos")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/empresa/insumos")
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-500 hover:bg-blue-50/60 hover:text-blue-600"
                    )}
                  >
                    <Package className={cn("w-4 h-4", isActive("/empresa/insumos") ? "text-blue-600" : "text-blue-400")} />
                    <span className="ml-2">Insumos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/servicios">
                  <SidebarMenuButton
                    isActive={isActive("/empresa/servicios")}
                    className={cn(
                        "h-10 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/empresa/servicios")
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-500 hover:bg-blue-50/60 hover:text-blue-600"
                    )}
                  >
                    <Building2 className={cn("w-4 h-4", isActive("/empresa/servicios") ? "text-blue-600" : "text-blue-400")} />
                    <span className="ml-2">Catálogo de Servicios</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 8. ADMINISTRACIÓN (gestión interna) */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">⚙️ Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isAdminActive}
                  isSubmenu
                  className={cn(
                    "h-10 rounded-xl font-bold text-xs transition-all duration-300",
                    isAdminActive
                      ? "text-blue-700 bg-blue-50"
                      : "text-slate-500 hover:bg-blue-50/50 hover:text-blue-600"
                  )}
                >
                  <Building2 className={cn("w-4 h-4", isAdminActive ? "text-blue-600" : "text-blue-400")} />
                  <span className="ml-2">Más opciones</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-5 border-l-2 border-blue-100 space-y-1 mt-1.5">
                  <SidebarMenuSubItem>
                    <Link href="/playbooks">
                      <SidebarMenuSubButton isActive={isActive("/playbooks")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Playbooks
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/aprobaciones">
                      <SidebarMenuSubButton isActive={isActive("/aprobaciones")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Aprobaciones
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/auditoria">
                      <SidebarMenuSubButton isActive={isActive("/auditoria")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Auditoría
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/incidentes">
                      <SidebarMenuSubButton isActive={isActive("/incidentes")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Incidentes
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/redes-sociales">
                      <SidebarMenuSubButton isActive={isActive("/empresa/redes-sociales")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Marketing / Redes
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/settings/promos">
                      <SidebarMenuSubButton isActive={isActive("/settings/promos")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Promos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/galeria">
                      <SidebarMenuSubButton isActive={isActive("/empresa/galeria")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Galería
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/landing-editor">
                      <SidebarMenuSubButton isActive={isActive("/empresa/landing-editor")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Editor Landing
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/landing" target="_blank">
                      <SidebarMenuSubButton className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Ver Landing Pública
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/recursos-multi-evento">
                      <SidebarMenuSubButton isActive={isActive("/recursos-multi-evento")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Recursos Multi-Evento
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/settings/feature-flags">
                      <SidebarMenuSubButton isActive={isActive("/settings/feature-flags")} className="rounded-lg h-8 font-semibold text-[11px] uppercase tracking-tighter hover:text-blue-600">
                        Feature Flags
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
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
                isActive={isActive("/settings") && !isActive("/settings/promos") && !isActive("/settings/feature-flags")}
                className={cn(
                    "h-11 rounded-xl transition-all duration-300 font-black uppercase text-[10px] tracking-[0.2em]",
                    isActive("/settings") && !isActive("/settings/promos") && !isActive("/settings/feature-flags") ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
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
