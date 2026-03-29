'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Bell, ShieldCheck, Settings as SettingsIcon, BarChart3, Link as LinkIcon, Star, HardDriveDownload, Wand2, UserCog, Palette, TrendingUp, Ticket } from 'lucide-react';

const settingsCards = [
   {
    title: "Información de la Empresa",
    description: "Actualiza los datos fiscales, de contacto y el logo de tu empresa.",
    href: "/settings/company", 
    icon: Building,
    buttonLabel: "Gestionar Datos"
  },
  {
    title: "Gestión de Plantillas",
    description: "Crea y administra plantillas reutilizables para tareas, diseños, invitaciones y más.",
    href: "/settings/templates",
    icon: Palette,
    buttonLabel: "Gestionar Plantillas"
  },
  {
    title: "Configuración de Presupuestos y Simulador",
    description: "Ajusta las opciones de presentación, mensajes, características de venta y los paquetes automáticos para tus presupuestos manuales y el simulador.",
    href: "/settings/budget-display",
    icon: Wand2,
    buttonLabel: "Gestionar Presupuestos"
  },
   {
    title: "Cuentas Sociales Vinculadas",
    description: "Conecta tus redes sociales y gestiona los enlaces de tus perfiles.",
    href: "/settings/social-connections",
    icon: LinkIcon,
    buttonLabel: "Gestionar Vínculos"
  },
  {
    title: "Accesos para Colaboradores",
    description: "Crea y gestiona enlaces de acceso para tu equipo (secretaria, DJ, etc.).",
    href: "/settings/accesos-personal",
    icon: UserCog,
    buttonLabel: "Gestionar Accesos"
  },
  {
    title: "Notificaciones",
    description: "Configura cómo y cuándo recibir alertas y avisos.",
    href: "/settings/notifications", 
    icon: Bell,
    buttonLabel: "Ajustar Alertas"
  },
  {
    title: "Seguridad y Cuenta",
    description: "Gestiona tu contraseña y opciones de seguridad.",
    href: "/settings/account", 
    icon: ShieldCheck,
    buttonLabel: "Gestionar Cuenta"
  },
  {
    title: "Ajuste Anual de Precios",
    description: "Aplica ajustes porcentuales masivos a precios y costos de tu catálogo de servicios. Historial y reversión incluidos.",
    href: "/settings/ajuste-precios",
    icon: TrendingUp,
    buttonLabel: "Gestionar Ajustes"
  },
  {
    title: "Cupones y Descuentos",
    description: "Crea cupones promocionales con código, vigencia y límite de usos. Aplícalos en presupuestos para ofrecer descuentos.",
    href: "/settings/cupones",
    icon: Ticket,
    buttonLabel: "Gestionar Cupones"
  },
  {
    title: "Backup y Restauración",
    description: "Genera y descarga un respaldo completo de todos los datos de tu aplicación.",
    href: "/settings/backup",
    icon: HardDriveDownload,
    buttonLabel: "Gestionar Backups"
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-primary"/>
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Configuración General
            </h1>
            <p className="text-muted-foreground">
                Administra las preferencias de la aplicación, apariencia de documentos y detalles de tu cuenta.
            </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                    <item.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                  <CardTitle className="font-headline text-lg mb-1">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {item.description}
              </p>
            </CardContent>
            <CardFooter className="pt-3">
                 <Link href={item.href} className="w-full">
                    <Button variant="secondary" className="w-full">
                        {item.buttonLabel || "Gestionar"}
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
