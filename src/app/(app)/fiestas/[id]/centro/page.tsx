import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Images,
  Martini,
  MonitorPlay,
  Music4,
  QrCode,
  ScanFace,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  ListChecks,
  Clapperboard,
} from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { buildAk100Readiness } from '@/lib/ak-100/ak-100-readiness';
import { formatEventDate } from '@/lib/public-experience/event-date';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AhoraEnVivo, type PuntoDelPrograma } from './ahora-en-vivo';
import { EquipoCheckIn } from '@/components/centro/EquipoCheckIn';
import { DownloadPartyBookButton } from '@/components/fiesta/DownloadPartyBookButton';
import { ComprobacionEquipo } from './comprobacion-equipo';

/**
 * Centro de Fiesta: la única pantalla para dirigir la noche.
 *
 * Reemplaza a los tableros que se enlazaban entre sí sin llevar a las
 * herramientas reales del evento. El orden es el de la cabeza de quien dirige:
 * primero qué hora es y qué toca, después cuánta gente hay y cuánta llegó,
 * después quién está trabajando, y recién al final los botones.
 *
 * Pensado para el celular, de pie y con poca luz: fondo oscuro, números
 * grandes, textos cortos y botones que se tocan con el pulgar.
 */

type PageProps = { params: Promise<{ id: string }> };

/** `aparato`: dónde se abre. En la fiesta lo primero que se pregunta es "¿esto
 *  va en la pantalla grande o en mi celular?". */
type Herramienta = { titulo: string; detalle: string; ruta: string; icono: typeof Camera; aparato: string };
type Bloque = { titulo: string; bajada: string; herramientas: Herramienta[] };

function construirBloques(fiestaId: string): Bloque[] {
  const e = (tool: string) => `/evento/${tool}/${encodeURIComponent(fiestaId)}`;
  return [
    {
      titulo: 'Lo que manejás vos',
      bajada: 'Esto queda en tu celular durante toda la noche.',
      herramientas: [
        { titulo: 'Accesos', detalle: 'Escanear el QR de los invitados', ruta: e('accesos'), icono: QrCode, aparato: 'Tu celular' },
        { titulo: 'Moderar fotos', detalle: 'Aprobar antes de que salgan al muro', ruta: e('moderacion'), icono: ShieldCheck, aparato: 'Tu celular' },
        { titulo: 'DJ', detalle: 'Pedidos de canciones', ruta: e('dj'), icono: Music4, aparato: 'Notebook del DJ' },
        { titulo: 'Buscador de mesas', detalle: 'Dónde se sienta cada invitado', ruta: e('mi-mesa'), icono: Search, aparato: 'Tu celular' },
        // Pantallas operativas del evento: cierre final y control tecnologico.
        { titulo: 'Lo tuyo, ahora', detalle: 'Lo que le toca a cada uno del equipo', ruta: `/evento/staff/${encodeURIComponent(fiestaId)}/cronograma`, icono: ListChecks, aparato: 'Celular de cada uno' },
        { titulo: 'Video del recuerdo', detalle: 'Lo mejor de la noche para el cliente', ruta: `/evento/${encodeURIComponent(fiestaId)}/video-recuerdo`, icono: Clapperboard, aparato: 'Tu celular' },
        { titulo: 'Cierre del evento', detalle: 'Checklist de cierre y devoluciones', ruta: `/fiestas/${encodeURIComponent(fiestaId)}/cierre-mundial`, icono: ShieldCheck, aparato: 'Tu celular' },
        { titulo: 'Tecnología contratada', detalle: 'Qué tecnología tiene la fiesta', ruta: `/fiestas/${encodeURIComponent(fiestaId)}/experiencia-tecnologica-ak`, icono: MonitorPlay, aparato: 'Tu celular' },
      ],
    },
    {
      titulo: 'En las pantallas del salón',
      bajada: 'Lo que ve todo el mundo. Abrilo en la pantalla o el proyector.',
      herramientas: [
        { titulo: 'Muro en vivo', detalle: 'Las fotos de los invitados, en vivo', ruta: e('muro-en-vivo'), icono: MonitorPlay, aparato: 'Pantalla grande' },
        { titulo: 'Galería', detalle: 'Repaso de todas las fotos del evento', ruta: e('galeria'), icono: Images, aparato: 'Pantalla grande' },
      ],
    },
    {
      titulo: 'Estaciones para los invitados',
      bajada: 'Cada una se abre en su propia tablet o pantalla.',
      herramientas: [
        { titulo: 'Fotocabina', detalle: 'Fotos con marco del evento', ruta: e('fotocabina'), icono: Camera, aparato: 'Tablet de la estación' },
        { titulo: 'Espejo mágico', detalle: 'Espejo interactivo', ruta: e('espejo-magico'), icono: ScanFace, aparato: 'Pantalla del espejo' },
        { titulo: 'Plataforma 360', detalle: 'Video giratorio', ruta: e('plataforma-360'), icono: MonitorPlay, aparato: 'Tablet de la 360' },
        { titulo: 'Barra', detalle: 'Pedidos y carta de tragos', ruta: e('barra'), icono: Martini, aparato: 'Tablet de la barra' },
      ],
    },
  ];
}

type ConteoInvitado = { rsvp?: string; partySize?: number; checkedIn?: boolean };

/** Cuenta personas, no filas: cada invitado puede venir acompañado. */
function contarPersonas(invitados: ConteoInvitado[], filtro: (i: ConteoInvitado) => boolean) {
  return invitados
    .filter(filtro)
    .reduce((total, i) => total + Math.max(1, Math.floor(Number(i.partySize) || 1)), 0);
}

export default async function CentroDeFiestaPage(props: PageProps) {
  const params = await props.params;
  const fiesta = await getFiestaById(params.id);

  if (!fiesta) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
        <Card className="rounded-3xl bg-white shadow-xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black text-slate-950">No encontré esta fiesta</h1>
            <Button asChild className="mt-6 rounded-2xl bg-red-600 font-bold hover:bg-red-700">
              <Link href="/eventos">Volver a eventos</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const [empleados, roles] = await Promise.all([
    getEmpleados().catch(() => []),
    getRoles().catch(() => []),
  ]);

  const readiness = buildAk100Readiness(fiesta);
  const nombre = readiness.eventName;
  const config = fiesta.configuracion ?? ({} as typeof fiesta.configuracion);
  const fecha = formatEventDate(config?.fechaEvento);

  const invitados: ConteoInvitado[] = Array.isArray(fiesta.invitados) ? fiesta.invitados : [];
  const confirmados = contarPersonas(invitados, (i) => i.rsvp === 'Confirmado');
  const llegaron = contarPersonas(invitados, (i) => Boolean(i.checkedIn));
  const faltan = Math.max(0, confirmados - llegaron);

  // Quién trabaja esta noche, con nombre y rol: en la fiesta se necesita saber a
  // quién buscar, no una lista de códigos internos.
  const equipo = (fiesta.personalAsignado ?? []).map((asignado) => ({
    empleadoId: asignado.empleadoId,
    nombre: empleados.find((e: any) => e.id === asignado.empleadoId)?.nombre ?? 'Sin asignar',
    rol: roles.find((r: any) => r.id === asignado.rolId)?.nombre ?? 'Sin rol',
    llegada: asignado.checkInTimestamp,
  }));

  const pendientes = (fiesta.tareas ?? []).filter((t) => !t.completada);

  const programa: PuntoDelPrograma[] = (fiesta.programa ?? [])
    .filter((p) => p?.hora && p?.titulo)
    .map((p) => ({ id: p.id, hora: p.hora, titulo: p.titulo }));

  const bloques = construirBloques(params.id);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Button asChild variant="outline" className="rounded-2xl border-white/20 bg-white/5 font-bold text-white hover:bg-white/10 hover:text-white">
          <Link href="/eventos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a eventos
          </Link>
        </Button>

        <header>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-red-300">Centro de fiesta</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{nombre}</h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-300">
            {fecha && <span className="capitalize">{fecha}</span>}
            {config?.nombreLugar && <span>{config.nombreLugar}</span>}
          </p>
        </header>

        <AhoraEnVivo
          fechaEvento={config?.fechaEvento ?? ''}
          horaInicio={config?.horaInicio}
          horaFin={config?.horaFin}
          programa={programa}
        />

        {/* La gente: lo segundo que se mira en la puerta y durante la cena. */}
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { etiqueta: 'Confirmadas', valor: confirmados, icono: Users, tono: 'text-slate-300', marca: 'confirmadas' },
            { etiqueta: 'Ya llegaron', valor: llegaron, icono: UserCheck, tono: 'text-emerald-300', marca: 'llegaron' },
            { etiqueta: 'Faltan llegar', valor: faltan, icono: Users, tono: 'text-amber-300', marca: 'faltan' },
          ].map((dato) => (
            <div key={dato.etiqueta} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${dato.tono}`}>
                <dato.icono className="h-4 w-4" /> {dato.etiqueta}
              </p>
              <p className="mt-1 text-4xl font-black" data-testid={`centro-${dato.marca}`}>{dato.valor}</p>
              <p className="text-xs font-semibold text-slate-500">personas</p>
            </div>
          ))}
        </section>

        {equipo.length > 0 && (
          <EquipoCheckIn fiestaId={params.id} equipo={equipo} />
        )}

        {/* El libro se armaba y no habia forma de bajarlo: el boton existia y no
            lo mostraba ninguna pantalla. Va aca, que es donde se maneja la
            fiesta y donde se entra al dia siguiente a cerrarla. */}
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
            El libro de la fiesta
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Las mejores fotos, los mensajes de los invitados y la noche hora por hora, en un
            solo archivo para entregarle al cliente.
          </p>
          <div className="mt-3">
            <DownloadPartyBookButton fiestaId={params.id} />
          </div>
        </section>

        {pendientes.length > 0 && (
          <section className="rounded-[1.5rem] border border-amber-400/25 bg-amber-400/10 p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-amber-300">
              Quedan {pendientes.length} {pendientes.length === 1 ? 'cosa sin hacer' : 'cosas sin hacer'}
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm font-semibold text-slate-200">
              {pendientes.slice(0, 5).map((tarea) => (
                <li key={tarea.id}>· {tarea.descripcion}</li>
              ))}
            </ul>
            {pendientes.length > 5 && (
              <p className="mt-2 text-xs font-semibold text-amber-200/80">y {pendientes.length - 5} más.</p>
            )}
          </section>
        )}

        {/* Preparación previa AK-100: cada área que no está lista muestra qué le falta */}
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 space-y-4" data-testid="seccion-preparacion-ak100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-400">Preparación previa</p>
              <h2 className="text-lg font-black tracking-tight text-white md:text-xl">
                Estado previo de la fiesta — {readiness.globalScore}% listo
              </h2>
            </div>
            <Link
              href={`/fiestas/${encodeURIComponent(params.id)}/ak-100`}
              className="text-xs font-bold text-red-300 hover:text-red-200 underline"
            >
              Ver detalle AK-100
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {readiness.areas.map((area) => (
              <div
                key={area.id}
                data-testid={`readiness-area-${area.id}`}
                className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-slate-100">{area.title}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    area.status === 'listo'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {area.score}%
                  </span>
                </div>
                {area.missing.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300/80">Falta para el evento:</p>
                    <ul className="space-y-0.5">
                      {area.missing.map((falta, idx) => (
                        <li key={idx} className="text-xs font-medium text-slate-300 flex items-start gap-1.5" data-testid="readiness-missing-item">
                          <span className="text-amber-400 shrink-0">•</span>
                          <span>{falta}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {area.ready.length > 0 && area.missing.length === 0 && (
                  <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                    <span>✓</span> <span>Todo listo</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <ComprobacionEquipo fiestaId={params.id} />

        {bloques.map((bloque) => (
          <section key={bloque.titulo} className="space-y-3">
            <div>
              <h2 className="text-lg font-black tracking-tight md:text-xl">{bloque.titulo}</h2>
              <p className="text-sm font-medium text-slate-400">{bloque.bajada}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {bloque.herramientas.map((h) => {
                const Icono = h.icono;
                return (
                  <Link
                    key={h.titulo}
                    href={h.ruta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-red-400/40 hover:bg-white/10"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-600/20 text-red-300">
                      <Icono className="h-6 w-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-black">{h.titulo}</span>
                      <span className="block text-sm font-medium text-slate-400">{h.detalle}</span>
                      <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-300">
                        {h.aparato}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
