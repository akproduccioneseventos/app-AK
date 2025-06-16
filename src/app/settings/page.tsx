
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Building, Bell, ShieldCheck, Settings as SettingsIcon, FileText } from 'lucide-react';

const settingsCards = [
  {
    title: "Personalizar Plantilla Documentos",
    description: "Ajusta logo y colores para facturas y presupuestos.",
    href: "/settings/templates",
    icon: Palette,
    buttonLabel: "Diseño Documentos"
  },
  {
    title: "Configuración de Presupuestos",
    description: "Define qué elementos mostrar al imprimir o compartir.",
    href: "/settings/budget-display",
    icon: FileText, // Changed Icon for budget specific settings
    buttonLabel: "Contenido Presupuesto"
  },
  {
    title: "Información de la Empresa",
    description: "Actualiza los datos de tu empresa para los documentos.",
    href: "/settings/company", 
    icon: Building,
    buttonLabel: "Datos Empresa"
  },
  {
    title: "Notificaciones",
    description: "Configura cómo y cuándo recibir alertas y avisos.",
    href: "/settings/notifications", 
    icon: Bell,
    buttonLabel: "Alertas"
  },
  {
    title: "Seguridad y Cuenta",
    description: "Gestiona tu contraseña y opciones de seguridad.",
    href: "/settings/account", 
    icon: ShieldCheck,
    buttonLabel: "Seguridad Cuenta"
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
