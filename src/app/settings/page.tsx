
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Bell, ShieldCheck, Settings as SettingsIcon, FileText, BrainCircuit, Link as LinkIcon, Star, HardDriveDownload, PartyPopper, Sparkles as SparklesIcon } from 'lucide-react';

const settingsCards = [
   {
    title: "Apariencia de Documentos",
    description: "Personaliza el logo y colores de tus facturas y presupuestos.",
    href: "/settings/templates", 
    icon: FileText,
    buttonLabel: "Personalizar Plantillas"
  },
  {
    title: "Información de la Empresa",
    description: "Actualiza los datos fiscales y de contacto de tu empresa.",
    href: "/settings/company", 
    icon: Building,
    buttonLabel: "Gestionar Datos"
  },
   {
    title: "Cuentas Sociales Vinculadas",
    description: "Conecta tus redes sociales y gestiona los enlaces de tus perfiles.",
    href: "/settings/social-connections",
    icon: LinkIcon,
    buttonLabel: "Gestionar Vínculos"
  },
  {
    title: "Feedback y Testimonios",
    description: "Gestiona las encuestas de clientes y genera testimonios con IA.",
    href: "/settings/feedback",
    icon: Star,
    buttonLabel: "Gestionar Feedback"
  },
    {
    title: "Análisis de Plan de Evento con IA",
    description: "Revisa la completitud y coherencia de tu planificación actual.",
    href: "/admin/aaiff-fiesta",
    icon: PartyPopper,
    buttonLabel: "Analizar Fiesta Actual"
  },
   {
    title: "Análisis de Código con IA",
    description: "Permite que la IA analice la app en busca de mejoras y errores.",
    href: "/admin/aaiff",
    icon: BrainCircuit,
    buttonLabel: "Analizar Código"
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
    title: "Backup y Restauración",
    description: "Genera y descarga un respaldo completo de todos los datos de tu aplicación.",
    href: "/settings/backup",
    icon: HardDriveDownload,
    buttonLabel: "Gestionar Backups"
  }
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
            Configuración General
        </h1>
      </div>
      <p className="text-muted-foreground">
        Administra las preferencias de la aplicación, apariencia de documentos y detalles de tu cuenta.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-center justify-between pb-3 space-y-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                    <item.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold font-headline">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            </CardContent>
            <CardFooter className="pt-3">
                 <Link href={item.href} passHref className="w-full">
                    <Button variant="outline" className="w-full">
                        Ir a {item.buttonLabel}
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
