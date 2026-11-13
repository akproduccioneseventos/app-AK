'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ContactRound,
  Briefcase,
  Package,
  Sparkles,
  ChefHat,
  MapPin,
  GlassWater,
  ShoppingCart,
  ArrowRight,
  Layers,
  Building2,
} from 'lucide-react';
import { PERMISOS, type Permiso } from '@/lib/auth/perfiles';
import { getMisPermisos } from '@/app/actions/sesion';
import { BarraDeLaCasa } from '@/components/navegacion/barra-de-la-casa';

interface HubItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  badge?: string;
  permiso?: Permiso;
}

/**
 * Las 9 herramientas centrales de la Casa Recursos (Orden 284 Bloque 3).
 */
const RECURSOS_ITEMS: HubItem[] = [
  {
    title: 'Comida',
    description: 'Plantillas de menús, platos, recetas, insumos requeridos y costos de cocina.',
    href: '/empresa/menus',
    icon: ChefHat,
    color: 'text-amber-600 bg-amber-50',
    badge: 'Cocina',
    permiso: PERMISOS.INSUMOS,
  },
  {
    title: 'Tragos',
    description: 'Catálogo de coctelería, recetas, carta de tragos y cálculo de botellas.',
    href: '/empresa/menus/tragos',
    icon: GlassWater,
    color: 'text-orange-600 bg-orange-50',
    permiso: PERMISOS.INSUMOS,
  },
  {
    title: 'Compras',
    description: 'Compras pendientes, stock disponible y necesidades por evento.',
    href: '/compras',
    icon: ShoppingCart,
    color: 'text-yellow-600 bg-yellow-50',
    permiso: PERMISOS.INSUMOS,
  },
  {
    title: 'Insumos',
    description: 'Control de insumos, stock disponible y almacén central de la empresa.',
    href: '/empresa/insumos',
    icon: Package,
    color: 'text-emerald-600 bg-emerald-50',
    permiso: PERMISOS.INSUMOS,
  },
  {
    title: 'Salones',
    description: 'Salones asociados, capacidades, mapas y convenios (incluyendo Club Uruguay).',
    href: '/empresa/salones',
    icon: MapPin,
    color: 'text-red-600 bg-red-50',
  },
  {
    title: 'Servicios',
    description: 'Precios, descripciones y configuraciones de todos los servicios ofrecidos.',
    href: '/empresa/servicios',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    title: 'Proveedores',
    description: 'Proveedores externos, servicios tercerizados y datos de contacto.',
    href: '/proveedores',
    icon: Briefcase,
    color: 'text-slate-600 bg-slate-100',
    permiso: PERMISOS.INSUMOS,
  },
  {
    title: 'Personal',
    description: 'Nómina de personal, roles asignados, sueldos por evento y asistencias.',
    href: '/empleados',
    icon: ContactRound,
    color: 'text-indigo-600 bg-indigo-50',
    permiso: PERMISOS.ADMINISTRACION,
  },
  {
    title: 'Equipos',
    description: 'Inventario de equipos de sonido, luces, cámaras y mobiliario propio.',
    href: '/empresa/activos-fijos',
    icon: Layers,
    color: 'text-slate-600 bg-slate-100',
  },
];

export default function EmpresaHubPage() {
  const [misPermisos, setMisPermisos] = useState<Permiso[] | null>(null);

  React.useEffect(() => {
    let cancelado = false;
    getMisPermisos()
      .then((res) => {
        if (!cancelado) setMisPermisos(res.permisos);
      })
      .catch(() => {
        if (!cancelado) setMisPermisos([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const filtrarPorPermiso = (items: HubItem[]) => {
    if (!misPermisos) {
      return items.filter((i) => !i.permiso);
    }
    return items.filter((i) => !i.permiso || misPermisos.includes(i.permiso));
  };

  const recursosItemsFiltrados = filtrarPorPermiso(RECURSOS_ITEMS);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Barra de la Casa Recursos */}
      <BarraDeLaCasa casaId="recursos" />

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6 px-1">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Sexta Casa</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Recursos
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Gestión integral de cocina, coctelería, compras, insumos, salones, servicios, proveedores, personal y equipos.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
          <Link href="/mi-dia">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ir a Mi Día
          </Link>
        </Button>
      </div>

      {/* Las 9 tarjetas de Recursos */}
      <section className="space-y-4 px-1">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>📦</span>
            <span>Herramientas de Recursos</span>
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {recursosItemsFiltrados.length} de 9 disponibles
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recursosItemsFiltrados.map((item) => (
            <ItemCard key={item.title} item={item} />
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
          <Link href={item.href}>
            <span>Abrir</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
