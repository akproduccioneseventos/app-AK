
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ContactRound, Briefcase, BarChart3, Building2, Package, Sparkles, ChefHat, Globe, MapPin, MonitorPlay, ExternalLink } from 'lucide-react';

interface HubItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  actionLabel: string;
}

interface CanvaCatalogo {
  key: string;
  emoji: string;
  titulo: string;
  descripcion: string;
  url: string;
}

const canvaCatalogos: CanvaCatalogo[] = [
  {
    key: 'catering',
    emoji: '🍽️',
    titulo: 'Catering',
    descripcion: 'Menús, platos y opciones gastronómicas para tus eventos.',
    url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering',
  },
  {
    key: 'bodas',
    emoji: '💍',
    titulo: 'Bodas',
    descripcion: 'Servicio completo para bodas: decoración, catering, música y más.',
    url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-bodas',
  },
  {
    key: 'xvAnos',
    emoji: '👑',
    titulo: 'XV Años',
    descripcion: 'Todo lo que necesitás para una quinceañera inolvidable.',
    url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-xv-a-os-sitio-web',
  },
  {
    key: 'fiestasGeneral',
    emoji: '🎉',
    titulo: 'Fiestas General',
    descripcion: 'Servicios completos para todo tipo de fiestas y celebraciones.',
    url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web',
  },
];

const empresaHubItems: HubItem[] = [
  {
    title: 'Panel Contable y Financiero',
    description: 'Accede al CRM, presupuestos, facturas y reportes.',
    href: '/empresa/contabilidad',
    icon: BarChart3,
    actionLabel: 'Ir al Panel',
  },
  {
    title: 'Gestor de Salones',
    description: 'Administrá los salones con los que trabajás. Seleccioná un salón en cada evento para sincronizar dirección y Google Maps automáticamente.',
    href: '/empresa/salones',
    icon: MapPin,
    actionLabel: 'Gestionar Salones',
  },
  {
    title: 'Catálogo de Servicios',
    description: 'Define y gestiona los servicios que vendes en tus presupuestos.',
    href: '/empresa/servicios',
    icon: Sparkles,
    actionLabel: 'Gestionar Servicios',
  },
  {
    title: 'Planificador Gastronómico Maestro',
    description: 'Crea plantillas de menús, platos, gestiona insumos y calcula costos.',
    href: '/empresa/menus',
    icon: ChefHat,
    actionLabel: 'Gestionar Plantillas',
  },
  {
    title: 'Catálogo de Activos Fijos',
    description: 'Gestiona tu inventario de activos reutilizables (mobiliario, equipo, etc.).',
    href: '/empresa/activos-fijos',
    icon: Package,
    actionLabel: 'Gestionar Activos',
  },
  {
    title: 'Gestión de Empleados',
    description: 'Administra la información, roles y sueldos de tu personal.',
    href: '/empleados',
    icon: ContactRound,
    actionLabel: 'Ir a Empleados',
  },
  {
    title: 'Proveedores',
    description: 'Mantén un registro de tus proveedores y sus servicios.',
    href: '/proveedores',
    icon: Briefcase,
    actionLabel: 'Ir a Proveedores',
  },
  {
    title: 'Redes Sociales',
    description: 'Planifica contenido para tus redes sociales y usa el asistente de marketing IA.',
    href: '/empresa/redes-sociales',
    icon: Sparkles,
    actionLabel: 'Gestionar Contenido',
  },
  {
    title: 'Presentación LED para Vendedores',
    description: 'Herramienta de venta presencial. Mostrá tus servicios uno a uno en pantalla grande/LED/tablet. Ideal para reuniones con clientes potenciales.',
    href: '/presentacion-led',
    icon: MonitorPlay,
    actionLabel: 'Abrir Presentación',
  },
  {
    title: 'Página Pública & Landing Pages',
    description: 'Mirá y compartí tu landing page pública. Úsala para mostrar tu catálogo de servicios a potenciales clientes.',
    href: '/landing',
    icon: Globe,
    actionLabel: 'Ver Página Pública',
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
        <Link href="/">
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
            <CardFooter className="pt-2">
              <Link href={item.href} className="w-full">
                <Button variant="secondary" className="w-full">
                  {item.actionLabel}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Catálogos Canva */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight font-headline">Catálogos Públicos Canva</h2>
        </div>
        <p className="text-sm text-muted-foreground">Acceso rápido a los catálogos públicos de servicios. Compartí estos links con tus clientes.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {canvaCatalogos.map(cat => (
            <Card key={cat.key} className="shadow hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{cat.emoji}</span> {cat.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-xs text-muted-foreground line-clamp-2">{cat.descripcion}</p>
              </CardContent>
              <CardFooter>
                <a href={cat.url} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Ver Catálogo
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
