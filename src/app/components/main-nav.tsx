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
  Wallet,
  Calculator,
  PlusCircle,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLogo from "./app-logo";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);
  const isExactly = (path: string) => pathname === path;

  return (
    <Sidebar className="border-r border-slate-100 bg-white/95 backdrop-blur-xl shadow-[10px_0_40px_rgba(0,0,0,0.02)]">
      <SidebarHeader className="p-8">
        <Link href="/" passHref>
          <div className="flex items-center justify-center gap-2 cursor-pointer py-6 bg-slate-50/50 rounded-3xl border border-slate-100/50 hover:border-primary/20 hover:bg-white transition-all duration-500 group shadow-inner">
            <div className="group-hover:scale-110 transition-transform duration-700 ease-out">
                <AppLogo />
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-6 gap-8 scrollbar-hide">
        {/* Quick Access Buttons */}
        <div className="flex gap-2">
          <Link href="/fiestas/nueva" passHref className="flex-1">
            <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-red-500 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-primary/20 font-bold text-[10px] uppercase tracking-wider transition-all duration-300 hover:scale-[1.02]">
              <PartyPopper className="w-4 h-4 mr-1.5" />
              Nueva Fiesta
            </Button>
          </Link>
          <Link href="/presupuestos/nuevo" passHref className="flex-1">
            <Button variant="outline" className="w-full h-11 rounded-xl border-2 border-primary/30 hover:border-primary hover:bg-primary/5 font-bold text-[10px] uppercase tracking-wider text-primary transition-all duration-300 hover:scale-[1.02]">
              <CircleDollarSign className="w-4 h-4 mr-1.5" />
              Presupuesto
            </Button>
          </Link>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" passHref>
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
                <Link href="/eventos" passHref>
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
                <Link href="/calendario" passHref>
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
                  isActive={(isActive("/empresa") && !isActive('/empresa/redes-sociales') && !isActive('/empresa/contabilidad')) || isActive('/empleados') || isActive('/proveedores')}
                  isSubmenu
                  className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300"
                >
                  <Building2 className="w-5 h-5" />
                  <span className="ml-2">Administración</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-6 border-l-2 border-slate-50 space-y-2 mt-2">
                  <SidebarMenuSubItem>
                    <Link href="/empresa/servicios" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/servicios")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Catálogo Maestro
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/menus" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/menus")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Gastronomía
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/activos-fijos" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/activos-fijos")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Activos Fijos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/insumos" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/insumos")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Insumos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empleados" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empleados")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Recursos Humanos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/proveedores" passHref asChild>
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
                    isActive("/empresa/contabilidad")
                  }
                  isSubmenu
                  className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="ml-2">Finanzas & Ventas</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-6 border-l-2 border-slate-50 space-y-2 mt-2">
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/crm" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/crm")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter text-emerald-600">
                        CRM Prospectos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/crm/agenda" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/crm/agenda")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Agenda Citas
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                   <SidebarMenuSubItem>
                    <Link href="/customers" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/customers")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Base Clientes
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/presupuestos/nuevo" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/presupuestos")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Presupuestos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/invoices" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/invoices")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Facturación
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/contabilidad/flujo-caja" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/contabilidad/flujo-caja")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter text-blue-600">
                        Flujo de Caja
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/contabilidad/gastos" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/contabilidad/gastos")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Gastos Empresa
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/fiestas-historicas" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/fiestas-historicas")} className="rounded-lg h-9 font-semibold text-[11px] uppercase tracking-tighter">
                        Historial Base
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
                <Link href="/simulador-de-presupuesto" passHref>
                  <SidebarMenuButton isActive={isActive("/simulador-de-presupuesto")} className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300">
                    <Wand2 className="w-5 h-5 text-amber-500" />
                    <span className="ml-2">Simulador IA</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/redes-sociales" passHref>
                  <SidebarMenuButton isActive={isActive("/empresa/redes-sociales")} className="h-12 rounded-xl font-bold text-xs text-slate-500 hover:text-primary transition-all duration-300">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span className="ml-2">Marketing</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/compras" passHref>
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
      <SidebarFooter className="p-8">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" passHref>
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
      </SidebarFooter>
    </Sidebar>
  );
}
