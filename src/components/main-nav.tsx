"use client"

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
  TrendingUp
} from "lucide-react";
import AppLogo from "./app-logo";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);
  const isExactly = (path: string) => pathname === path;

  return (
    <Sidebar className="border-r border-slate-100 bg-white/95 backdrop-blur-xl shadow-[10px_0_40px_rgba(0,0,0,0.02)]">
      <SidebarHeader className="p-8">
        <Link href="/">
          <div className="flex items-center justify-center gap-2 cursor-pointer py-6 bg-slate-50/50 rounded-3xl border border-slate-100/50 hover:border-primary/20 hover:bg-white transition-all duration-500 group shadow-inner">
            <div className="group-hover:scale-110 transition-transform duration-700 ease-out">
                <AppLogo />
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-6 gap-8 scrollbar-hide">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/">
              <SidebarMenuButton 
                isActive={isExactly("/")} 
                tooltip="Dashboard Principal"
                className={cn(
                    "h-14 rounded-2xl transition-all duration-500 font-black uppercase text-[10px] tracking-[0.2em]",
                    isExactly("/") 
                      ? "bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02]" 
                      : "hover:bg-slate-50 text-slate-400 hover:text-primary"
                )}
              >
                <LayoutDashboard className={cn("w-5 h-5", isExactly("/") ? "text-white" : "text-primary/60")} />
                <span className="ml-3">Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4">Planificación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <Link href="/eventos">
                  <SidebarMenuButton 
                    isActive={isActive("/eventos") || isActive("/fiestas/nueva")}
                    className={cn(
                        "h-12 rounded-xl transition-all duration-300 font-bold text-xs",
                        (isActive("/eventos") || isActive("/fiestas/nueva")) 
                          ? "bg-slate-50 text-primary shadow-sm" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                    )}
                  >
                    <PartyPopper className="w-5 h-5" />
                    <span className="ml-2">Eventos Activos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/calendario">
                  <SidebarMenuButton 
                    isActive={isActive("/calendario")}
                    className={cn(
                        "h-12 rounded-xl transition-all duration-300 font-bold text-xs",
                        isActive("/calendario") ? "bg-slate-50 text-primary shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                    )}
                  >
                    <CalendarDays className="w-5 h-5" />
                    <span className="ml-2">Calendario</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4">Gestión Empresa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={(isActive("/empresa") && !isActive('/empresa/redes-sociales')) || isActive('/empleados') || isActive('/proveedores')}
                  isSubmenu
                  className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300"
                >
                  <Building2 className="w-5 h-5" />
                  <span className="ml-2">Administración</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-6 border-l-2 border-slate-50 space-y-2 mt-2">
                  <SidebarMenuSubItem>
                    <Link href="/empresa/servicios" asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/servicios")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Catálogo Maestro
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/menus" asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/menus")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Gastronomía
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/activos-fijos" asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/activos-fijos")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Activos Fijos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/insumos" asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/insumos")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Insumos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empleados" asChild>
                      <SidebarMenuSubButton isActive={isActive("/empleados")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Recursos Humanos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/proveedores" asChild>
                      <SidebarMenuSubButton isActive={isActive("/proveedores")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
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
                  className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="ml-2">Finanzas & Ventas</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-6 border-l-2 border-slate-50 space-y-2 mt-2">
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/crm" asChild>
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/crm")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter text-emerald-600">
                        CRM Prospectos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/admin/ventas" asChild>
                      <SidebarMenuSubButton isActive={isActive("/admin/ventas")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter text-emerald-700">
                        <KanbanSquare className="w-3.5 h-3.5 mr-1" />
                        Tablero Comercial
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/admin/finanzas" asChild>
                      <SidebarMenuSubButton isActive={isActive("/admin/finanzas")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter text-blue-700">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        Rentabilidad
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/crm/agenda" asChild>
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/crm/agenda")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Agenda Citas
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                   <SidebarMenuSubItem>
                    <Link href="/customers" asChild>
                      <SidebarMenuSubButton isActive={isActive("/customers")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Base Clientes
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/presupuestos/nuevo" asChild>
                      <SidebarMenuSubButton isActive={isActive("/presupuestos")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Presupuestos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/invoices" asChild>
                      <SidebarMenuSubButton isActive={isActive("/invoices")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Facturación
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/contabilidad/flujo-caja" asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/contabilidad/flujo-caja")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter text-blue-600">
                        Flujo de Caja
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/contabilidad/gastos" asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/contabilidad/gastos")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Gastos Empresa
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/fiestas-historicas" asChild>
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/fiestas-historicas")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Historial Base
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/analytics" asChild>
                      <SidebarMenuSubButton isActive={isActive("/analytics")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter text-primary">
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
          <SidebarGroupLabel className="px-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4">Herramientas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <Link href="/simulador-de-presupuesto">
                  <SidebarMenuButton isActive={isActive("/simulador-de-presupuesto")} className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300">
                    <Wand2 className="w-5 h-5 text-amber-500" />
                    <span className="ml-2">Simulador IA</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/redes-sociales">
                  <SidebarMenuButton isActive={isActive("/empresa/redes-sociales")} className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span className="ml-2">Marketing</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/compras">
                  <SidebarMenuButton isActive={isActive("/compras")} className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300">
                    <ShoppingCart className="w-5 h-5 text-slate-400" />
                    <span className="ml-2">Insumos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter className="p-6 space-y-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings">
              <SidebarMenuButton 
                isActive={isActive("/settings")}
                className={cn(
                    "h-14 rounded-2xl transition-all duration-500 font-black uppercase text-[10px] tracking-[0.2em]",
                    isActive("/settings") ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Settings className="w-5 h-5" />
                <span className="ml-3">Ajustes</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-50">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-200 select-none">
            © {new Date().getFullYear()} AK Producciones
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
