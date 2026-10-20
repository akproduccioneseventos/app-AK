import { contextoDeVozParaPerfil } from '@/lib/asistente/voz-en-vivo';
import { verifySession } from '@/lib/auth/session-token';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getCrmLeadsForDashboard } from '@/app/actions/crm';
import { NextResponse } from 'next/server';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { hoyEnUruguay } from '@/lib/utils';
import { buildMultiAgentTeamBriefing } from '@/lib/multiagent/diagnostics';
import {
  VOZ_EN_VIVO_USO_FILE,
  armarCuerpoFicha,
  armarInstruccionesDeVoz,
  devolverMinutos,
  direccionDeLaFicha,
  direccionDelSocket,
  versionApiEnVivo,
  minutosPermitidosPorDia,
  modelosEnVivo,
  reservarMinutos,
  resumirContextoParaVoz,
  vozValida,
  type UsoVozEnVivo,
} from '@/lib/asistente/voz-en-vivo';

/**
 * Voz en vivo del asistente (orden 105, bloque 3). Sólo el equipo con sesión: el portal del cliente
 * y los invitados NO pueden usarla (cuesta plata). Reserva los minutos del día en UNA operación de
 * la base (con lectura y escritura separadas, dos pedidos a la vez pasaban los dos) y entrega una
 * ficha de un solo uso: la clave de Google nunca sale del servidor.
 */
export const dynamic = 'force-dynamic';

const MENSAJE_SIN_MINUTOS =
  'Se llegó a los minutos de voz en vivo de hoy. Podés subirlos en Ajustes → Asistente.';

async function reservar(tope: number, hoy: string): Promise<number> {
  let reservados = 0;
  await mutarDocumentoConTransaccion<UsoVozEnVivo>(VOZ_EN_VIVO_USO_FILE, {}, (uso) => {
    const r = reservarMinutos(uso, hoy, tope);
    reservados = r.reservados;
    return r.nuevo;
  });
  return reservados;
}

async function devolver(minutos: number, hoy: string): Promise<void> {
  try {
    await mutarDocumentoConTransaccion<UsoVozEnVivo>(VOZ_EN_VIVO_USO_FILE, {}, (uso) =>
      devolverMinutos(uso, hoy, minutos),
    );
  } catch (error) {
    console.error('[voz-en-vivo] No se pudieron devolver los minutos reservados:', error);
  }
}

export async function POST() {
  // La voz en vivo está abierta para cualquier perfil interno con sesión.
  const session = await verifySession();
  if (!session.success || !session.user) {
    return NextResponse.json({ error: 'Sesión no válida o no iniciada.' }, { status: 401 });
  }
  const usuario = session.user;
  if (usuario.role === 'invitado' || usuario.role === 'cliente' || (usuario as any).esCliente) {
    return NextResponse.json({ error: 'Solo perfiles internos del equipo pueden usar la llamada.' }, { status: 403 });
  }

  const ajustes = await getAsistenteSettings();
  const tope = minutosPermitidosPorDia(ajustes.vozEnVivoMinutosPorDia);
  if (ajustes.vozEnVivoActiva === false || tope <= 0) {
    return NextResponse.json({ error: 'La voz en vivo está apagada en Ajustes → Asistente.' }, { status: 403 });
  }

  const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const apiKey = rawKey && rawKey !== 'dummy' ? rawKey.trim() : '';
  if (apiKey.length < 10) {
    return NextResponse.json({ error: 'No hay clave de Gemini configurada para la voz en vivo.' }, { status: 503 });
  }

  const hoy = hoyEnUruguay();
  let reservados = 0;
  try {
    reservados = await reservar(tope, hoy);
  } catch (error: any) {
    return NextResponse.json({ error: 'No se pudo anotar el uso de la voz en vivo. Probá de nuevo.' }, { status: 503 });
  }
  if (reservados <= 0) {
    return NextResponse.json({ error: MENSAJE_SIN_MINUTOS }, { status: 429 });
  }

  try {
    const [briefing, fiestas, prospectos] = await Promise.all([
      buildMultiAgentTeamBriefing().catch(() => null),
      getFiestas().catch(() => []),
      getCrmLeadsForDashboard().catch(() => []),
    ]);

    const contexto = contextoDeVozParaPerfil(usuario, {
      fiestas: Array.isArray(fiestas) ? fiestas : [],
      briefing: briefing as any,
      prospectos: Array.isArray(prospectos) ? prospectos : [],
    });
    const instrucciones = armarInstruccionesDeVoz(contexto);
    const voz = vozValida(ajustes.vozSeleccionada);

    // Una sola lectura de la versión: la ficha y el socket no pueden salir de versiones distintas.
    const version = versionApiEnVivo();
    let ultimoError = 'Google no entregó la ficha de la voz en vivo.';
    for (const modelo of modelosEnVivo()) {
      const respuesta = await fetch(direccionDeLaFicha(apiKey, version), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(armarCuerpoFicha({ modelo, voz, instrucciones, minutos: reservados })),
      });
      const datos: any = await respuesta.json().catch(() => ({}));
      if (respuesta.ok && typeof datos?.name === 'string' && datos.name) {
        return NextResponse.json(
          {
            token: datos.name,
            model: modelo,
            voz,
            segundosMaximos: reservados * 60,
            wsUrl: direccionDelSocket(datos.name, version),
          },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      }
      ultimoError = `Google no dio la voz en vivo (${respuesta.status}).`;
      // Un 4xx que nombra al modelo: se prueba el siguiente. Cualquier otra falla corta.
      const detalle = String(datos?.error?.message || '');
      if (!(respuesta.status >= 400 && respuesta.status < 500 && /model/i.test(detalle))) break;
    }
    await devolver(reservados, hoy);
    return NextResponse.json({ error: ultimoError }, { status: 502 });
  } catch (error: any) {
    await devolver(reservados, hoy);
    return NextResponse.json({ error: 'No se pudo conectar con Google para la voz en vivo.' }, { status: 502 });
  }
}
