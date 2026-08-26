'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ContactRound,
  Briefcase,
  BarChart3,
  Building2,
  Package,
  Sparkles,
  ChefHat,
  Globe,
  Layout,
  MapPin,
  MonitorPlay,
  Camera,
  ExternalLink,
  BookOpen,
  GlassWater,
  Gift,
  ShoppingCart,
  Send,
  Target,
  FileText,
  Users,
  Wallet,
  Wand2,
  TrendingUp,
  ArrowRight,
  Layers,
  DollarSign,
} from 'lucide-react';

interface HubItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  external?: boolean;
}

const VENDER_ITEMS: HubItem[] = [
  {
    title: 'Prospectos y CRM',
    description: 'Pipeline de seguimiento comercial, nuevos leads y estado de cada contacto.',
    href: '/contabilidad/crm',
    icon: ContactRound,
    color: 'text-violet-600 bg-violet-50',
    badge: 'Comercial',
  },
  {
    title: 'Central de Presupuestos',
    description: 'Crear, consultar, editar y enviar cotizaciones a clientes con control de vencimiento.',
    href: '/presupuestos/nuevo',
    icon: FileText,
    color: 'text-indigo-600 bg-indigo-50',
    badge: 'Cotizaciones',
  },
  {
    title: 'Directorio de Clientes',
    description: 'Base completa de clientes, contactos agendados e historial de contrataciones.',
    href: '/customers',
    icon: Users,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'Simulador Inteligente IA',
    description: 'Cotizador automático y asistente comercial para generar propuestas en segundos.',
    href: '/simulador-ak',
    icon: Wand2,
    color: 'text-fuchsia-600 bg-fuchsia-50',
    badge: 'IA',
  },
  {
    title: 'CRM de Cumpleaños y Oportunidades',
    description: 'Convierte invitados en futuros clientes y programa campañas por fecha especial.',
    href: '/empresa/crm',
    icon: Gift,
    color: 'text-pink-600 bg-pink-50',
  },
];

const PLATA_ITEMS: HubItem[] = [
  {
    title: 'Cobros y Pagos Rápidos',
    description: 'Registrar cobros, señas, cuotas y emitir recibos al instante sin dar vueltas.',
    href: '/pagos-rapidos',
    icon: Wallet,
    color: 'text-emerald-600 bg-emerald-50',
    badge: 'Caja',
  },
  {
    title: 'Panel Contable y Financiero',
    description: 'Control de ingresos, egresos, rentabilidad neta por evento y balances.',
    href: '/empresa/contabilidad',
    icon: BarChart3,
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    title: 'Facturación',
    description: 'Emisión, control y registro de facturas emitidas por la empresa.',
    href: '/invoices',
    icon: DollarSign,
    color: 'text-teal-600 bg-teal-50',
  },
  {
    title: 'Flujo de Caja',
    description: 'Entradas y salidas proyectadas para anticipar compromisos y liquidez.',
    href: '/empresa/contabilidad/flujo-caja',
    icon: TrendingUp,
    color: 'text-cyan-600 bg-cyan-50',
  },
  {
    title: 'Métricas del Negocio',
    description: 'Panel gerencial con evolución mensual de ventas, ticket promedio y cobros.',
    href: '/empresa/dashboard',
    icon: BarChart3,
    color: 'text-blue-600 bg-blue-50',
  },
];

const RECURSOS_ITEMS: HubItem[] = [
  {
    title: 'Planificador Gastronómico Maestro',
    description: 'Plantillas de menús, platos, recetas, insumos requeridos y costos de cocina.',
    href: '/empresa/menus',
    icon: ChefHat,
    color: 'text-amber-600 bg-amber-50',
    badge: 'Cocina',
  },
  {
    title: 'Barra de Tragos (Master)',
    description: 'Catálogo de coctelería, recetas, carta de tragos y cálculo de botellas.',
    href: '/empresa/menus/tragos',
    icon: GlassWater,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    title: 'Lista de Compras e Insumos',
    description: 'Compras pendientes, stock disponible y necesidades por evento.',
    href: '/compras',
    icon: ShoppingCart,
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    title: 'Gestor de Salones',
    description: 'Salones asociados, capacidades, mapas y convenios (incluyendo Club Uruguay).',
    href: '/empresa/salones',
    icon: MapPin,
    color: 'text-red-600 bg-red-50',
  },
  {
    title: 'Catálogo de Servicios',
    description: 'Precios, descripciones y configuraciones de todos los servicios ofrecidos.',
    href: '/empresa/servicios',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    title: 'Directorio de Proveedores',
    description: 'Proveedores externos, servicios tercerizados y datos de contacto.',
    href: '/proveedores',
    icon: Briefcase,
    color: 'text-slate-600 bg-slate-100',
  },
  {
    title: 'Gestión de Empleados',
    description: 'Nómina de personal, roles asignados, sueldos por evento y asistencias.',
    href: '/empleados',
    icon: ContactRound,
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    title: 'Activos Fijos y Equipamiento',
    description: 'Inventario de equipos de sonido, luces, cámaras y mobiliario propio.',
    href: '/empresa/activos-fijos',
    icon: Package,
    color: 'text-slate-600 bg-slate-100',
  },
];

const MARKETING_ITEMS: HubItem[] = [
  {
    title: 'Módulo Central de Marketing',
    description: 'Hub unificado con las 10 herramientas de difusión, redes, WhatsApp y conversiones.',
    href: '/empresa/marketing',
    icon: Target,
    color: 'text-rose-600 bg-rose-50',
    badge: 'Central',
  },
  {
    title: 'Redes Sociales y Publicador',
    description: 'Planificador de publicaciones para Instagram, TikTok y Facebook con IA.',
    href: '/empresa/redes-sociales',
    icon: Camera,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    title: 'WhatsApp Comercial del Día',
    description: 'Bandeja de mensajes preparados con contexto para enviar con 1 toque.',
    href: '/contabilidad/crm/outbox',
    icon: Send,
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    title: 'Rendimiento de Anuncios',
    description: 'Métricas y retorno de inversión de campañas en Meta Ads y Google Ads.',
    href: '/contabilidad/crm/marketing-ads',
    icon: TrendingUp,
    color: 'text-amber-600 bg-amber-50',
  },
  {
    title: 'Presentación LED para Vendedores',
    description: 'Showroom en pantalla gigante para reuniones comerciales con novios y familias.',
    href: '/presentacion-led',
    icon: MonitorPlay,
    color: 'text-violet-600 bg-violet-50',
    external: true,
  },
  {
    title: 'Galería Pública y Catálogo Web',
    description: 'Muestrario fotográfico y videos para clientes e invitados.',
    href: '/empresa/galeria',
    icon: Camera,
    color: 'text-pink-600 bg-pink-50',
  },
  {
    title: 'Editor de Landing Page',
    description: 'Personalizar portada, textos y bloques visibles en la web pública.',
    href: '/empresa/landing-editor',
    icon: Layout,
    color: 'text-teal-600 bg-teal-50',
  },
];

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

export default function EmpresaHubPage() {
  const [activeTab, setActiveTab] = useState('todos');

  const groups = [
    { id: 'vender', label: '1. Vender', count: VENDER_ITEMS.length, items: VENDER_ITEMS, emoji: '💼' },
    { id: 'plata', label: '2. Plata', count: PLATA_ITEMS.length, items: PLATA_ITEMS, emoji: '💰' },
    { id: 'recursos', label: '3. Recursos', count: RECURSOS_ITEMS.length, items: RECURSOS_ITEMS, emoji: '📦' },
    { id: 'marketing', label: '4. Marketing', count: MARKETING_ITEMS.length, items: MARKETING_ITEMS, emoji: '🚀' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Tercera Puerta</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            La Empresa
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Toda la administración del negocio organizada en 4 áreas: Vender, Plata, Recursos y Marketing.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
          <Link href="/mi-dia">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ir a Mi Día
          </Link>
        </Button>
      </div>

      {/* Selector de Áreas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="flex flex-wrap h-auto p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 gap-1">
          <TabsTrigger
            value="todos"
            className="rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Ver Todo</span>
          </TabsTrigger>
          {groups.map((group) => (
            <TabsTrigger
              key={group.id}
              value={group.id}
              className="rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center gap-2"
            >
              <span>{group.emoji}</span>
              <span>{group.label}</span>
              <Badge variant="secondary" className="ml-1 bg-slate-200/60 text-slate-700 text-[10px] px-1.5 py-0 rounded-full font-bold">
                {group.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Todo */}
        <TabsContent value="todos" className="space-y-10 focus-visible:outline-none">
          {groups.map((group) => (
            <section key={group.id} className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span>{group.emoji}</span>
                  <span>{group.label}</span>
                </h2>
                <span className="text-xs font-bold text-slate-400">{group.items.length} herramientas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.items.map((item) => (
                  <ItemCard key={item.title} item={item} />
                ))}
              </div>
            </section>
          ))}
        </TabsContent>

        {/* Tabs individuales */}
        {groups.map((group) => (
          <TabsContent key={group.id} value={group.id} className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.items.map((item) => (
                <ItemCard key={item.title} item={item} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Catálogos Canva */}
      <section className="space-y-4 pt-6 border-t">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <span>🎨</span>
          <span>Catálogos Digitales en Canva (Listos para enviar a clientes)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CANVA_CATALOGS.map((cat) => (
            <Card key={cat.title} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all bg-white flex flex-col justify-between group overflow-hidden">
              <CardHeader className="p-4 pb-2 space-y-2">
                <div className="text-2xl">{cat.emoji}</div>
                <CardTitle className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">
                  {cat.title}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {cat.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button asChild variant="ghost" size="sm" className="w-full justify-between rounded-xl font-bold text-xs text-primary group-hover:bg-primary/5">
                  <a href={cat.href} target="_blank" rel="noopener noreferrer">
                    <span>Abrir Canva</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function ItemCard({ item }: { item: HubItem }) {
  const Icon = item.icon;
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all bg-white flex flex-col justify-between group overflow-hidden">
      <CardHeader className="p-4 pb-2 space-y-2.5">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${item.color} group-hover:scale-105 transition-transform shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          {item.badge && (
            <Badge variant="secondary" className="rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
              {item.badge}
            </Badge>
          )}
        </div>
        <div>
          <CardTitle className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">
            {item.title}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Button asChild variant="ghost" size="sm" className="w-full justify-between rounded-xl font-bold text-xs text-primary group-hover:bg-primary/5 transition-colors">
          <Link href={item.href} target={item.external ? '_blank' : undefined}>
            <span>Abrir</span>
            {item.external ? (
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            )}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
