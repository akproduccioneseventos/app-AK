
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ContactRound, Briefcase, CircleDollarSign, Building2, Package } from 'lucide-react'; // Cambiado Sparkles por Package

interface HubItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  actionLabel: string;
}

const empresaHubItems: HubItem[] = [
  {
    title: 'Gestión de Empleados',
    description: 'Administra la información, roles y sueldos de tu personal.',
    href: '/empleados',
    icon: ContactRound,
    actionLabel: 'Ir a Empleados',
  },
  {
    title: 'Gestión de Proveedores',
    description: 'Mantén un registro de tus proveedores y sus servicios.',
    href: '/proveedores',
    icon: Briefcase,
    actionLabel: 'Ir a Proveedores',
  },
  {
    title: 'Inventario General y Valor de Activos', // Actualizado
    description: 'Define y organiza los ítems de tu inventario y consulta su valor.', // Actualizado
    href: '/empresa/todos-los-servicios', // Ruta se mantiene, pero el contenido cambia
    icon: Package, // Cambiado
    actionLabel: 'Ver Inventario', // Actualizado
  },
  {
    title: 'Contabilidad',
    description: 'Accede a presupuestos, facturas, pagos y clientes.',
    href: '/empresa/contabilidad',
    icon: CircleDollarSign,
    actionLabel: 'Ir a Contabilidad',
  },
];

export default function EmpresaHubPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Gestión de la Empresa
            </h1>
        </div>
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú Principal
          </Button>
        </Link>
      </div>
      <CardDescription className="text-lg">
        Desde aquí puedes acceder a todas las áreas administrativas y de gestión de tu empresa.
      </CardDescription>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresaHubItems.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-lg mb-1">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
            </CardContent>
            <CardContent className="pt-2">
              <Link href={item.href} passHref className="w-full">
                <Button variant="default" className="w-full">
                  {item.actionLabel}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
