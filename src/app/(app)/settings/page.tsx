'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  setAjustesPublicarSoloAction,
  setAjustesPublicarSolo,
  getAjustesPublicarSoloAction,
} from '@/app/actions/presencia-digital';
import {
  Bell,
  Bot,
  Building,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cpu,
  Database,
  FileSignature,
  FileText,
  Globe,
  HardDriveDownload,
  Image,
  Link as LinkIcon,
  Loader2,
  Megaphone,
  MessageCircle,
  Package,
  Palette,
  Search,
  Settings as SettingsIcon,
  Share2,
  Shield,
  ShieldCheck,
  Tag,
  Ticket,
  ToggleRight,
  TrendingUp,
  UserCog,
  Users,
  Video,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface SettingSection {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  isAdvanced?: boolean;
  items: SettingItem[];
}

const SECTIONS: SettingSection[] = [
  {
    id: 'empresa-y-presupuesto',
    label: 'Empresa y presupuesto',
    emoji: '🏢',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    items: [
      {
        title: 'Información de la Empresa',
        description: 'Datos fiscales, contacto, nombre comercial y logotipo.',
        href: '/settings/company',
        icon: Building,
      },
      {
        title: 'Configuración de Presupuestos y Simulador',
        description: 'Textos, presentación, paquetes y reglas comerciales del presupuesto.',
        href: '/settings/budget-display',
        icon: Wand2,
      },
      {
        title: 'Ajuste Anual de Precios',
        description: 'Ajuste masivo de precios y costos del catálogo general.',
        href: '/settings/ajuste-precios',
        icon: TrendingUp,
      },
      {
        title: 'Creador & Auditor de Anuncios IA',
        description: 'Generador de campañas con neuroventas y optimizador de anuncios.',
        href: '/empresa/creador-anuncios',
        icon: Megaphone,
      },
    ],
  },
  {
    id: 'sena-y-promociones',
    label: 'Seña y promociones',
    emoji: '🏷️',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    items: [
      {
        title: 'Política de Señas y Reservas',
        description: 'Porcentajes de seña para confirmar la fiesta, cuotas y facilidades de pago.',
        href: '/settings/promos',
        icon: Tag,
      },
      {
        title: 'Promociones de Temporada',
        description: 'Descuentos por seña anticipada, combos especiales y promociones activas.',
        href: '/settings/promos',
        icon: Tag,
      },
      {
        title: 'Cupones y Descuentos',
        description: 'Códigos promocionales de seña y descuento, vigencia y límite de usos.',
        href: '/settings/cupones',
        icon: Ticket,
      },
    ],
  },
  {
    id: 'whatsapp-y-conexiones',
    label: 'WhatsApp y conexiones',
    emoji: '💬',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    items: [
      {
        title: 'Integración WhatsApp',
        description: 'Modo manual o automático, recordatorios y estado de conexión.',
        href: '/settings/whatsapp',
        icon: MessageCircle,
      },
      {
        title: 'Plantillas de Mensajes',
        description: 'Mensajes para presupuestos, contratos y confirmaciones.',
        href: '/settings/whatsapp-templates',
        icon: MessageCircle,
      },
      {
        title: 'WhatsApp Business Bot',
        description: 'Atención automática conectada a CRM y marketing.',
        href: '/settings/whatsapp-business',
        icon: Bot,
      },
      {
        title: 'Centro de Sincronizaciones y Conexiones',
        description: 'Estado de conexión con Google, WhatsApp, Meta, Mercado Pago y redes.',
        href: '/settings/sincronizaciones',
        icon: Zap,
      },
      {
        title: 'Google Workspace',
        description: 'Sincronización de eventos y correos con tu cuenta Google.',
        href: '/settings/google-workspace',
        icon: Calendar,
      },
      {
        title: 'Cuentas Sociales',
        description: 'Gestionar perfiles de Instagram, TikTok y Facebook de la productora. Publicar solo.',
        href: '/settings/social-connections',
        icon: Share2,
      },
    ],
  },
  {
    id: 'tareas-automaticas',
    label: 'Tareas automáticas',
    emoji: '⚡',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-200',
    items: [
      {
        title: 'Tareas Automáticas',
        description: 'Estado real de las 4 tareas que corren solas (blog, redes, posteos, cuotas).',
        href: '/settings/tareas-automaticas',
        icon: Zap,
      },
      {
        title: 'Agentes Autónomos',
        description: 'Control, pausado y rastro de actividad de los agentes inteligentes.',
        href: '/settings/agentes-autonomos',
        icon: Bot,
      },
    ],
  },
  {
    id: 'contrato',
    label: 'Contrato',
    emoji: '📝',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    items: [
      {
        title: 'Cláusulas de Contrato Legal',
        description: 'Cláusulas legales, cancelaciones y condiciones del servicio para clientes.',
        href: '/settings/contratos/clausulas',
        icon: FileSignature,
      },
      {
        title: 'Plantilla de Contrato Legal',
        description: 'Texto base del contrato formal con etiquetas dinámicas.',
        href: '/settings/contratos',
        icon: FileText,
      },
      {
        title: 'Gestión de Plantillas',
        description: 'Plantillas reutilizables de tareas, contratos y presupuestos.',
        href: '/settings/templates',
        icon: Palette,
      },
    ],
  },
  {
    id: 'asistente-ia',
    label: 'Asistente IA',
    emoji: '🤖',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    items: [
      {
        title: 'Asistente IA',
        description: 'Personalidad, instrucciones y comportamiento del asistente inteligente.',
        href: '/settings/ai-assistant',
        icon: Bot,
      },
      {
        title: 'Asistentes Contextuales',
        description: 'Personalización de avatares y nombres de los asistentes por pantalla.',
        href: '/settings/asistentes-contextuales',
        icon: Palette,
      },
    ],
  },
  {
    id: 'seguridad-y-usuarios',
    label: 'Seguridad y usuarios',
    emoji: '🛡️',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 border-rose-200',
    items: [
      {
        title: 'Seguridad y Cuenta',
        description: 'Clave de acceso, recuperación y opciones de seguridad personal.',
        href: '/settings/account',
        icon: ShieldCheck,
      },
      {
        title: 'Cuentas Staff y Permisos',
        description: 'Registrar colaboradores y definir roles y permisos del sistema.',
        href: '/admin/usuarios',
        icon: Users,
      },
      {
        title: 'Accesos para Colaboradores',
        description: 'Accesos rápidos para secretaria, personal y colaboradores.',
        href: '/settings/accesos-personal',
        icon: UserCog,
      },
      {
        title: 'Notificaciones y Avisos',
        description: 'Alertas sonoras y avisos de cobros y eventos.',
        href: '/settings/notifications',
        icon: Bell,
      },
    ],
  },
  {
    id: 'estilo-de-fotos',
    label: 'Estilo de fotos',
    emoji: '🎨',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 border-cyan-200',
    items: [
      {
        title: 'Estilo de fotos AK',
        description: 'Calibración de color, luz y suavizado automático para las fotos de invitados.',
        href: '/settings/estilo-fotos',
        icon: Palette,
      },
      {
        title: 'Galería Pública',
        description: 'Fotos y videos visibles en la web.',
        href: '/empresa/galeria',
        icon: Image,
      },
      {
        title: 'Videos de Ayuda por Pantalla',
        description: 'Explicaciones en video de YouTube para el invitado, el cliente y simulador.',
        href: '/settings/videos-de-ayuda',
        icon: Video,
      },
    ],
  },
  {
    id: 'avanzado',
    label: 'Avanzado',
    emoji: '⚙️',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100 border-slate-300',
    isAdvanced: true,
    items: [
      {
        title: 'Laboratorio Experimental',
        description: 'Activar o pausar funciones experimentales (feature flags).',
        href: '/settings/feature-flags',
        icon: ToggleRight,
      },
      {
        title: 'Mapa Tecnológico',
        description: 'Diagrama visual de componentes, conexiones e infraestructura.',
        href: '/settings/mapa-tecnologico-ak',
        icon: Cpu,
      },
      {
        title: 'Administración de Datos',
        description: 'Gestión delicada de datos de CRM, presupuestos y planificador.',
        href: '/settings/datos',
        icon: Database,
      },
      {
        title: 'Auditoría',
        description: 'Registro de actividad y cambios del sistema.',
        href: '/auditoria',
        icon: Shield,
      },
      {
        title: 'Backup y Restauración',
        description: 'Descargar o restaurar respaldos de datos.',
        href: '/settings/backup',
        icon: HardDriveDownload,
      },
    ],
  },
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [avanzadoAbierto, setAvanzadoAbierto] = useState(false);
  const [publicarSolo, setPublicarSolo] = useState(true);
  const [cargandoPublicarSolo, setCargandoPublicarSolo] = useState(false);

  useEffect(() => {
    let montado = true;
    getAjustesPublicarSoloAction()
      .then((res) => {
        if (montado && res.success && res.data) {
          setPublicarSolo(res.data.activo !== false);
        }
      })
      .catch(() => {});
    return () => {
      montado = false;
    };
  }, []);

  const handleTogglePublicarSolo = async (activo: boolean) => {
    setCargandoPublicarSolo(true);
    try {
      const res = await setAjustesPublicarSolo(activo);
      if (res.success) {
        setPublicarSolo(activo);
        toast({
          title: 'Ajustes guardados',
          description: activo ? 'Publicar solo activado.' : 'Publicar solo desactivado.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'No se pudo guardar',
          description: res.error || 'No tenés permisos para cambiar esta configuración.',
        });
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e?.message || 'Error al cambiar ajuste.',
      });
    } finally {
      setCargandoPublicarSolo(false);
    }
  };

  const { seccionesRegulares, seccionAvanzada } = useMemo(() => {
    const raw = query.trim();
    const term = normalizar(raw);

    if (!term) {
      return {
        seccionesRegulares: SECTIONS.filter((s) => !s.isAdvanced),
        seccionAvanzada: SECTIONS.find((s) => s.isAdvanced) || null,
      };
    }

    const filtradas = SECTIONS.map((section) => {
      const labelMatches = normalizar(section.label).includes(term);
      const items = section.items.filter((item) => {
        if (labelMatches) return true;
        const text = normalizar(`${item.title} ${item.description} ${item.href}`);
        return text.includes(term);
      });
      return { ...section, items: labelMatches ? section.items : items };
    }).filter((section) => section.items.length > 0);

    return {
      seccionesRegulares: filtradas.filter((s) => !s.isAdvanced),
      seccionAvanzada: filtradas.find((s) => s.isAdvanced) || null,
    };
  }, [query]);

  const hayResultados = seccionesRegulares.length > 0 || seccionAvanzada !== null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shrink-0">
          <SettingsIcon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-headline">Ajustes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Toda la configuración de la productora en una sola pantalla, simple y sin vueltas.
          </p>
        </div>
      </div>

      {/* Buscador en tiempo real (Orden 283) */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          data-testid="buscador-ajustes"
          aria-label="Buscar configuración"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿qué querés cambiar?"
          className="pl-10 pr-10 h-12 rounded-2xl border-slate-200 text-sm sm:text-base font-medium shadow-sm bg-white focus-visible:ring-indigo-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-full"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!hayResultados ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          No se encontró ninguna opción para "{query}". Probá con otra palabra o limpiá el buscador.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Secciones regulares */}
          {seccionesRegulares.map((section) => (
            <div key={section.id} data-testid={`seccion-${section.id}`} className="space-y-3">
              <div className={cn('inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-black', section.bgColor, section.color)}>
                <span>{section.emoji}</span>
                <span>{section.label}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <Link key={item.href} href={item.href} className="group block h-full">
                    <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all duration-200 h-full min-h-[44px]">
                      <div className={cn('p-2.5 rounded-xl shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105', section.bgColor)}>
                        <item.icon className={cn('w-5 h-5', section.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {section.id === 'whatsapp-y-conexiones' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border border-green-200 bg-green-50/60 shadow-sm mt-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-green-700" />
                      <span className="font-bold text-sm text-slate-900">Publicar solo</span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-xl">
                      Publica automáticamente en redes los borradores aprobados con más de 12 horas y permisos en regla.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {cargandoPublicarSolo && <Loader2 className="w-4 h-4 animate-spin text-green-600" />}
                    <Switch
                      id="switch-publicar-solo"
                      data-testid="switch-publicar-solo"
                      checked={publicarSolo}
                      disabled={cargandoPublicarSolo}
                      onCheckedChange={handleTogglePublicarSolo}
                      aria-label="Publicar solo"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Sección Avanzado plegada por defecto (Orden 283) */}
          {seccionAvanzada && (
            <div
              key={seccionAvanzada.id}
              data-testid={`seccion-${seccionAvanzada.id}`}
              className="border-t border-slate-200 pt-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className={cn('inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-black', seccionAvanzada.bgColor, seccionAvanzada.color)}>
                  <span>{seccionAvanzada.emoji}</span>
                  <span>{seccionAvanzada.label}</span>
                </div>
                {!query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvanzadoAbierto(!avanzadoAbierto)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 gap-1.5 rounded-xl min-h-[44px]"
                  >
                    <span>{avanzadoAbierto ? 'Plegar opciones avanzadas' : 'Desplegar opciones avanzadas'}</span>
                    {avanzadoAbierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
              </div>

              {(avanzadoAbierto || Boolean(query)) && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                  {seccionAvanzada.items.map((item) => (
                    <Link key={item.href} href={item.href} className="group block h-full">
                      <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md transition-all duration-200 h-full min-h-[44px]">
                        <div className={cn('p-2.5 rounded-xl shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105', seccionAvanzada.bgColor)}>
                          <item.icon className={cn('w-5 h-5', seccionAvanzada.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-slate-900 group-hover:text-slate-700 transition-colors">
                              {item.title}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 transition-colors" />
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
