import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/session-token';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { buildPuestaAlDiaReporte, PuestaAlDiaGravedad } from '@/lib/commercial-flow/puesta-al-dia';
import { 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  CalendarClock, 
  ArrowRight,
  TrendingUp,
  Inbox
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Repaso de la Mañana - AK Producciones',
  description: 'Panel de control diario para seguimiento de agendas y saldos pendientes.',
};

export default async function RepasoDiarioPage() {
  const session = await verifySession();
  if (!session.success || !session.user) {
    redirect('/login');
  }

  // Verificar si tiene acceso a contabilidad para ver montos y cobros
  const verContabilidad = puede(session.user, PERMISOS.CONTABILIDAD);

  // Cargar datos (TODO: Idealmente hacer cache o revalidar por tiempo si es pesado)
  const fiestas = await getFiestas(false); // Solo fiestas abiertas
  const presupuestos = await getPresupuestos(true); // Incluir archivados para no reportar "sin evento" falsos
  
  // Extraer las IDs de las fiestas archivadas
  const todasLasFiestas = await getFiestas(true);
  const presupuestosConEventoArchivado = new Set(
    todasLasFiestas
      .filter(f => f.estado?.toLowerCase().includes('archiv') || f.estado?.toLowerCase().includes('cerrad'))
      .map(f => f.presupuestoId)
      .filter(Boolean) as string[]
  );

  const reporteRaw = buildPuestaAlDiaReporte(
    fiestas,
    presupuestos,
    new Date(),
    presupuestosConEventoArchivado
  );

  // Filtrar el reporte según los permisos del usuario
  const itemsVisibles = reporteRaw.items.filter(item => {
    if (item.gravedad === 'cobrar' && !verContabilidad) return false;
    return true;
  });

  const totalParaCobrar = itemsVisibles.filter(i => i.gravedad === 'cobrar').length;
  const totalParaOrdenar = itemsVisibles.filter(i => i.gravedad === 'ordenar').length;
  const plataPendienteVisible = verContabilidad ? reporteRaw.totales.plataPendiente : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Repaso de la Mañana</h1>
        <p className="text-slate-500 max-w-2xl">
          Eventos que ya pasaron y quedaron abiertos, presupuestos desfasados y plata sin cobrar. 
          Un pantallazo rápido para mantener el sistema limpio y al día.
        </p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {verContabilidad && (
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <h2 className="font-semibold text-slate-700">Por Cobrar</h2>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{totalParaCobrar}</p>
              <p className="text-sm text-slate-500 font-medium">alertas de saldos o ajustes</p>
            </div>
            {plataPendienteVisible > 0 && (
              <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Monto estimado</span>
                <span className="text-sm font-bold text-rose-600">
                  UYU {plataPendienteVisible.toLocaleString('es-UY')}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h2 className="font-semibold text-slate-700">Para Ordenar</h2>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{totalParaOrdenar}</p>
            <p className="text-sm text-slate-500 font-medium">eventos atrasados o mal vinculados</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="font-semibold text-slate-700">Monitoreo</h2>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{reporteRaw.totales.yaPasaron}</p>
            <p className="text-sm text-slate-500 font-medium">eventos recientes evaluados</p>
          </div>
        </div>
      </div>

      {/* Lista Detallada */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Tareas Pendientes</h2>
        </div>
        
        {itemsVisibles.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">¡Todo al día!</p>
              <p className="text-slate-500">No hay alertas de cobros ni eventos desfasados.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {itemsVisibles.map((item, idx) => (
              <div 
                key={`${item.fiestaId}-${item.fecha}-${idx}`} 
                className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-6 md:items-center"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      item.gravedad === 'cobrar' 
                        ? 'bg-rose-100 text-rose-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.gravedad === 'cobrar' ? 'COBRO' : 'ORDEN'}
                    </span>
                    <h3 className="font-bold text-slate-900">{item.nombre}</h3>
                    <span className="text-sm text-slate-400 font-medium">
                      ({new Date(item.fecha).toLocaleDateString('es-UY')})
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{item.queLePasa}</p>
                  <p className="text-indigo-600 text-sm font-medium flex items-center gap-1">
                    <ArrowRight className="w-4 h-4" />
                    {item.queHacer}
                  </p>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 md:w-64 shrink-0">
                  {item.montoPendiente && item.montoPendiente > 0 && verContabilidad ? (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Monto Estimado</p>
                      <p className="font-bold text-rose-600">
                        UYU {item.montoPendiente.toLocaleString('es-UY')}
                      </p>
                    </div>
                  ) : <div />}
                  
                  {item.href ? (
                    <Link 
                      href={item.href}
                      className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      Revisar
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
