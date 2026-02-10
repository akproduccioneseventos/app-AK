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
} from "lucide-react";
import AppLogo from "./app-logo";

export function MainNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);
  const isExactly = (path: string) => pathname === path;

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <Link href="/" passHref>
          <div className="flex items-center gap-2 cursor-pointer">
            <AppLogo />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" passHref>
              <SidebarMenuButton isActive={isExactly("/")} tooltip="Menú Principal">
                <LayoutDashboard />
                Menú Principal
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Planificación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/eventos" passHref>
                  <SidebarMenuButton isActive={isActive("/eventos") || isActive("/fiestas/nueva")}>
                    <PartyPopper />
                    Planificador de Eventos
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/calendario" passHref>
                  <SidebarMenuButton isActive={isActive("/calendario")}>
                    <CalendarDays />
                    Calendario General
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={(isActive("/empresa") && !isActive('/empresa/redes-sociales')) || isActive('/empleados') || isActive('/proveedores')}
                  isSubmenu
                >
                  <Building2 />
                  Empresa
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/servicios" passHref asChild>
                      <SidebarMenuSubButton
                        isActive={isActive("/empresa/servicios")}
                      >
                        <Sparkles />
                        Servicios
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/menus" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empresa/menus")}>
                        <ChefHat />
                        Gastronomía
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/activos-fijos" passHref asChild>
                      <SidebarMenuSubButton
                        isActive={isActive("/empresa/activos-fijos")}
                      >
                        <Package />
                        Activos Fijos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empresa/insumos" passHref asChild>
                      <SidebarMenuSubButton
                        isActive={isActive("/empresa/insumos")}
                      >
                        <Package />
                        Insumos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/empleados" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/empleados")}>
                        <Users />
                        Personal
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/proveedores" passHref asChild>
                      <SidebarMenuSubButton
                        isActive={isActive("/proveedores")}
                      >
                        <Briefcase />
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
                    isActive("/customers")
                  }
                  isSubmenu
                >
                  <BarChart3 />
                  Contabilidad
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <Link href="/contabilidad/crm" passHref asChild>
                      <SidebarMenuSubButton
                        isActive={isActive("/contabilidad/crm")}
                      >
                        <KanbanSquare />
                        CRM
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                   <SidebarMenuSubItem>
                    <Link href="/customers" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/customers")}>
                        <Users />
                        Clientes
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/presupuestos/nuevo" passHref asChild>
                      <SidebarMenuSubButton
                        isActive={isActive("/presupuestos")}
                      >
                        <ListChecks />
                        Presupuestos
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <Link href="/invoices" passHref asChild>
                      <SidebarMenuSubButton isActive={isActive("/invoices")}>
                        <FileText />
                        Facturas
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/simulador-de-presupuesto" passHref>
                  <SidebarMenuButton isActive={isActive("/simulador-de-presupuesto")}>
                    <Wand2 />
                    Simulador
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/empresa/redes-sociales" passHref>
                  <SidebarMenuButton isActive={isActive("/empresa/redes-sociales")}>
                    <Sparkles />
                    Redes Sociales
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/compras" passHref>
                  <SidebarMenuButton isActive={isActive("/compras")}>
                    <ShoppingCart />
                    Compras
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" passHref>
              <SidebarMenuButton isActive={isActive("/settings")}>
                <Settings />
                Configuración
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
