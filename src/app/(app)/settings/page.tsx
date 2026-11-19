'use client';

import React, { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Coins,
  FileSignature,
  Share2,
  Bot,
  Users,
  Settings as SettingsIcon,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PanelComponent = React.ComponentType<any>;

function lazyPanel(loader: () => Promise<{ default: PanelComponent }>) {
  return dynamic(loader, {
    loading: () => (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando sección…</span>
      </div>
    ),
  });
}

const PANELS: Record<string, PanelComponent> = {
  company: lazyPanel(() => import('@/components/settings/panels/company')),
  datos: lazyPanel(() => import('@/components/settings/panels/datos')),
  account: lazyPanel(() => import('@/components/settings/panels/account')),
  'contenido-publico': lazyPanel(() => import('@/components/settings/panels/contenido-publico')),
  'estilo-fotos': lazyPanel(() => import('@/components/settings/panels/estilo-fotos')),
  'biblioteca-visual-ak': lazyPanel(() => import('@/components/settings/panels/biblioteca-visual-ak')),

  'budget-display': lazyPanel(() => import('@/components/settings/panels/budget-display')),
  promos: lazyPanel(() => import('@/components/settings/panels/promos')),
  cupones: lazyPanel(() => import('@/components/settings/panels/cupones')),
  'ajuste-precios': lazyPanel(() => import('@/components/settings/panels/ajuste-precios')),
  'catalogo-servicios': lazyPanel(() => import('@/components/settings/panels/catalogo-servicios')),

  contratos: lazyPanel(() => import('@/components/settings/panels/contratos')),
  'contratos--clausulas': lazyPanel(() => import('@/components/settings/panels/contratos--clausulas')),
  templates: lazyPanel(() => import('@/components/settings/panels/templates')),
  'templates--layouts': lazyPanel(() => import('@/components/settings/panels/templates--layouts')),
  'templates--reuniones': lazyPanel(() => import('@/components/settings/panels/templates--reuniones')),
  'templates--carga-operativa': lazyPanel(() => import('@/components/settings/panels/templates--carga-operativa')),
  'templates--invitaciones': lazyPanel(() => import('@/components/settings/panels/templates--invitaciones')),
  'task-templates': lazyPanel(() => import('@/components/settings/panels/task-templates')),

  whatsapp: lazyPanel(() => import('@/components/settings/panels/whatsapp')),
  'whatsapp-business': lazyPanel(() => import('@/components/settings/panels/whatsapp-business')),
  'whatsapp-templates': lazyPanel(() => import('@/components/settings/panels/whatsapp-templates')),
  'social-connections': lazyPanel(() => import('@/components/settings/panels/social-connections')),
  'google-workspace': lazyPanel(() => import('@/components/settings/panels/google-workspace')),
  sincronizaciones: lazyPanel(() => import('@/components/settings/panels/sincronizaciones')),

  'ai-assistant': lazyPanel(() => import('@/components/settings/panels/ai-assistant')),
  asistente: lazyPanel(() => import('@/components/settings/panels/asistente')),
  'asistentes-contextuales': lazyPanel(() => import('@/components/settings/panels/asistentes-contextuales')),
  'agentes-autonomos': lazyPanel(() => import('@/components/settings/panels/agentes-autonomos')),
  'tareas-automaticas': lazyPanel(() => import('@/components/settings/panels/tareas-automaticas')),

  'accesos-personal': lazyPanel(() => import('@/components/settings/panels/accesos-personal')),
  notifications: lazyPanel(() => import('@/components/settings/panels/notifications')),

  backup: lazyPanel(() => import('@/components/settings/panels/backup')),
  'backup-final': lazyPanel(() => import('@/components/settings/panels/backup-final')),
  'instalar-app': lazyPanel(() => import('@/components/settings/panels/instalar-app')),
  'videos-de-ayuda': lazyPanel(() => import('@/components/settings/panels/videos-de-ayuda')),
  feedback: lazyPanel(() => import('@/components/settings/panels/feedback')),
  'feature-flags': lazyPanel(() => import('@/components/settings/panels/feature-flags')),
};

interface SeccionDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { id: string; label: string }[];
}

const SECCIONES: SeccionDef[] = [
  {
    id: 'empresa',
    label: 'Empresa',
    icon: Building2,
    items: [
      { id: 'company', label: 'Datos de empresa' },
      { id: 'datos', label: 'Datos legales y cobro' },
      { id: 'account', label: 'Mi cuenta' },
      { id: 'contenido-publico', label: 'Contenido público' },
      { id: 'estilo-fotos', label: 'Estilo de fotos' },
      { id: 'biblioteca-visual-ak', label: 'Biblioteca visual AK' },
    ],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: Coins,
    items: [
      { id: 'budget-display', label: 'Señas y reserva' },
      { id: 'promos', label: 'Promociones' },
      { id: 'cupones', label: 'Cupones' },
      { id: 'ajuste-precios', label: 'Ajuste de precios' },
      { id: 'catalogo-servicios', label: 'Catálogo de servicios' },
    ],
  },
  {
    id: 'contratos',
    label: 'Contratos y plantillas',
    icon: FileSignature,
    items: [
      { id: 'contratos', label: 'Plantilla de contrato' },
      { id: 'contratos--clausulas', label: 'Cláusulas legales' },
      { id: 'templates', label: 'Plantillas de email' },
      { id: 'templates--layouts', label: 'Diseños de salón' },
      { id: 'templates--reuniones', label: 'Reuniones' },
      { id: 'templates--carga-operativa', label: 'Carga operativa' },
      { id: 'templates--invitaciones', label: 'Invitaciones' },
      { id: 'task-templates', label: 'Listas de tareas' },
    ],
  },
  {
    id: 'conexiones',
    label: 'WhatsApp, redes y Google',
    icon: Share2,
    items: [
      { id: 'sincronizaciones', label: 'Conexiones' },
      { id: 'whatsapp', label: 'WhatsApp Web' },
      { id: 'whatsapp-business', label: 'WhatsApp Business' },
      { id: 'whatsapp-templates', label: 'Plantillas WhatsApp' },
      { id: 'social-connections', label: 'Redes sociales' },
      { id: 'google-workspace', label: 'Google Workspace' },
    ],
  },
  {
    id: 'asistente',
    label: 'Asistente y automático',
    icon: Bot,
    items: [
      { id: 'ai-assistant', label: 'IA y consumo' },
      { id: 'asistente', label: 'Ajustes del asistente' },
      { id: 'asistentes-contextuales', label: 'Asistentes por pantalla' },
      { id: 'agentes-autonomos', label: 'Agentes autónomos' },
      { id: 'tareas-automaticas', label: 'Tareas automáticas' },
    ],
  },
  {
    id: 'equipo',
    label: 'Equipo',
    icon: Users,
    items: [
      { id: 'accesos-personal', label: 'Accesos del personal' },
      { id: 'notifications', label: 'Notificaciones' },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: SettingsIcon,
    items: [
      { id: 'backup', label: 'Respaldo' },
      { id: 'backup-final', label: 'Respaldo completo' },
      { id: 'instalar-app', label: 'Instalar app' },
      { id: 'videos-de-ayuda', label: 'Videos de ayuda' },
      { id: 'feedback', label: 'Sugerencias' },
      { id: 'feature-flags', label: 'Opciones avanzadas' },
    ],
  },
];

function SettingsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seccionParam = searchParams.get('seccion') || 'empresa';
  const subParam = searchParams.get('sub') || '';

  const seccionActiva = useMemo(
    () => SECCIONES.find((s) => s.id === seccionParam) ?? SECCIONES[0],
    [seccionParam],
  );

  const subActiva = useMemo(() => {
    const match = seccionActiva.items.find((i) => i.id === subParam);
    return match ? match.id : seccionActiva.items[0].id;
  }, [seccionActiva, subParam]);

  const navigate = (seccion: string, sub: string) => {
    router.replace(`/settings?seccion=${encodeURIComponent(seccion)}&sub=${encodeURIComponent(sub)}`);
  };

  const ActivePanel = PANELS[subActiva] ?? PANELS.company;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Ajustes</h1>
          <p className="text-sm text-slate-500">
            Toda la configuración de AK Producciones organizada en 7 áreas.
          </p>
        </div>
        {seccionActiva.id === 'equipo' && (
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Usuarios y permisos <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* 7 secciones principales */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {SECCIONES.map((sec) => {
          const Icon = sec.icon;
          const active = sec.id === seccionActiva.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => navigate(sec.id, sec.items[0].id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors',
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pestañas dentro de la sección */}
      <div className="flex flex-wrap gap-1.5">
        {seccionActiva.items.map((item) => {
          const active = item.id === subActiva;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(seccionActiva.id, item.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Contenido de la sub-sección */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-2 sm:p-4">
        <ActivePanel />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Cargando ajustes…</span>
        </div>
      }
    >
      <SettingsHubContent />
    </Suspense>
  );
}
