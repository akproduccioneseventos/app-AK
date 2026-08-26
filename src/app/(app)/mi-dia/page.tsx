import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/session-token';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import Link from 'next/link';
import {
  CheckCircle2,
  Calendar,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getParteDeLaManana } from '@/lib/automatico/parte-manana';
import { ParteDeLaMananaPlayer } from '@/components/mi-dia/ParteDeLaMananaPlayer';

export const metadata: Metadata = {
  title: 'Mi Día - AK Producciones',
  description: 'Panel de acciones y tareas diarias del equipo.',
};

interface AccionItem {
  id: string;
  tipo: 'cobro' | 'tarea' | 'reunion' | 'decision' | 'whatsapp';
  titulo: string;
  detalle?: string;
  categoria: 'hoy' | 'proximos_dias';
  fecha?: string;
  href?: string;
  whatsappUrl?: string;
  nombreCliente?: string;
  eventoNombre?: string;
}

export default async function MiDiaPage() {
  const session = await verifySession();
  if (!session.success || !session.user) {
    redirect('/login');
  }

  const verContabilidad = puede(session.user, PERMISOS.CONTABILIDAD);
  const fiestas = await getFiestas(false).catch(() => []);

  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];

  const accionesHoy: AccionItem[] = [];
  const accionesProximas: AccionItem[] = [];

  // Recorrer fiestas para identificar acciones reales
  for (const fiesta of fiestas) {
    const nombreFiesta = fiesta.configuracion?.nombreEvento || 'Evento';
    const nombreCliente = fiesta.configuracion?.clienteNombre || fiesta.configuracion?.protagonista1Nombre || nombreFiesta;
    const telefonoCliente = fiesta.configuracion?.telefonoAsistencia;

    // Tareas
    if (Array.isArray(fiesta.tareas)) {
      for (const tarea of fiesta.tareas) {
        if (!tarea.completada && tarea.texto) {
          const item: AccionItem = {
            id: `tarea_${fiesta.id}_${tarea.id || tarea.texto}`,
            tipo: 'tarea',
            titulo: `${tarea.texto}`,
            detalle: `En ${nombreFiesta}`,
            categoria: tarea.fechaLimite && tarea.fechaLimite <= hoyStr ? 'hoy' : 'proximos_dias',
            fecha: tarea.fechaLimite,
            href: `/fiestas/nueva/tareas?fiestaId=${fiesta.id}`,
            eventoNombre: nombreFiesta,
          };
          if (item.categoria === 'hoy') {
            accionesHoy.push(item);
          } else {
            accionesProximas.push(item);
          }
        }
      }
    }

    // Reuniones
    if (Array.isArray(fiesta.reuniones)) {
      for (const reunion of fiesta.reuniones) {
        if (reunion.fecha) {
          const esHoy = reunion.fecha.split('T')[0] === hoyStr;
          const fechaReunion = new Date(reunion.fecha);
          if (esHoy || fechaReunion >= hoy) {
            const item: AccionItem = {
              id: `reunion_${fiesta.id}_${reunion.id || reunion.fecha}`,
              tipo: 'reunion',
              titulo: `Reunión con ${nombreCliente}`,
              detalle: reunion.titulo || `Coordinación de ${nombreFiesta}`,
              categoria: esHoy ? 'hoy' : 'proximos_dias',
              fecha: reunion.fecha,
              href: `/fiestas/nueva/reuniones?fiestaId=${fiesta.id}`,
              eventoNombre: nombreFiesta,
            };
            if (esHoy) {
              accionesHoy.push(item);
            } else {
              accionesProximas.push(item);
            }
          }
        }
      }
    }

    // Cobros y cuotas
    if (verContabilidad && fiesta.planDePagos && Array.isArray(fiesta.planDePagos.cuotas)) {
      for (const cuota of fiesta.planDePagos.cuotas) {
        if (cuota.estado !== 'pagado' && cuota.monto) {
          const esFechaPasadaOHoy = cuota.fechaVencimiento && cuota.fechaVencimiento <= hoyStr;
          const montoFormateado = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(cuota.monto);
          const item: AccionItem = {
            id: `cuota_${fiesta.id}_${cuota.id || cuota.descripcion || cuota.monto}`,
            tipo: 'cobro',
            titulo: `Cobrarle ${cuota.descripcion || 'la cuota'} de ${montoFormateado} a ${nombreCliente}`,
            detalle: nombreFiesta,
            categoria: esFechaPasadaOHoy ? 'hoy' : 'proximos_dias',
            fecha: cuota.fechaVencimiento,
            href: `/fiestas/nueva/plan-pagos?fiestaId=${fiesta.id}`,
            eventoNombre: nombreFiesta,
            nombreCliente,
          };
          if (esFechaPasadaOHoy) {
            accionesHoy.push(item);
          } else {
            accionesProximas.push(item);
          }
        }
      }
    }

    // Mensaje de WhatsApp preparado si hay teléfono
    if (telefonoCliente && fiesta.configuracion?.fechaEvento) {
      const diasRestantes = Math.ceil((new Date(fiesta.configuracion.fechaEvento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes >= 0 && diasRestantes <= 14) {
        const telLimpio = telefonoCliente.replace(/\D/g, '');
        const telCompleto = telLimpio.startsWith('598') ? telLimpio : `598${telLimpio.replace(/^0/, '')}`;
        const textoWA = encodeURIComponent(`¡Hola ${nombreCliente}! Te escribo desde AK Producciones para coordinar los últimos detalles de ${nombreFiesta}. ¿Cómo vienen con los preparativos?`);
        accionesHoy.push({
          id: `wa_${fiesta.id}`,
          tipo: 'whatsapp',
          titulo: `Escribirle a ${nombreCliente} para coordinar detalles`,
          detalle: `Faltan ${diasRestantes} días para ${nombreFiesta}`,
          categoria: 'hoy',
          whatsappUrl: `https://wa.me/${telCompleto}?text=${textoWA}`,
          eventoNombre: nombreFiesta,
          nombreCliente,
        });
      }
    }
  }

  const parte = await getParteDeLaManana();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Encabezado sereno */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Tu jornada de trabajo</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Mi Día</h1>
          <p className="text-sm text-slate-500 mt-1">
            Las acciones organizadas para resolver con un toque, paso a paso.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1.5 rounded-xl text-xs font-bold border-slate-200 bg-white shadow-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary" />
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Badge>
        </div>
      </div>

      {/* El Parte de la Mañana por el Encargado */}
      <ParteDeLaMananaPlayer parte={parte} />

      {/* Acciones para hoy */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Para hacer hoy
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {accionesHoy.length} {accionesHoy.length === 1 ? 'acción' : 'acciones'}
          </span>
        </div>

        {accionesHoy.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 border-slate-200 bg-slate-50/50 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-base">Por hoy está todo al día</p>
            <p className="text-xs text-slate-500 mt-1">No hay acciones que requieran tu atención hoy.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {accionesHoy.map((accion) => (
              <Card key={accion.id} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-sm sm:text-base">{accion.titulo}</p>
                    {accion.detalle && (
                      <p className="text-xs text-slate-500 font-medium">{accion.detalle}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                    {accion.whatsappUrl ? (
                      <Button
                        asChild
                        size="sm"
                        className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      >
                        <a href={accion.whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Abrir WhatsApp
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                        </a>
                      </Button>
                    ) : accion.href ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold text-xs border-slate-300 hover:bg-slate-50 gap-1.5"
                      >
                        <Link href={accion.href}>
                          Ver
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Próximos días */}
      {accionesProximas.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Más adelante
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {accionesProximas.length} {accionesProximas.length === 1 ? 'acción' : 'acciones'}
            </span>
          </div>

          <div className="space-y-3">
            {accionesProximas.slice(0, 10).map((accion) => (
              <Card key={accion.id} className="rounded-2xl border-slate-100 bg-slate-50/70 shadow-none hover:bg-white hover:shadow-sm transition-all">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="font-semibold text-slate-700 text-sm">{accion.titulo}</p>
                    {accion.detalle && (
                      <p className="text-xs text-slate-400">{accion.detalle}</p>
                    )}
                  </div>

                  {accion.href && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="rounded-xl font-bold text-xs text-slate-500 hover:text-slate-800 self-end sm:self-auto"
                    >
                      <Link href={accion.href}>
                        Ver
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
