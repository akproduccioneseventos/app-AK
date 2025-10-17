
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, KanbanSquare, ListChecks, FileText, TrendingUp, BarChart3 } from 'lucide-react';

const contabilidadItems = [
  {
    title: 'Gestión de Prospectos (CRM)',
    description: 'Sigue el viaje de tus clientes potenciales desde el primer contacto hasta el cierre del contrato.',
    href: '/contabilidad/crm',
    icon: KanbanSquare,
    actionLabel: 'Ir al CRM'
  },
  {
    title: 'Central de Presupuestos',
    description: 'Crea, edita y gestiona todos los presupuestos para tus clientes.',
    href: '/presupuestos/nuevo',
    icon: ListChecks,
    actionLabel: 'Gestionar Presupuestos'
  },
  {
    title: 'Gestión de Facturas',
    description: 'Emite facturas, registra pagos y lleva un control de las cuentas por cobrar.',
    href: '/invoices',
    icon: FileText,
    actionLabel: 'Gestionar Facturas'
  },
  {
    title: 'Reporte de Ganancias y Pérdidas',
    description: 'Analiza la rentabilidad de tus eventos y del negocio en general en un rango de fechas.',
    href: '/empresa/contabilidad/reportes',
    icon: TrendingUp,
    actionLabel: 'Ver Reporte'
  },
];

export default function ContabilidadPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Panel Contable y Financiero
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
        Aquí puedes gestionar todos los aspectos financieros y de ventas de tu negocio, desde los prospectos iniciales hasta el análisis de rentabilidad.
      </CardDescription>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contabilidadItems.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-lg mb-1">{item.title}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              {/* Contenido adicional si es necesario */}
            </CardContent>
            <CardFooter className="pt-3">
              <Link href={item.href} passHref className="w-full">
                <Button variant="default" className="w-full">
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
