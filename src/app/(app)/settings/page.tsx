'use client';

import React, { Suspense, useMemo, useState } from 'react';
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
  Search,
  X,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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

interface SearchSectionItem {
  title: string;
  description: string;
  href: string;
}

interface SearchSectionDef {
  id: string;
  label: string;
  emoji: string;
  bgColor: string;
  items: SearchSectionItem[];
}

const SEARCH_SECTIONS: SearchSectionDef[] = [
  {
    id: 'empresa-y-presupuesto',
    label: 'Empresa y presupuesto',
    emoji: '🏢',
    bgColor: 'bg-amber-50 border-amber-200',
    items: [
      { title: 'Información de la Empresa', description: 'Datos fiscales, contacto, nombre comercial y logotipo.', href: '/settings?seccion=empresa&sub=company' },
      { title: 'Configuración de Presupuestos y Simulador', description: 'Textos, presentación, paquetes y reglas comerciales del presupuesto.', href: '/settings?seccion=ventas&sub=budget-display' },
      { title: 'Ajuste Anual de Precios', description: 'Ajuste masivo de precios y costos del catálogo general.', href: '/settings?seccion=ventas&sub=ajuste-precios' },
      { title: 'Catálogo de Servicios', description: 'Precios, costos y prestaciones base.', href: '/settings?seccion=ventas&sub=catalogo-servicios' },
    ],
  },
  {
    id: 'sena-y-promociones',
    label: 'Seña y promociones',
    emoji: '🏷️',
    bgColor: 'bg-emerald-50 border-emerald-200',
    items: [
      { title: 'Política de Señas y Reservas', description: 'Porcentajes de seña para confirmar la fiesta, cuotas y facilidades de pago.', href: '/settings?seccion=ventas&sub=budget-display' },
      { title: 'Promociones de Temporada', description: 'Descuentos por seña anticipada, combos especiales y promociones activas.', href: '/settings?seccion=ventas&sub=promos' },
      { title: 'Cupones y Descuentos', description: 'Códigos promocionales de seña y descuento, vigencia y límite de usos.', href: '/settings?seccion=ventas&sub=cupones' },
    ],
  },
  {
    id: 'whatsapp-y-conexiones',
    label: 'WhatsApp y conexiones',
    emoji: '💬',
    bgColor: 'bg-green-50 border-green-200',
    items: [
      { title: 'Integración WhatsApp', description: 'Modo manual o automático, recordatorios y estado de conexión.', href: '/settings?seccion=conexiones&sub=whatsapp' },
      { title: 'Plantillas de Mensajes', description: 'Mensajes para presupuestos, contratos y confirmaciones.', href: '/settings?seccion=conexiones&sub=whatsapp-templates' },
      { title: 'WhatsApp Business Bot', description: 'Atención automática conectada a CRM y marketing.', href: '/settings?seccion=conexiones&sub=whatsapp-business' },
      { title: 'Centro de Sincronizaciones y Conexiones', description: 'Estado de conexión con Google, WhatsApp, Meta, Mercado Pago y redes.', href: '/settings?seccion=conexiones&sub=sincronizaciones' },
      { title: 'Google Workspace', description: 'Sincronización de eventos y correos con tu cuenta Google.', href: '/settings?seccion=conexiones&sub=google-workspace' },
      { title: 'Cuentas Sociales', description: 'Gestionar perfiles de Instagram, TikTok y Facebook de la productora.', href: '/settings?seccion=conexiones&sub=social-connections' },
    ],
  },
  {
    id: 'tareas-automaticas',
    label: 'Tareas automáticas',
    emoji: '⚡',
    bgColor: 'bg-yellow-50 border-yellow-200',
    items: [
      { title: 'Tareas Automáticas', description: 'Estado real de las tareas que corren solas.', href: '/settings?seccion=asistente&sub=tareas-automaticas' },
      { title: 'Agentes Autónomos', description: 'Control, pausado y rastro de actividad de los agentes inteligentes.', href: '/settings?seccion=asistente&sub=agentes-autonomos' },
    ],
  },
  {
    id: 'contrato',
    label: 'Contrato',
    emoji: '📝',
    bgColor: 'bg-blue-50 border-blue-200',
    items: [
      { title: 'Cláusulas de Contrato Legal', description: 'Cláusulas legales, cancelaciones y condiciones del servicio para clientes.', href: '/settings?seccion=contratos&sub=contratos--clausulas' },
      { title: 'Plantilla de Contrato Legal', description: 'Texto base del contrato formal con etiquetas dinámicas.', href: '/settings?seccion=contratos&sub=contratos' },
      { title: 'Gestión de Plantillas', description: 'Plantillas reutilizables de reuniones, salones, emails e invitaciones.', href: '/settings?seccion=contratos&sub=templates' },
    ],
  },
  {
    id: 'asistente-ia',
    label: 'Asistente IA',
    emoji: '🤖',
    bgColor: 'bg-indigo-50 border-indigo-200',
    items: [
      { title: 'Asistente IA', description: 'Personalidad, instrucciones y consumo del asistente inteligente.', href: '/settings?seccion=asistente&sub=ai-assistant' },
      { title: 'Ajustes del Asistente', description: 'Configuración proactiva y reglas del asistente AK.', href: '/settings?seccion=asistente&sub=asistente' },
      { title: 'Asistentes Contextuales', description: 'Personalización de avatares y nombres por pantalla.', href: '/settings?seccion=asistente&sub=asistentes-contextuales' },
    ],
  },
  {
    id: 'seguridad-y-usuarios',
    label: 'Seguridad y usuarios',
    emoji: '🛡️',
    bgColor: 'bg-rose-50 border-rose-200',
    items: [
      { title: 'Seguridad y Cuenta', description: 'Clave de acceso, recuperación y opciones de seguridad personal.', href: '/settings?seccion=empresa&sub=account' },
      { title: 'Cuentas Staff y Permisos', description: 'Registrar colaboradores y definir roles y permisos del sistema.', href: '/admin/usuarios' },
      { title: 'Accesos para Colaboradores', description: 'Accesos rápidos para secretaria, personal y colaboradores.', href: '/settings?seccion=equipo&sub=accesos-personal' },
      { title: 'Notificaciones y Avisos', description: 'Alertas sonoras y avisos de cobros y eventos.', href: '/settings?seccion=equipo&sub=notifications' },
    ],
  },
  {
    id: 'estilo-de-fotos',
    label: 'Estilo de fotos',
    emoji: '🎨',
    bgColor: 'bg-cyan-50 border-cyan-200',
    items: [
      { title: 'Estilo de fotos AK', description: 'Calibración de color, luz y suavizado automático para las fotos de invitados.', href: '/settings?seccion=empresa&sub=estilo-fotos' },
      { title: 'Contenido Público', description: 'Textos, testimonios y portafolio visible en la web.', href: '/settings?seccion=empresa&sub=contenido-publico' },
      { title: 'Videos de Ayuda por Pantalla', description: 'Explicaciones en video de YouTube para invitado, cliente y simulador.', href: '/settings?seccion=sistema&sub=videos-de-ayuda' },
    ],
  },
  {
    id: 'avanzado',
    label: 'Avanzado',
    emoji: '⚙️',
    bgColor: 'bg-slate-100 border-slate-300',
    items: [
      { title: 'Laboratorio Experimental', description: 'Activar o pausar funciones experimentales (feature flags).', href: '/settings?seccion=sistema&sub=feature-flags' },
      { title: 'Administración de Datos', description: 'Gestión delicada de datos de CRM, presupuestos y planificador.', href: '/settings?seccion=empresa&sub=datos' },
      { title: 'Backup y Restauración', description: 'Descargar o restaurar respaldos de datos.', href: '/settings?seccion=sistema&sub=backup' },
      { title: 'Instalar App', description: 'Acceso rápido e instalación en celular y computadora.', href: '/settings?seccion=sistema&sub=instalar-app' },
    ],
  },
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const SECCION_ALIAS: Record<string, string> = {
  fotos: 'empresa',
};

function SettingsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSeccion = searchParams.get('seccion');
  const rawSub = searchParams.get('sub');
  const tieneSeleccionExplicita = Boolean(rawSeccion || rawSub);
  const [query, setQuery] = useState('');

  const seccionActiva = useMemo(() => {
    const normalized = rawSeccion ? (SECCION_ALIAS[rawSeccion] ?? rawSeccion) : null;
    if (rawSub) {
      const bySub = SECCIONES.find((s) => s.items.some((i) => i.id === rawSub));
      if (bySub) return bySub;
    }
    return SECCIONES.find((s) => s.id === normalized) ?? SECCIONES[0];
  }, [rawSeccion, rawSub]);

  const subActiva = useMemo(() => {
    if (rawSub && PANELS[rawSub]) {
      return rawSub;
    }
    return seccionActiva.items[0].id;
  }, [seccionActiva, rawSub]);

  const navigate = (seccion: string, sub: string) => {
    router.replace(`/settings?seccion=${encodeURIComponent(seccion)}&sub=${encodeURIComponent(sub)}`);
  };

  const seccionesFiltradas = useMemo(() => {
    const term = normalizar(query.trim());
    if (!term) return SEARCH_SECTIONS;

    return SEARCH_SECTIONS.map((section) => {
      const labelMatches = normalizar(section.label).includes(term);
      const items = section.items.filter((item) => {
        if (labelMatches) return true;
        return normalizar(`${item.title} ${item.description} ${item.href}`).includes(term);
      });
      return { ...section, items: labelMatches ? section.items : items };
    }).filter((section) => section.items.length > 0);
  }, [query]);

  const ActivePanel = PANELS[subActiva] ?? PANELS.company;
  const mostrarBuscador = !tieneSeleccionExplicita || query.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Ajustes</h1>
          <p className="text-sm text-slate-500">
            Toda la configuración de AK Producciones organizada en 7 áreas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tieneSeleccionExplicita && (
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Todas las secciones
            </Link>
          )}
          {seccionActiva.id === 'equipo' && (
            <Link
              href="/admin/usuarios"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Usuarios y permisos <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Buscador en tiempo real (Orden 283) */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          data-testid="buscador-ajustes"
          aria-label="Buscar configuración"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿qué querés cambiar?"
          className="h-12 rounded-2xl border-slate-200 bg-white pl-10 pr-10 text-sm font-medium shadow-sm focus-visible:ring-indigo-500 sm:text-base"
        />
        {query && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 7 secciones principales */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {SECCIONES.map((sec) => {
          const Icon = sec.icon;
          const active = tieneSeleccionExplicita && sec.id === seccionActiva.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setQuery('');
                navigate(sec.id, sec.items[0].id);
              }}
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

      {mostrarBuscador ? (
        <div className="space-y-6">
          {seccionesFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No encontramos ajustes para “{query}”. Probá con otra palabra como “seña”, “fotos” o “whatsapp”.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {seccionesFiltradas.map((section) => (
                <section
                  key={section.id}
                  data-testid={`seccion-${section.id}`}
                  className={cn('rounded-2xl border p-4 shadow-sm', section.bgColor)}
                >
                  <h2 className="mb-3 flex items-center gap-2 text-base font-black text-slate-900">
                    <span>{section.emoji}</span>
                    <span>{section.label}</span>
                  </h2>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setQuery('')}
                        className="flex items-start justify-between gap-2 rounded-xl border border-white/80 bg-white/90 p-3 transition hover:bg-white hover:shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}
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
