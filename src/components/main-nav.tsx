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
  Printer
} from "lucide-react";
import AppLogo from "./app-logo";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);
  const isExactly = (path: string) => pathname === path;

  return (
    <Sidebar className="border-r border-slate-200 bg-white shadow-xl">
      <SidebarHeader className="p-6">
        <Link href="/" passHref>
          <div className="flex items-center justify-center gap-2 cursor-pointer py-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
            <div className="group-hover:scale-110 transition-transform duration-500">
                <AppLogo />
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-4 gap-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" passHref>
              <SidebarMenuButton 
                isActive={isExactly("/")} 
                tooltip="Menú Principal"
                className={cn(
                    "h-12 rounded-xl transition-all duration-300 font-bold",
                    isExactly("/") ? "bg-primary text-white shadow-lg shadow-primary/30" : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <LayoutDashboard className={cn("w-5 h-5", isExactly("/") ? "text-white" : "text-primary")} />
                <span className="ml-2">Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Planificación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <Link href="/eventos" passHref>
                  <SidebarMenuButton 
                    isActive={isActive("/eventos") || isActive("/fiestas/nueva")}
                    className={cn(
                        "h-11 rounded-xl transition-all font-semibold",
                        (isActive("/eventos") || isActive("/fiestas/nueva")) ? "bg-slate-100 text-primary" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <PartyPopper className="w-5 h-5 text-primary" />
                    <span>Eventos</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/calendario" passHref>
                  <SidebarMenuButton 
                    isActive={isActive("/calendario")}
                    className={cn(
                        "h-11 rounded-xl transition-all font-semibold",
                        isActive("/calendario") ? "bg-slate-100 text-primary" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <span>Calendario</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Empresa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={(isActive("/empresa") && !isActive('/empresa/redes-sociales')) || isActive('/empleados') || isActive('/proveedores')}
                  isSubmenu
                  className="h-11 rounded-xl font-semibold text-slate-600"
                >
                  <Building2 className="w-5 h-5 text-primary" />
                  <span>Gestión</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-4 border-l-2 border-slate-100 space-y-1 mt-1">
                  <SidebarMenuSubItem>
                    <Link href="/empresa/servicios" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/servicios")} className="rounded-lg">
                        <span>Catálogo</span>
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/menus" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/menus")} className="rounded-lg">
                        <span>Gastronomía</span>
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empleados" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empleados")} className="rounded-lg">
                        <span>Personal</span>
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/proveedores" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/proveedores")} className="rounded-lg">
                        <span>Proveedores</span>
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
                    isActive("/customers")
                  }
                  isSubmenu
                  className="h-11 rounded-xl font-semibold text-slate-600"
                >
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Finanzas</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-4 border-l-2 border-slate-100 space-y-1 mt-1">
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/crm" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/contabilidad/crm")} className="rounded-lg">
                        <span>CRM</span>
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                   <SidebarMenuSubItem>
                    <Link href="/customers" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/customers")} className="rounded-lg">
                        <span>Clientes</span>
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/presupuestos/nuevo" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/presupuestos")} className="rounded-lg">
                        <span>Presupuestos</span>
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/invoices" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/invoices")} className="rounded-lg">
                        <span>Facturas</span>
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Herramientas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <Link href="/simulador-de-presupuesto" passHref>
                  <SidebarMenuButton isActive={isActive("/simulador-de-presupuesto")} className="h-11 rounded-xl font-semibold text-slate-600">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <span>Simulador</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/redes-sociales" passHref>
                  <SidebarMenuButton isActive={isActive("/empresa/redes-sociales")} className="h-11 rounded-xl font-semibold text-slate-600">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Redes Sociales</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/compras" passHref>
                  <SidebarMenuButton isActive={isActive("/compras")} className="h-11 rounded-xl font-semibold text-slate-600">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <span>Compras</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter className="p-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" passHref>
              <SidebarMenuButton 
                isActive={isActive("/settings")}
                className={cn(
                    "h-12 rounded-xl transition-all font-bold",
                    isActive("/settings") ? "bg-slate-100 text-primary" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Settings className="w-5 h-5" />
                <span>Ajustes</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}