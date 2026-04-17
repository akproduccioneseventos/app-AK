
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ContactRound, Briefcase, BarChart3, Building2, Package, Sparkles, ChefHat, Globe, Layout, MapPin, MonitorPlay, Camera, ExternalLink, BookOpen } from 'lucide-react';

interface HubItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  actionLabel: string;
}

const CANVA_CATALOGS = [
  {
    emoji: '🍽️',
    title: 'Catálogo Catering',
    description: 'Menús, platos y opciones gastronómicas para todo tipo de eventos.',
    href: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering',
  },
  {
    emoji: '💍',
    title: 'Catálogo Bodas',
    description: 'Servicio completo para bodas: decoración, catering, fotografía y más.',
    href: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-bodas',
  },
  {
    emoji: '👑',
    title: 'Catálogo XV Años',
    description: 'Todo lo que necesitás para una fiesta de 15 años inolvidable.',
    href: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-xv-a-os-sitio-web',
  },
  {
    emoji: '🎉',
    title: 'Catálogo Fiestas',
    description: 'Servicio completo para fiestas en general: cumpleaños, celebraciones y más.',
    href: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web',
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
    title: 'Activos Fijos',
    description: 'Inventario de equipos y bienes de la empresa. Control de disponibilidad multi-evento y capital total.',
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
    title: 'Galería Pública',
    description: 'Gestiona las fotos y videos que se muestran en tu página web pública. Subí fotos, agregá links de YouTube y filtrá por servicio.',
    href: '/empresa/galeria',
    icon: Camera,
    actionLabel: 'Gestionar Galería',
  },
  {
    title: 'Editor de Landing Page',
    description: 'Editá textos, colores, imágenes y estadísticas de tu página pública. Cambios se ven en tiempo real en akproducciones.uy/landing.',
    href: '/empresa/landing-editor',
    icon: Layout,
    actionLabel: 'Editar Landing',
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

      {/* Catálogos Públicos Canva */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold tracking-tight font-headline">Catálogos Públicos Canva</h2>
        </div>
        <p className="text-sm text-muted-foreground">Compartí estos catálogos con tus clientes para que puedan ver todos tus servicios.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CANVA_CATALOGS.map((cat) => (
            <Card key={cat.title} className="flex flex-col shadow hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.emoji}</span>
                  <CardTitle className="text-base font-headline">{cat.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </CardContent>
              <CardFooter className="pt-2">
                <a href={cat.href} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver Catálogo
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Catálogo Digital Interactivo */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-indigo-500" />
          <h2 className="text-xl font-bold tracking-tight font-headline">Catálogo Digital Interactivo</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Presentaciones paso a paso por tipo de fiesta. Al finalizar, convertís la selección en un presupuesto manual real.
        </p>
        <Link href="/catalogo">
          <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow">
            <BookOpen className="w-4 h-4" />
            Abrir catálogo digital
          </Button>
        </Link>
      </div>
    </div>
  );
}
