
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, FileText, KanbanSquare, ListChecks, TrendingUp, Wand2, Settings as SettingsIcon } from 'lucide-react';

const hubItems = [
  {
    title: 'Gestión de Prospectos (CRM)',
    description: 'Visualiza y gestiona tus prospectos en el tablero Kanban.',
    href: '/contabilidad/crm',
    icon: KanbanSquare,
    actionLabel: 'Ir al CRM',
  },
  {
    title: 'Central de Presupuestos',
    description: 'Crea nuevos presupuestos y gestiona los existentes.',
    href: '/presupuestos/nuevo',
    icon: ListChecks,
    actionLabel: 'Gestionar Presupuestos',
  },
  {
    title: 'Gestión de Facturas',
    description: 'Administra tus facturas, registra pagos y haz seguimiento.',
    href: '/invoices',
    icon: FileText,
    actionLabel: 'Ir a Facturas',
  },
  {
    title: 'Reporte de Ganancias y Pérdidas',
    description: 'Analiza los resultados financieros de tus eventos.',
    href: '/empresa/contabilidad/reportes',
    icon: TrendingUp,
    actionLabel: 'Ver Reporte',
  },
  {
    title: 'Simulador de Presupuesto (Vista Cliente)',
    description: 'Accede a la herramienta que usan tus clientes para obtener un presupuesto estimado.',
    href: '/simulador-de-presupuesto',
    icon: Wand2,
    actionLabel: 'Abrir Simulador',
  },
  {
    title: 'Configuración del Simulador',
    description: 'Ajusta los paquetes, menús y descuentos disponibles para los clientes.',
    href: '/settings/budget-display',
    icon: SettingsIcon,
    actionLabel: 'Configurar',
  },
];

export default function ContabilidadHubPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Panel Contable y Financiero
          </h1>
        </div>
        <Link href="/empresa" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Empresa
          </Button>
        </Link>
      </div>
      <CardDescription className="text-lg">
        Tu centro de control para todas las operaciones financieras y de ventas.
      </CardDescription>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hubItems.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-lg mb-1">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            </CardContent>
            <CardFooter className="pt-3">
              <Link href={item.href} passHref className="w-full">
                <Button className="w-full">
                  {item.actionLabel}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
