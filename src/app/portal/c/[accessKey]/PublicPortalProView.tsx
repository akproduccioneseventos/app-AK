'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import {
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Music,
  Palette,
  PartyPopper,
  Send,
  Sparkles,
  Upload,
  Users,
  Utensils,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitClientPayment } from '@/app/actions/fiesta/portal.actions';
import { PublicFooter } from '@/components/public-footer';

interface PublicPortalProViewProps {
  fiesta: FiestaEnPlanificacion;
  companyContact: string;
  companyName: string;
  presupuesto?: Presupuesto | null;
}

const formatCurrency = (amount?: number | null) => {
  if (!amount || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date?: string) => {
  if (!date) return 'Fecha a confirmar';
  const value = new Date(date.includes('T') ? date : `${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return 'Fecha a confirmar';
  return value.toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const daysUntilEvent = (date?: string) => {
  if (!date) return null;
  const value = new Date(date.includes('T') ? date : `${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return null;
  const diff = value.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const normalize = (value: unknown) => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function getBudgetSearchText(presupuesto?: Presupuesto | null) {
  const items = presupuesto?.itemsPresupuestados ?? [];
  return items.map((item: any) => [item.nombre, item.descripcion, item.categoria, item.subcategoria].filter(Boolean).join(' ')).join(' ').toLowerCase();
}

function hasBudgetService(text: string, keywords: string[]) {
  const normalized = normalize(text);
  return keywords.some(keyword => normalized.includes(normalize(keyword)));
}

function getTotalPresupuesto(presupuesto?: Presupuesto | null) {
  if (!presupuesto) return 0;
  return (
    (presupuesto as any).totalConDescuento ??
    (presupuesto as any).totalFinal ??
    (presupuesto as any).costoTotalEstimado ??
    (presupuesto as any).total ??
    0
  );
}

export default function PublicPortalProView({ fiesta, companyContact, companyName, presupuesto }: PublicPortalProViewProps) {
  const config = fiesta.configuracion ?? {};
  const settings = fiesta.clientPortalSettings;
  const portalExperience = fiesta.clientePortalExperience ?? {};
  const presupuestoText = getBudgetSearchText(presupuesto);

  const eventNameRaw = portalExperience.eventDisplayName || config.nombreEvento;
  const isDefaultEventName = !eventNameRaw || eventNameRaw === 'Nuevo Evento' || eventNameRaw === 'Evento sin configurar';
  const eventName = isDefaultEventName ? 'Portal en preparación' : eventNameRaw;
  const isDefaultLink = settings?.accessKey === 'CLIENTE1';
  const isUnconfigured = isDefaultEventName || isDefaultLink || !config.fechaEvento || !presupuesto;

  const eventColor =
    portalExperience.primaryColor ||
    (config as any).primaryColor ||
    fiesta.invitacionDigital?.cabecera?.paletaColores?.primary ||
    fiesta.decoracion?.paletaColores?.primary ||
    '#7c3aed';

  const heroImage = portalExperience.heroImageUrl || (config as any).protagonistaFotoUrl || fiesta.invitacionDigital?.detallesEvento?.celebracion?.imagenUrl || '';
  const eventDate = formatDate(config.fechaEvento);
  const days = daysUntilEvent(config.fechaEvento);

  const invitados = fiesta.invitados ?? [];
  const confirmados = invitados.filter((inv: any) => inv.rsvp === 'Confirmado');
  const cancelados = invitados.filter((inv: any) => inv.rsvp === 'Rechazado' || inv.rsvp === 'Cancelado');
  const pendientes = invitados.filter((inv: any) => !inv.rsvp || inv.rsvp === 'Pendiente' || inv.rsvp === 'Tal vez');

  const totalPresupuesto = getTotalPresupuesto(presupuesto);
  const pagos = presupuesto?.pagosCliente ?? [];
  const pagosConfirmados = pagos.filter((p: any) => p.estadoPago !== 'pendiente_confirmacion');
  const totalPagado = pagosConfirmados.reduce((sum: number, pago: any) => sum + (Number(pago.monto) || 0), 0);
  const saldoPendiente = Math.max(0, totalPresupuesto - totalPagado);
  const porcentajePagado = totalPresupuesto > 0 ? Math.min(100, Math.round((totalPagado / totalPresupuesto) * 100)) : 0;

  const pendingTasks = [
    ...(fiesta.clienteDebeLlevar ?? []).map((item: any) => ({ id: item.id, text: item.texto, done: item.completado || item.estado === 'listo' || item.estado === 'revisado' })),
    ...(fiesta.clientChecklist ?? []).map((item: any) => ({ id: item.id, text: item.texto || item.titulo, done: item.completada })),
  ].filter(task => task.text && !task.done);

  const nextStep = useMemo(() => {
    if (isDefaultLink) return { title: 'Personalizar link del portal', text: 'Este portal sigue usando CLIENTE1. AK debe cambiarlo antes de enviarlo al cliente.', action: 'Pendiente de AK' };
    if (!presupuesto) return { title: 'Presupuesto pendiente', text: 'Todavía no hay un presupuesto vinculado a este portal.', action: 'Pendiente de AK' };
    if (saldoPendiente > 0) return { title: 'Próximo pago pendiente', text: `Saldo actual: ${formatCurrency(saldoPendiente)}.`, action: 'Hacer pago' };
    if (pendingTasks.length > 0) return { title: 'Tarea pendiente', text: pendingTasks[0].text, action: 'Ver tareas' };
    if (pendientes.length > 0) return { title: 'Invitados pendientes', text: `Hay ${pendientes.length} invitado(s) sin confirmar.`, action: 'Revisar invitados' };
    return { title: 'Todo viene bien', text: 'La información principal del evento está encaminada.', action: 'Ver organización' };
  }, [isDefaultLink, presupuesto, saldoPendiente, pendingTasks, pendientes.length]);

  const services = [
    {
      title: 'Música y discoteca',
      icon: Music,
      active: hasBudgetService(presupuestoText, ['discoteca', 'dj', 'musica', 'música', 'sonido', 'luces', 'vals']) || !!settings?.musica?.visible,
      text: 'Canciones especiales, momentos importantes y coordinación musical.',
    },
    {
      title: 'Fotografía y video',
      icon: Camera,
      active: hasBudgetService(presupuestoText, ['fotografia', 'fotografía', 'filmacion', 'filmación', 'video', 'pintada']) || !!settings?.fotografiaYFilmacion?.visible,
      text: 'Cobertura, exteriores, video de vida y entregas.',
    },
    {
      title: 'Comida y bebidas',
      icon: Utensils,
      active: hasBudgetService(presupuestoText, ['catering', 'menu', 'menú', 'entrada', 'plato', 'postre', 'barra', 'tragos', 'bebida', 'refresco', 'cerveza']) || !!settings?.menu?.visible || !!settings?.calculadoraBebidas?.visible,
      text: 'Menú, bebidas, cantidades y observaciones gastronómicas.',
    },
    {
      title: 'Decoración',
      icon: Palette,
      active: hasBudgetService(presupuestoText, ['decoracion', 'decoración', 'globos', 'ambientacion', 'ambientación', 'flores']) || !!settings?.moodboard?.visible,
      text: 'Colores, moodboard, referencias y estilo visual.',
    },
    {
      title: 'Invitados y mesas',
      icon: Users,
      active: invitados.length > 0 || !!settings?.invitados?.visible,
      text: 'Confirmaciones, cancelaciones, pendientes y distribución.',
    },
    {
      title: 'Cartelería y detalles',
      icon: ImageIcon,
      active: !!fiesta.menuMesa || !!fiesta.numerosMesa || !!settings?.cartaTragos?.visible,
      text: 'Menú de mesa, números de mesa, carta de tragos y diseños.',
    },
  ].filter(service => service.active || !presupuesto);

  const reuniones = fiesta.reuniones ?? [];
  const documentos = [
    ...(fiesta.othersDocumentos ?? []),
    ...((fiesta as any).documentos ?? []),
  ];

  const whatsappNumber = companyContact.replace(/\D/g, '');
  const whatsappText = encodeURIComponent(`Hola AK, soy cliente del evento "${eventName}" y quiero hacer una consulta.`);
  const whatsappHref = whatsappNumber.length >= 7 ? `https://wa.me/${whatsappNumber}?text=${whatsappText}` : `https://wa.me/?text=${whatsappText}`;

  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoNota, setPagoNota] = useState('');
  const [pagoFile, setPagoFile] = useState<File | null>(null);
  const [pagoFileBase64, setPagoFileBase64] = useState<string | undefined>();
  const [pagoLoading, setPagoLoading] = useState(false);
  const [pagoSuccess, setPagoSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    setPagoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPagoFileBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitPago = async () => {
    const amount = Number(pagoMonto.replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) return;
    setPagoLoading(true);
    try {
      const result = await submitClientPayment(fiesta.id, amount, pagoFileBase64, pagoFile?.name || pagoNota || undefined);
      if (result.success) {
        setPagoSuccess(true);
        setPagoMonto('');
        setPagoNota('');
        setPagoFile(null);
        setPagoFileBase64(undefined);
      }
    } finally {
      setPagoLoading(false);
    }
  };

  return (
    <div id="portal-cliente-pro-view" className="min-h-screen bg-slate-100 text-slate-900">
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: heroImage ? `linear-gradient(90deg, rgba(15,23,42,.82), rgba(15,23,42,.35)), url(${heroImage}) center/cover` : `linear-gradient(135deg, ${eventColor}, #111827)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Badge className="bg-white/20 border-white/20 text-white">Portal Cliente VIP</Badge>
            <Badge className="bg-amber-400 text-slate-950 border-0 font-black">{companyName}</Badge>
            {isUnconfigured && <Badge className="bg-red-500 text-white border-0">Portal sin completar</Badge>}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_.9fr] items-end">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-white/80">{config.tipoCelebracion || 'Evento'}</p>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">{eventName}</h1>
                {portalExperience.welcomeMessage && <p className="mt-3 text-lg text-white/90 max-w-2xl">{portalExperience.welcomeMessage}</p>}
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2"><Calendar className="w-4 h-4" />{eventDate}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2"><Clock className="w-4 h-4" />{config.horaInicio || 'Hora a confirmar'}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2"><MapPin className="w-4 h-4" />{config.nombreLugar && config.nombreLugar !== 'Salón a definir' ? config.nombreLugar : 'Lugar a confirmar'}</span>
              </div>
            </div>

            <Card className="bg-white/95 text-slate-900 rounded-3xl border-0 shadow-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl grid place-items-center text-white" style={{ backgroundColor: eventColor }}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider font-black text-slate-500">Tu próximo paso</p>
                    <p className="text-lg font-black">{nextStep.title}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{nextStep.text}</p>
                <div className="flex gap-2">
                  <Button className="flex-1 rounded-2xl" style={{ backgroundColor: eventColor }} onClick={() => setShowPagoModal(true)}>
                    <Wallet className="w-4 h-4 mr-2" /> Hacer pago
                  </Button>
                  <Button variant="outline" className="rounded-2xl" asChild>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer"><MessageSquare className="w-4 h-4" /></a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {isUnconfigured && (
          <Card className="rounded-3xl border-amber-200 bg-amber-50">
            <CardContent className="p-5 space-y-2 text-amber-900">
              <p className="font-black">Este portal está en preparación</p>
              <p className="text-sm">Funciona el link, pero todavía faltan datos reales: nombre del evento, presupuesto, contrato, pagos o link personalizado. No lo envíes al cliente final hasta completar esos datos.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[.85fr_1.5fr]">
          <aside className="space-y-4">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-5 h-5" /> Invitados</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-2xl font-black text-emerald-700">{confirmados.length}</p><p className="text-xs text-slate-500">Aceptaron</p></div>
                <div className="rounded-2xl bg-amber-50 p-3"><p className="text-2xl font-black text-amber-700">{pendientes.length}</p><p className="text-xs text-slate-500">Pendientes</p></div>
                <div className="rounded-2xl bg-red-50 p-3"><p className="text-2xl font-black text-red-700">{cancelados.length}</p><p className="text-xs text-slate-500">Cancelaron</p></div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Mensajes con AK</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">{fiesta.clientNotes || 'No hay mensajes cargados todavía.'}</p>
                <Button variant="outline" className="w-full rounded-2xl" asChild>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">Enviar mensaje</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Tareas pendientes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pendingTasks.length === 0 ? (
                  <p className="text-sm text-slate-500">No tenés tareas pendientes por ahora.</p>
                ) : pendingTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="rounded-2xl bg-slate-50 border p-3 text-sm">{task.text}</div>
                ))}
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-4">
            <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Pagos y documentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Total contratado</p><p className="text-xl font-black">{formatCurrency(totalPresupuesto)}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Pagado</p><p className="text-xl font-black text-emerald-700">{formatCurrency(totalPagado)}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Saldo</p><p className="text-xl font-black text-amber-700">{formatCurrency(saldoPendiente)}</p></div>
                </div>
                {totalPresupuesto > 0 && (
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${porcentajePagado}%`, backgroundColor: eventColor }} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-2xl" style={{ backgroundColor: eventColor }} onClick={() => setShowPagoModal(true)}>Hacer pago</Button>
                  <Button variant="outline" className="rounded-2xl"><FileText className="w-4 h-4 mr-2" /> Ver documentos</Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border p-3 text-sm">Contrato: {fiesta.contratoServicioTexto ? 'Cargado' : 'Sin configurar'}</div>
                  <div className="rounded-2xl border p-3 text-sm">Documentos: {documentos.length || 'Sin documentos cargados'}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><PartyPopper className="w-5 h-5" /> Organización de la fiesta</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {services.map(service => {
                  const Icon = service.icon;
                  return (
                    <div key={service.title} className="rounded-3xl border bg-white p-4 space-y-2">
                      <div className="w-10 h-10 rounded-2xl grid place-items-center text-white" style={{ backgroundColor: eventColor }}><Icon className="w-5 h-5" /></div>
                      <p className="font-black">{service.title}</p>
                      <p className="text-sm text-slate-600">{service.text}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-5 h-5" /> Reuniones</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  {reuniones.length === 0 ? 'No hay reuniones cargadas todavía.' : reuniones.slice(0, 3).map((r: any) => <div key={r.id} className="rounded-2xl border p-3">{r.titulo || r.tema || 'Reunión'} — {formatDate(r.fecha)}</div>)}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><HelpCircle className="w-5 h-5" /> Preguntas frecuentes</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  {(fiesta.faqPortal ?? []).length === 0 ? 'Todavía no hay preguntas frecuentes cargadas.' : (fiesta.faqPortal ?? []).slice(0, 3).map((faq: any) => <div key={faq.id} className="rounded-2xl border p-3"><strong>{faq.pregunta}</strong><br />{faq.respuesta}</div>)}
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      {showPagoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Informar pago</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowPagoModal(false)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {pagoSuccess ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800 text-sm">Pago informado correctamente. AK lo revisará y confirmará.</div>
              ) : (
                <>
                  <Input placeholder="Monto pagado" value={pagoMonto} onChange={e => setPagoMonto(e.target.value)} />
                  <Textarea placeholder="Nota opcional" value={pagoNota} onChange={e => setPagoNota(e.target.value)} />
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
                  <Button variant="outline" className="w-full rounded-2xl" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> {pagoFile ? pagoFile.name : 'Subir comprobante'}</Button>
                  <Button className="w-full rounded-2xl" style={{ backgroundColor: eventColor }} onClick={submitPago} disabled={pagoLoading}>{pagoLoading ? 'Enviando...' : <><Send className="w-4 h-4 mr-2" /> Informar pago</>}</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
