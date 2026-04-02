'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sparkles,
  Copy,
  Share2,
  BookmarkPlus,
  Trash2,
  CheckCircle2,
  Circle,
  Download,
  Upload,
  Instagram,
  MessageSquare,
  Film,
  LayoutList,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
  MarketingTemplate,
  ChecklistItem,
  TipoEvento,
  ObjetivoMarketing,
  EstiloMarketing,
  ContenidoCanales,
  TabMarketing,
} from '@/types/marketing';
import { MARKETING_VARIABLES } from '@/types/marketing';
import {
  getMarketingTemplates,
  saveMarketingTemplate,
  deleteMarketingTemplate,
  getMarketingChecklist,
  saveMarketingChecklist,
  exportMarketingData,
  importMarketingData,
} from '@/app/actions/marketing';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function getSemanaActual(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Base Templates (built-in, premium + cercano, XV años) ───────────────────

type TemplateKey = `${TipoEvento}-${ObjetivoMarketing}-${EstiloMarketing}`;

const BASE_TEMPLATES: Partial<Record<TemplateKey, ContenidoCanales>> = {
  'XV-captacion-elegante': {
    ig_corto:
      'Tu fiesta de XV merece ser perfecta. En AK Producciones organizamos todo: salón, música, decoración y más. Vos venís como invitada. 💫\nPedí tu simulador de presupuesto 👇\n{{LINK_SIMULADOR}}\n#XVAños #FiestasXV #AKProducciones',
    ig_largo:
      '✨ XV años únicos, sin estrés.\n\nSabemos que organizar una fiesta puede ser agotador. Por eso en AK Producciones nos encargamos de absolutamente todo: salón, gastronomía, decoración, música, iluminación y mucho más.\n\nVos llegás como invitada y nosotros hacemos el resto.\n\n🌟 Todo en un solo lugar\n🌟 Atención personalizada\n🌟 Más de [X] años de experiencia\n\n📲 Consultá fechas disponibles y pedí tu presupuesto en segundos:\n{{LINK_SIMULADOR}}\n\n#XVAños #FiestasDeXV #QuinceAños #AKProducciones #SalonDeEventos #OrganizaciónDeEventos',
    historias:
      '¿Soñás con tus XV perfectos? 💜 // Nosotros organizamos TODO: salón + música + deco + gastronomía 🎉 // Pedí tu presupuesto AHORA ➡️ {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "¿Todavía no reservaste tus XV? Mirá esto 👀"\nESCENA 1: Mostrar el salón ambientado (decoración, mesas, pista de baile)\nESCENA 2: "En AK Producciones organizamos ABSOLUTAMENTE TODO. Vos llegás como invitada."\nESCENA 3: Equipo trabajando, detalles de decoración, gastronomía\nCTA: "Simulá tu presupuesto en 1 minuto. Link en bio 🔗 {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola! Gracias por escribirnos 😊\n¿La fiesta es para qué fecha aproximada y cuántos invitados esperan?\n\nCon eso te armo las opciones del paquete completo y te paso el simulador para que veas un presupuesto en segundos.\n\n📲 También podés verlo directamente acá: {{LINK_SIMULADOR}}',
  },
  'XV-captacion-neon': {
    ig_corto:
      '¡XV con toda la vibra! 🌈 Salón + DJ + neon + organización completa. Vos elegís el estilo, nosotros hacemos la magia. Pedí tu simulador 👉 {{LINK_SIMULADOR}}\n#XVNeon #FiestasXV #AKProducciones',
    ig_largo:
      '🌈 XV años con toda la vibra NEON.\n\nIluminación neón, DJ profesional, decoración impactante… y vos sin preocuparte por nada.\n\nEn AK Producciones organizamos tu fiesta de pies a cabeza:\n✅ Salón propio\n✅ Decoración neón personalizada\n✅ Gastronomía completa\n✅ Animación y música\n\nSimulá tu presupuesto ahora:\n{{LINK_SIMULADOR}}\n\n#XVNeon #QuinceAñosNeon #FiestasXV #AKProducciones #FiestaNeón',
    historias:
      '¡XV con toda la vibra! 🌈 // Neon + DJ + salón completo = la fiesta que soñaste // Simulá tu presupuesto 👉 {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "XV años + luces neón = esto 🤩"\nESCENA 1: Reveal del salón con iluminación neón encendida\nESCENA 2: "Paquete completo: deco, música, gastronomía. Todo en un solo lugar."\nESCENA 3: Festejante y amigas bailando, detalles del salón\nCTA: "Pedí tu presupuesto gratis. Link en bio ➡️ {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola! Qué bueno que nos escribís 😊 Para los XV con estilo neón tenemos paquetes increíbles.\n¿Para qué fecha y cuántos invitados? Así te mando opciones y el link del simulador:\n{{LINK_SIMULADOR}}',
  },
  'XV-captacion-princesa': {
    ig_corto:
      'Porque toda chica merece sentirse princesa en sus XV 👑 Organización completa, decoración de ensueño y recuerdos para toda la vida. Simulá tu presupuesto: {{LINK_SIMULADOR}}\n#XVPrincesa #FiestasXV #AKProducciones',
    ig_largo:
      '👑 El sueño de toda quinceañera hecho realidad.\n\nDecoración clásica y elegante, vestido de ensueño, vals perfectamente coordinado… y vos sin preocuparte por nada.\n\nEn AK Producciones nos encargamos de que cada detalle sea perfecto:\n✨ Salón decorado según tu visión\n✨ Gastronomía de calidad\n✨ Coordinación total del evento\n✨ Recuerdos para toda la vida\n\nSimulá tu presupuesto sin compromiso:\n{{LINK_SIMULADOR}}\n\n#XVPrincesa #QuinceAñosPrincesa #FiestasXV #AKProducciones',
    historias:
      '¿Soñás con tus XV de princesa? 👑 // Salón + decoración + organización completa // Tu presupuesto en 1 minuto: {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "XV de princesa sin el estrés de organizar todo 👑"\nESCENA 1: Decoración clásica, mesas con flores, luces cálidas\nESCENA 2: "Nosotros organizamos absolutamente todo. Vos llegás y disfrutás."\nESCENA 3: Quinceañera radiante, familia feliz\nCTA: "Consultá fechas y presupuesto. Link en bio 💫 {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola! 😊 Para una fiesta de XV estilo princesa tenemos el paquete ideal.\n¿Cuál es la fecha aproximada y cuántos invitados esperan? Con eso te preparo opciones y el simulador de presupuesto:\n{{LINK_SIMULADOR}}',
  },
  'XV-mostrar-elegante': {
    ig_corto:
      'Así lucen los XV que organizamos 🤍 Cada detalle pensado para que sea inolvidable. ¿La próxima es la tuya? Simulá tu presupuesto: {{LINK_SIMULADOR}}\n#XVAños #AKProducciones',
    ig_largo:
      '🤍 Detrás de cada fiesta perfecta, hay un equipo que trabajó sin parar.\n\nEsto fue lo que creamos para [NOMBRE DE LA QUINCEAÑERA / "nuestra última festejante"]: salón decorado, gastronomía impecable, música que hizo bailar a todos hasta las 6am.\n\nNo les faltó ni un detalle. Y lo mejor: la mamá llegó a la fiesta sin estrés, porque nosotros nos encargamos de todo.\n\n¿Querés algo así para tu hija? Empezá por el simulador de presupuesto:\n{{LINK_SIMULADOR}}\n\n#XVAños #FiestasXV #AKProducciones #EventosPremium',
    historias:
      'Así quedaron sus XV ✨ // Salón + decoración + organización completa // ¿La próxima es la tuya? 👉 {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "Mirá cómo transformamos el salón para esta fiesta de XV 🤩"\nESCENA 1: Time-lapse o before/after del salón decorado\nESCENA 2: Highlights del evento: entrada, vals, brindis\nESCENA 3: Quinceañera feliz, familia emocionada\nCTA: "¿Querés algo así? Simulá tu presupuesto ahora. Link en bio ➡️ {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola! 😊 Acabo de ver una foto/video de sus trabajos y me encantó. ¿Pueden hacerme algo similar para los XV de mi hija?\n\n¿Tienen disponibilidad para [FECHA]? ¿Cómo funciona el presupuesto?',
  },
  'XV-cerrar-elegante': {
    ig_corto:
      '⏳ Quedan pocas fechas disponibles para este año. No dejes pasar los XV de tu hija. Simulá el presupuesto ahora y asegurá la fecha: {{LINK_SIMULADOR}}\n#XVAños #FechasDisponibles #AKProducciones',
    ig_largo:
      '⏳ Las fechas se llenan rápido.\n\nSi estás pensando en los XV de tu hija para este año, este es el momento de asegurar la fecha antes de que se ocupe.\n\nEn AK Producciones organizamos todo:\n✅ Salón propio\n✅ Coordinación total\n✅ Paquetes personalizables\n\nSimulá el presupuesto en menos de un minuto y guardá tu fecha:\n{{LINK_SIMULADOR}}\n\n💬 O escribinos directamente por WhatsApp.\n\n#XVAños #FiestasXV #AseguráTuFecha #AKProducciones',
    historias:
      '⚠️ Quedan pocas fechas para XV este año // ¿Cuándo es la fiesta de tu hija? // Asegurá la fecha ahora: {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "¿Todavía no reservaste la fecha para los XV? Ojo con esto 👀"\nESCENA 1: Calendario con fechas marcadas como ocupadas\nESCENA 2: "Las fechas de diciembre y enero ya casi no tienen lugar. Te recomendamos reservar con anticipación."\nESCENA 3: Equipo preparando un evento, salón impecable\nCTA: "Simulá el presupuesto y reservá ahora. Link en bio ➡️ {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola [NOMBRE]! 😊 ¿Siguen evaluando opciones para los XV? Te cuento que para [MES/AÑO] quedan pocas fechas disponibles.\n\nSi querés asegurar la fecha, podemos coordinar una visita al salón o mandarte el simulador de presupuesto para que veas opciones:\n{{LINK_SIMULADOR}}\n\n¿Qué fecha tenían pensada?',
  },
  'XV-reactivar-elegante': {
    ig_corto:
      '¿Seguís buscando el lugar ideal para los XV? 💜 En AK Producciones organizamos todo. Quizás podemos ayudarte. Simulá el presupuesto sin compromiso: {{LINK_SIMULADOR}}\n#XVAños #AKProducciones',
    ig_largo:
      '¿Todavía no encontraste el lugar ideal para los XV de tu hija? 💜\n\nSabemos que elegir puede ser difícil. Por eso en AK Producciones te ofrecemos transparencia total desde el primer momento: simulá el presupuesto, conocé el salón y decidís sin presión.\n\nTodo en un solo lugar, con organización completa.\n\nSimulá tu presupuesto ahora:\n{{LINK_SIMULADOR}}\n\n#XVAños #FiestasXV #OrganizaciónDeEventos #AKProducciones',
    historias:
      '¿Seguís buscando el lugar para los XV? 💜 // Sin estrés: nosotros organizamos todo // Mirá opciones sin compromiso: {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "¿Cansada de buscar lugar para los XV sin encontrar nada que convenza? 😅"\nESCENA 1: "En AK Producciones organizamos absolutamente todo. Salón, música, comida, deco."\nESCENA 2: Tour por el salón, detalles de decoraciones anteriores\nESCENA 3: Familia contenta, quinceañera radiante\nCTA: "Simulá el presupuesto sin compromiso. Link en bio ➡️ {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola [NOMBRE]! 😊 Hace un tiempo hablamos sobre los XV de tu hija. ¿Cómo van con la organización? Si todavía no definieron lugar, seguimos con disponibilidad.\n\nTe mando el simulador para que veas opciones y precios actualizados:\n{{LINK_SIMULADOR}}\n\n¿Seguimos en contacto?',
  },
};

function getBaseTemplate(
  tipo: TipoEvento,
  objetivo: ObjetivoMarketing,
  estilo: EstiloMarketing
): ContenidoCanales {
  const key: TemplateKey = `${tipo}-${objetivo}-${estilo}`;
  return (
    BASE_TEMPLATES[key] ||
    BASE_TEMPLATES[`${tipo}-${objetivo}-elegante`] ||
    BASE_TEMPLATES[`XV-captacion-elegante`]!
  );
}

// ─── Days for checklist ───────────────────────────────────────────────────────

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const TAREAS_DEFAULT = [
  { tarea: 'Historia de XV', canal: 'Historias IG' },
  { tarea: 'Post en feed', canal: 'Instagram' },
  { tarea: 'Reel / TikTok', canal: 'TikTok' },
  { tarea: 'Seguimiento WhatsApp', canal: 'WhatsApp' },
];

function buildDefaultChecklist(semana: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  DIAS_SEMANA.forEach(dia => {
    TAREAS_DEFAULT.forEach(t => {
      items.push({
        id: uid(),
        dia,
        tarea: t.tarea,
        canal: t.canal,
        estado: 'pendiente',
        semana,
      });
    });
  });
  return items;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyShareButtons({
  label,
  icon,
  text,
}: {
  label: string;
  icon: React.ReactNode;
  text: string;
}) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado ✓` });
    } catch {
      toast({ title: 'Error al copiar', variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled
      }
    } else {
      await handleCopy();
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="lg"
        variant="outline"
        className="flex-1 h-12 rounded-xl font-bold text-sm gap-2"
        onClick={handleCopy}
      >
        <Copy className="w-4 h-4" />
        Copiar
      </Button>
      <Button
        size="lg"
        className="flex-1 h-12 rounded-xl font-bold text-sm gap-2"
        onClick={handleShare}
      >
        <Share2 className="w-4 h-4" />
        Compartir
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab
  const [tab, setTab] = useState<TabMarketing>('generador');

  // Generator state
  const [tipo] = useState<TipoEvento>('XV');
  const [objetivo, setObjetivo] = useState<ObjetivoMarketing>('captacion');
  const [estilo, setEstilo] = useState<EstiloMarketing>('elegante');
  const [varNombre, setVarNombre] = useState('');
  const [varFecha, setVarFecha] = useState('');
  const [varInvitados, setVarInvitados] = useState('');
  const [varPrecioLista, setVarPrecioLista] = useState('');
  const [varPrecioHoy, setVarPrecioHoy] = useState('');
  const [varAhorro, setVarAhorro] = useState('');

  const [contenido, setContenido] = useState<ContenidoCanales>({
    ig_corto: '',
    ig_largo: '',
    historias: '',
    tiktok: '',
    whatsapp: '',
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ig_corto: true,
    ig_largo: false,
    historias: false,
    tiktok: false,
    whatsapp: true,
  });

  // Templates state
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateNombre, setTemplateNombre] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<MarketingTemplate | null>(null);

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);
  const [semana] = useState(getSemanaActual());
  const [responsable, setResponsable] = useState('');

  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await getMarketingTemplates();
      setTemplates(data);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  const loadChecklist = useCallback(async () => {
    setIsLoadingChecklist(true);
    try {
      const all = await getMarketingChecklist();
      const thisSemana = all.filter(i => i.semana === semana);
      if (thisSemana.length > 0) {
        setChecklist(thisSemana);
      } else {
        const defaults = buildDefaultChecklist(semana);
        setChecklist(defaults);
        await saveMarketingChecklist([...all, ...defaults]);
      }
    } finally {
      setIsLoadingChecklist(false);
    }
  }, [semana]);

  useEffect(() => {
    loadTemplates();
    loadChecklist();
  }, [loadTemplates, loadChecklist]);

  // ── Generator logic ────────────────────────────────────────────────────────

  const generateContent = useCallback(() => {
    const base = getBaseTemplate(tipo, objetivo, estilo);
    const vars: Record<string, string> = {
      NOMBRE: varNombre || '{{NOMBRE}}',
      FECHA: varFecha || '{{FECHA}}',
      INVITADOS: varInvitados || '{{INVITADOS}}',
      PRECIO_LISTA: varPrecioLista || '{{PRECIO_LISTA}}',
      PRECIO_HOY: varPrecioHoy || '{{PRECIO_HOY}}',
      AHORRO: varAhorro || '{{AHORRO}}',
      LINK_SIMULADOR: '/simulador-de-presupuesto',
    };
    setContenido({
      ig_corto: renderVariables(base.ig_corto, vars),
      ig_largo: renderVariables(base.ig_largo, vars),
      historias: renderVariables(base.historias, vars),
      tiktok: renderVariables(base.tiktok, vars),
      whatsapp: renderVariables(base.whatsapp, vars),
    });
  }, [tipo, objetivo, estilo, varNombre, varFecha, varInvitados, varPrecioLista, varPrecioHoy, varAhorro]);

  useEffect(() => {
    generateContent();
  }, [generateContent]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Template save/apply ────────────────────────────────────────────────────

  const handleSaveTemplate = async () => {
    if (!templateNombre.trim()) {
      toast({ title: 'Ingresá un nombre para la plantilla', variant: 'destructive' });
      return;
    }
    setIsSavingTemplate(true);
    const template: MarketingTemplate = {
      id: editingTemplate?.id || uid(),
      nombre: templateNombre.trim(),
      tags: [tipo, estilo, objetivo],
      tipo,
      objetivo,
      estilo,
      contenido: { ...contenido },
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await saveMarketingTemplate(template);
    if (result.success) {
      toast({ title: editingTemplate ? 'Plantilla actualizada ✓' : 'Plantilla guardada ✓' });
      setTemplateNombre('');
      setEditingTemplate(null);
      await loadTemplates();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsSavingTemplate(false);
  };

  const handleApplyTemplate = (t: MarketingTemplate) => {
    setContenido({ ...t.contenido });
    setTab('generador');
    toast({ title: `Plantilla "${t.nombre}" aplicada ✓` });
  };

  const handleEditTemplate = (t: MarketingTemplate) => {
    setContenido({ ...t.contenido });
    setTemplateNombre(t.nombre);
    setEditingTemplate(t);
    setTab('generador');
    toast({ title: `Editando "${t.nombre}"` });
  };

  const handleDeleteTemplate = async (id: string) => {
    const result = await deleteMarketingTemplate(id);
    if (result.success) {
      toast({ title: 'Plantilla eliminada' });
      await loadTemplates();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  // ── Checklist ──────────────────────────────────────────────────────────────

  const handleToggleItem = async (id: string) => {
    const updated = checklist.map(item => {
      if (item.id !== id) return item;
      const isDone = item.estado === 'pendiente';
      return {
        ...item,
        estado: isDone ? ('hecho' as const) : ('pendiente' as const),
        hechoBy: isDone ? (responsable || 'Usuario') : undefined,
        hechoAt: isDone ? new Date().toISOString() : undefined,
      };
    });
    setChecklist(updated);
    const all = await getMarketingChecklist();
    const otherWeeks = all.filter(i => i.semana !== semana);
    await saveMarketingChecklist([...otherWeeks, ...updated]);
  };

  // ── Backup ─────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportMarketingData();
      if (!result.success || !result.data) throw new Error(result.error);
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketing-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exportación completada ✓' });
    } catch (e: any) {
      toast({ title: 'Error al exportar', description: e.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await importMarketingData(data);
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Importación completada ✓' });
      await loadTemplates();
      await loadChecklist();
    } catch (e: any) {
      toast({ title: 'Error al importar', description: e.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Render sections ───────────────────────────────────────────────────────

  const channels: { key: keyof ContenidoCanales; label: string; icon: React.ReactNode }[] = [
    { key: 'ig_corto', label: 'Instagram (corto)', icon: <Instagram className="w-4 h-4" /> },
    { key: 'ig_largo', label: 'Instagram (largo)', icon: <Instagram className="w-4 h-4" /> },
    {
      key: 'historias',
      label: 'Historias (3 slides)',
      icon: <LayoutList className="w-4 h-4" />,
    },
    { key: 'tiktok', label: 'Guión TikTok/Reel', icon: <Film className="w-4 h-4" /> },
    {
      key: 'whatsapp',
      label: 'Respuesta WhatsApp',
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">Marketing Studio</h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
              XV Años · Premium
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-20">
        <Tabs value={tab} onValueChange={v => setTab(v as TabMarketing)} className="mt-4">
          <TabsList className="grid grid-cols-4 w-full h-12 rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="generador" className="rounded-lg text-[11px] font-bold">
              Generar
            </TabsTrigger>
            <TabsTrigger value="plantillas" className="rounded-lg text-[11px] font-bold">
              Plantillas
            </TabsTrigger>
            <TabsTrigger value="checklist" className="rounded-lg text-[11px] font-bold">
              Checklist
            </TabsTrigger>
            <TabsTrigger value="respaldo" className="rounded-lg text-[11px] font-bold">
              Respaldo
            </TabsTrigger>
          </TabsList>

          {/* ── TAB: GENERADOR ── */}
          <TabsContent value="generador" className="mt-4 space-y-4">
            {/* Selectors */}
            <Card className="rounded-2xl shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black">Configuración</CardTitle>
                <CardDescription className="text-xs">XV Años · Elegí objetivo y estilo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Objetivo
                    </Label>
                    <Select
                      value={objetivo}
                      onValueChange={v => setObjetivo(v as ObjetivoMarketing)}
                    >
                      <SelectTrigger className="h-11 rounded-xl text-sm font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="captacion">Captación</SelectItem>
                        <SelectItem value="mostrar">Mostrar trabajo</SelectItem>
                        <SelectItem value="cerrar">Cerrar venta</SelectItem>
                        <SelectItem value="reactivar">Reactivar lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Estilo
                    </Label>
                    <Select value={estilo} onValueChange={v => setEstilo(v as EstiloMarketing)}>
                      <SelectTrigger className="h-11 rounded-xl text-sm font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elegante">Elegante</SelectItem>
                        <SelectItem value="neon">Neón</SelectItem>
                        <SelectItem value="princesa">Princesa</SelectItem>
                        <SelectItem value="urbano">Urbano</SelectItem>
                        <SelectItem value="boho">Boho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Variables */}
                <Separator />
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Variables (opcional)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Nombre cliente', value: varNombre, set: setVarNombre },
                    { label: 'Fecha del evento', value: varFecha, set: setVarFecha },
                    { label: 'Cantidad invitados', value: varInvitados, set: setVarInvitados },
                    { label: 'Precio de lista', value: varPrecioLista, set: setVarPrecioLista },
                    { label: 'Precio hoy (promo)', value: varPrecioHoy, set: setVarPrecioHoy },
                    { label: 'Ahorro', value: varAhorro, set: setVarAhorro },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="space-y-0.5">
                      <Label className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {label}
                      </Label>
                      <Input
                        value={value}
                        onChange={e => set(e.target.value)}
                        placeholder={`ej: ${MARKETING_VARIABLES.find(v => v.label === label)?.ejemplo ?? ''}`}
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel outputs */}
            {channels.map(({ key, label, icon }) => (
              <Card key={key} className="rounded-2xl shadow-sm border-0 bg-white overflow-hidden">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{icon}</span>
                    <span className="text-sm font-black text-slate-800">{label}</span>
                  </div>
                  {expandedSections[key] ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {expandedSections[key] && (
                  <CardContent className="pt-0 pb-4 px-4 space-y-3">
                    <Textarea
                      value={contenido[key]}
                      onChange={e => setContenido(prev => ({ ...prev, [key]: e.target.value }))}
                      className="min-h-[120px] rounded-xl text-sm resize-none font-mono"
                    />
                    <CopyShareButtons label={label} icon={icon} text={contenido[key]} />
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Save as template */}
            <Card className="rounded-2xl shadow-sm border-0 bg-white">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {editingTemplate ? 'Actualizar plantilla' : 'Guardar como plantilla'}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la plantilla…"
                    value={templateNombre}
                    onChange={e => setTemplateNombre(e.target.value)}
                    className="h-11 rounded-xl flex-1"
                  />
                  <Button
                    className="h-11 rounded-xl px-4 gap-1 font-bold"
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BookmarkPlus className="w-4 h-4" />
                    )}
                    {editingTemplate ? 'Actualizar' : 'Guardar'}
                  </Button>
                </div>
                {editingTemplate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-400"
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateNombre('');
                    }}
                  >
                    Cancelar edición
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: PLANTILLAS ── */}
          <TabsContent value="plantillas" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Mis Plantillas</h2>
              <Badge variant="secondary" className="font-bold">
                {templates.length}
              </Badge>
            </div>

            {isLoadingTemplates ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : templates.length === 0 ? (
              <Card className="rounded-2xl border-0 shadow-sm bg-white">
                <CardContent className="p-8 text-center space-y-2">
                  <BookmarkPlus className="w-10 h-10 text-slate-200 mx-auto" />
                  <p className="text-sm text-slate-400 font-semibold">Sin plantillas guardadas</p>
                  <p className="text-xs text-slate-300">
                    Generá contenido y guardalo como plantilla para reutilizarlo.
                  </p>
                </CardContent>
              </Card>
            ) : (
              templates.map(t => (
                <Card key={t.id} className="rounded-2xl border-0 shadow-sm bg-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{t.nombre}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] font-bold capitalize">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{t.contenido.ig_corto}</p>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 h-10 rounded-xl font-bold text-sm gap-1"
                        onClick={() => handleApplyTemplate(t)}
                      >
                        <Sparkles className="w-3 h-3" />
                        Aplicar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl"
                        onClick={() => handleEditTemplate(t)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-red-500 hover:text-red-600 hover:border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará "{t.nombre}"
                              permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDeleteTemplate(t.id)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ── TAB: CHECKLIST ── */}
          <TabsContent value="checklist" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Checklist Semanal</h2>
                <p className="text-xs text-slate-400">Semana {semana}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">
                  {checklist.filter(i => i.estado === 'hecho').length}/{checklist.length} hechas
                </p>
              </div>
            </div>

            {/* Responsable */}
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Tu nombre (para registrar quién lo hizo)"
                value={responsable}
                onChange={e => setResponsable(e.target.value)}
                className="h-11 rounded-xl flex-1 text-sm"
              />
            </div>

            {isLoadingChecklist ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : (
              DIAS_SEMANA.map(dia => {
                const items = checklist.filter(i => i.dia === dia);
                if (items.length === 0) return null;
                return (
                  <div key={dia}>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                      {dia}
                    </p>
                    <div className="space-y-2">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleToggleItem(item.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                            item.estado === 'hecho'
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {item.estado === 'hecho' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-bold ${item.estado === 'hecho' ? 'line-through text-slate-400' : 'text-slate-800'}`}
                            >
                              {item.tarea}
                            </p>
                            <p className="text-[11px] text-slate-400">{item.canal}</p>
                          </div>
                          {item.estado === 'hecho' && item.hechoBy && (
                            <span className="text-[10px] text-emerald-500 font-bold shrink-0">
                              {item.hechoBy}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* ── TAB: RESPALDO ── */}
          <TabsContent value="respaldo" className="mt-4 space-y-4">
            <h2 className="text-base font-black text-slate-900">Backup y Respaldo</h2>

            <Card className="rounded-2xl border-0 shadow-sm bg-white">
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="font-black text-slate-800 mb-1">Exportar datos</p>
                  <p className="text-xs text-slate-400 mb-3">
                    Descargá todas las plantillas y checklist en un archivo JSON.
                  </p>
                  <Button
                    className="w-full h-12 rounded-xl font-bold gap-2"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Exportar marketing.json
                  </Button>
                </div>

                <Separator />

                <div>
                  <p className="font-black text-slate-800 mb-1">Importar datos</p>
                  <p className="text-xs text-slate-400 mb-3">
                    Restaurá desde un archivo JSON exportado previamente. Los datos actuales serán
                    reemplazados.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl font-bold gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Importar archivo JSON
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={handleImport}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Variables reference */}
            <Card className="rounded-2xl border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <p className="font-black text-slate-800 mb-3">Variables disponibles</p>
                <div className="space-y-2">
                  {MARKETING_VARIABLES.map(v => (
                    <div key={v.key} className="flex items-center justify-between gap-2">
                      <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-mono font-bold">
                        {v.key}
                      </code>
                      <span className="text-xs text-slate-500 flex-1 text-right">{v.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
