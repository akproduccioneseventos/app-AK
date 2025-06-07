import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Building, Bell, ShieldCheck } from 'lucide-react';

const settingsCards = [
  {
    title: "Personalizar Plantillas",
    description: "Ajusta el logo, colores y diseño de tus facturas.",
    href: "/settings/templates",
    icon: Palette,
  },
  {
    title: "Información de la Empresa",
    description: "Actualiza los datos de tu empresa para las facturas.",
    href: "/settings/company", // Placeholder link
    icon: Building,
  },
  {
    title: "Notificaciones",
    description: "Configura cómo y cuándo recibir notificaciones.",
    href: "/settings/notifications", // Placeholder link
    icon: Bell,
  },
  {
    title: "Seguridad y Cuenta",
    description: "Gestiona tu contraseña y opciones de seguridad.",
    href: "/settings/account", // Placeholder link
    icon: ShieldCheck,
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
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-lg font-medium font-headline">{item.title}</CardTitle>
              <item.icon className="w-6 h-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
            <CardContent>
                 <Link href={item.href} passHref>
                    <Button variant="outline" className="w-full">
                        Ir a {item.title.split(' ')[0]}
                    </Button>
                </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
