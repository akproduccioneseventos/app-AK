
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Building, Bell, ShieldCheck, Settings as SettingsIcon } from 'lucide-react'; // Added SettingsIcon

const settingsCards = [
  {
    title: "Personalizar Plantillas",
    description: "Ajusta el logo, colores y diseño de tus facturas y presupuestos.",
    href: "/settings/templates",
    icon: Palette,
    buttonLabel: "Diseño Documentos"
  },
  {
    title: "Configuración de Presupuestos",
    description: "Define qué elementos mostrar al imprimir o compartir presupuestos.",
    href: "/settings/budget-display",
    icon: SettingsIcon, // Using SettingsIcon for general settings
    buttonLabel: "Contenido Presupuesto"
  },
  {
    title: "Información de la Empresa",
    description: "Actualiza los datos de tu empresa para los documentos.",
    href: "/settings/company", 
    icon: Building,
    buttonLabel: "Empresa"
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
    description: "Gestiona tu contraseña y opciones de seguridad de la cuenta.",
    href: "/settings/account", 
    icon: ShieldCheck,
    buttonLabel: "Cuenta"
  }
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Configuración General
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((item) => (
          <Card key={item.title} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
              <CardTitle className="text-lg font-medium font-headline">{item.title}</CardTitle>
              <item.icon className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
            <CardContent>
                 <Link href={item.href} passHref>
                    <Button variant="outline" className="w-full">
                        Ir a {item.buttonLabel}
                    </Button>
                </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
