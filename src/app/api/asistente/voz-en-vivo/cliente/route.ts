import { NextResponse } from 'next/server';
import { getFiestaForPortalSession } from '@/app/actions/fiesta/portal.actions';
import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { hoyEnUruguay } from '@/lib/utils';
import {
  armarCuerpoFicha,
  armarInstruccionesDeVoz,
  direccionDeLaFicha,
  modelosEnVivo,
  versionApiEnVivo,
  vozValida,
} from '@/lib/asistente/voz-en-vivo';

const USO_CLIENTE_FILE = 'asistente/voz-cliente-uso.json';
const TOPE_MINUTOS_CLIENTE_POR_DEFECTO = 5;

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido.' }, { status: 400 });
  }

  const fiestaId = body.fiestaId;
  if (!fiestaId) {
    return NextResponse.json({ error: 'Identificador de fiesta no especificado.' }, { status: 400 });
  }

  // 1. Verificación estricta de la sesión del portal de ESTA fiesta
  const fiesta = await getFiestaForPortalSession(fiestaId).catch(() => null);
  if (!fiesta || fiesta.id !== fiestaId) {
    return NextResponse.json(
      { error: 'Sesión no válida o no autorizada para esta fiesta.' },
      { status: 401 }
    );
  }

  // 2. Interruptor y tope en Ajustes
  const ajustes = await getAsistenteSettings().catch(() => ({}));
  if ((ajustes as any).vozEnVivoClienteActiva === false) {
    return NextResponse.json(
      { error: 'La asistencia por voz para clientes está temporalmente desactivada.' },
      { status: 403 }
    );
  }

  const tope = Math.max(1, Number((ajustes as any).vozEnVivoClienteMinutosPorDia) || TOPE_MINUTOS_CLIENTE_POR_DEFECTO);

  // 3. Verificación y reserva atómica de minutos del día (5 min/día por fiesta)
  const hoyStr = hoyEnUruguay();
  let alcanzadoTope = false;

  await mutarDocumentoConTransaccion<Record<string, { fecha: string; minutos: number }>>(
    USO_CLIENTE_FILE,
    {},
    (registro) => {
      const actual = registro || {};
      const usoActual = actual[fiestaId] || { fecha: hoyStr, minutos: 0 };
      const minutos = usoActual.fecha === hoyStr ? usoActual.minutos : 0;
      if (minutos >= tope) {
        alcanzadoTope = true;
        return null;
      }
      alcanzadoTope = false;
      return {
        ...actual,
        [fiestaId]: { fecha: hoyStr, minutos: minutos + 1 },
      };
    }
  );

  if (alcanzadoTope) {
    return NextResponse.json(
      { error: `Alcanzaste el tope de ${tope} minutos de voz de hoy para tu fiesta. Podés seguir conversando por el chat escrito.` },
      { status: 429 }
    );
  }

  // 4. Presupuesto global de IA
  if (!(await hayPresupuestoParaIA().catch(() => false))) {
    return NextResponse.json(
      { error: 'El asistente por voz está momentáneamente ocupado. Podés escribirnos en el chat.' },
      { status: 503 }
    );
  }

  // 5. Contexto SOLO de la fiesta del cliente (Cero sueldos, costos ni ganancias)
  const nombreEvento = fiesta.configuracion?.nombreEvento || 'Tu Fiesta';
  const tipoCelebracion = fiesta.configuracion?.tipoCelebracion || 'Celebración';
  const fechaEvento = fiesta.configuracion?.fechaEvento || 'A coordinar';
  const salon = fiesta.configuracion?.nombreLugar || 'Por definir';
  const invitadosEstimados = fiesta.configuracion?.invitadosEstimados || 0;

  const contextoLimpio = [
    `FIESTA DEL CLIENTE: ${nombreEvento}`,
    `Tipo: ${tipoCelebracion}`,
    `Fecha: ${fechaEvento}`,
    `Lugar: ${salon}`,
    `Invitados estimados: ${invitadosEstimados}`,
    'El cliente está organizando su evento con AK Producciones.',
    'Regla de Oro: Solo respondé sobre los preparativos de SU fiesta. No ejecutes acciones directas; si pide cambios o consultas especiales, decile que el equipo lo coordinará con él.',
  ].join('\n');

  // Registrar consumo de IA
  await registrarConsumoIA('voz-cliente').catch(() => {});

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const version = versionApiEnVivo();
  const voz = vozValida((ajustes as any).vozSeleccionada);
  const instrucciones = armarInstruccionesDeVoz(contextoLimpio);

  // Si hay API key real, pide la ficha temporal de Gemini
  if (apiKey && apiKey.length >= 10 && apiKey !== 'dummy') {
    try {
      const modelo = modelosEnVivo()[0];
      const res = await fetch(direccionDeLaFicha(apiKey, version), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(armarCuerpoFicha({ modelo, voz, instrucciones, minutos: 1 })),
      });
      const data: any = await res.json().catch(() => ({}));
      if (res.ok && data?.name) {
        return NextResponse.json({
          token: data.name,
          model: modelo,
          voz,
          segundosMaximos: 60,
        });
      }
    } catch {
      // Si falla la generación de la ficha en Gemini, devuelve fallback simulado
    }
  }

  return NextResponse.json({
    token: `token_cliente_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    model: modelosEnVivo()[0],
    voz,
    segundosMaximos: 60,
    modoSimulado: true,
  });
}
