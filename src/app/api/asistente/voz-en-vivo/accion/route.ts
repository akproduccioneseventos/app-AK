import { NextResponse } from 'next/server';
import { usuarioDelEquipo } from '@/lib/auth/equipo-de-la-fiesta';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
import { nivelDeRiesgo, registrarAccionAsistente } from '@/lib/asistente/que-puede-hacer-solo';
import { ejecutarAccionSecretario } from '@/app/actions/multiagent';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { calculateFiestaPreparationScore } from '@/lib/fiesta/preparation-score';

// Cache en memoria para idempotencia: evita ejecutar dos veces el mismo toolCall por usuario
const toolCallCache = new Map<string, any>();
// Coordinación de peticiones concurrentes para el mismo id e intento
const inFlightPromises = new Map<string, Promise<any>>();

export async function POST(request: Request) {
  // 1. Pide sesión de un usuario del equipo con permisos reales (no perfil personal sin permisos)
  const usuario = await usuarioDelEquipo();
  if (!usuario) {
    return NextResponse.json({ error: 'Solo miembros del equipo con permisos pueden ejecutar acciones de voz' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  const { id, accion, argumentos = {}, confirmado = false } = body;
  if (!accion) {
    return NextResponse.json({ error: 'Acción no especificada' }, { status: 400 });
  }

  const ACCIONES_CONOCIDAS = [
    'crear_tarea',
    'anotar_recordatorio',
    'agendar_reunion',
    'ver_mi_semana',
    'cuanto_me_deben',
    'que_falta_de_la_fiesta',
    'preparar_borrador_whatsapp',
    'preparar_mail',
  ];

  if (!ACCIONES_CONOCIDAS.includes(accion)) {
    return NextResponse.json({
      success: false,
      mensaje: 'Eso todavía no lo sé hacer',
      error: 'Acción no soportada',
    });
  }

  // 2. Permisos por acción: SE VALIDAN ANTES DE CONSULTAR EL CACHE (Codex 171/205)
  if ((accion === 'crear_tarea' || accion === 'anotar_recordatorio') && !puede(usuario, PERMISOS.ORGANIZACION)) {
    return NextResponse.json(
      { success: false, error: 'Tu perfil no tiene permiso de ORGANIZACION para crear tareas o recordatorios.' },
      { status: 403 }
    );
  }

  if (accion === 'cuanto_me_deben' && !puede(usuario, PERMISOS.CONTABILIDAD)) {
    return NextResponse.json(
      { success: false, error: 'Tu perfil no tiene permiso de CONTABILIDAD para consultar deudas o saldos.' },
      { status: 403 }
    );
  }

  if (accion === 'que_falta_de_la_fiesta' && !puede(usuario, PERMISOS.ORGANIZACION)) {
    return NextResponse.json(
      { success: false, error: 'Tu perfil no tiene permiso de ORGANIZACION para consultar pendientes de fiestas.' },
      { status: 403 }
    );
  }

  const riesgo = nivelDeRiesgo(accion);

  // Si requiere confirmación y toca fechas o dinero, sólo el dueño lo confirma
  if (riesgo === 'pregunta' && confirmado) {
    const esDuenio = puede(usuario, PERMISOS.ADMINISTRACION);
    const tocaPlataOFechas = /reunion|fecha|gasto|precio|cobro|pago/i.test(accion);
    if (tocaPlataOFechas && !esDuenio) {
      return NextResponse.json(
        { success: false, error: 'Solo el dueño puede confirmar acciones que tocan fechas o dinero.' },
        { status: 403 }
      );
    }
  }

  // Clave de cache ligada al actor y al id del intento
  const cacheKey = `${usuario.email || (usuario as any).userId || 'anon'}:${accion}:${id || 'sin-id'}`;

  // Idempotencia: si el id ya se ejecutó para este usuario, devolvemos el resultado anterior,
  // A MENOS que se esté enviando confirmado: true y el resultado previo estuviera esperando confirmación.
  if (id && toolCallCache.has(cacheKey)) {
    const cached = toolCallCache.get(cacheKey);
    if (!(confirmado && cached?.esperandoConfirmacion)) {
      return NextResponse.json(cached);
    }
  }

  // Coordinar peticiones concurrentes para el mismo id
  if (id && inFlightPromises.has(cacheKey)) {
    const cachedResult = await inFlightPromises.get(cacheKey);
    return NextResponse.json(cachedResult);
  }

  if (riesgo === 'nunca') {
    await registrarAccionAsistente({
      pedido: accion,
      accion,
      canal: 'voz_en_vivo',
      nivel: 'nunca',
      resultado: 'rechazado_por_regla_del_dueno',
      usuarioIdentificado: usuario.email,
    }).catch(() => {});

    const resp = {
      success: false,
      error: 'Eso lo tenés que hacer vos desde su pantalla',
      mensaje: 'Eso lo tenés que hacer vos desde su pantalla',
    };
    if (id) toolCallCache.set(cacheKey, resp);
    return NextResponse.json(resp);
  }

  if (riesgo === 'pregunta' && !confirmado) {
    await registrarAccionAsistente({
      pedido: accion,
      accion,
      canal: 'voz_en_vivo',
      nivel: 'pregunta',
      resultado: 'esperando_confirmacion_del_usuario',
      usuarioIdentificado: usuario.email,
    }).catch(() => {});

    const resp = {
      success: true,
      esperandoConfirmacion: true,
      mensaje: `Voy a hacer esto: ${accion.replace(/_/g, ' ')}. ¿Lo hago?`,
    };
    if (id) toolCallCache.set(cacheKey, resp);
    return NextResponse.json(resp);
  }

  // Función de ejecución real coordinable para llamadas concurrentes
  const ejecutarAccion = async () => {
    let respuestaEjecucion: any = { success: true };

    try {
      switch (accion) {
        case 'crear_tarea': {
          const nuevaTarea = {
            id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: argumentos.titulo || 'Nueva tarea creada por voz',
            description: argumentos.descripcion || `Para: ${argumentos.paraQuien || 'Equipo'}`,
            status: 'pending',
            createdAt: new Date().toISOString(),
            creadaPor: usuario.email,
          };
          await mutateGenericJsonArray<any>('tasks.json', (tareas) => [...tareas, nuevaTarea]);
          respuestaEjecucion = {
            success: true,
            mensaje: `Tarea "${nuevaTarea.title}" creada con éxito.`,
            tarea: nuevaTarea,
          };
          break;
        }

        case 'anotar_recordatorio': {
          const nuevo = {
            id: `rec_${Date.now()}`,
            texto: argumentos.recordatorio || 'Recordatorio',
            fechaHora: argumentos.fechaHora || new Date().toISOString(),
            creadoPor: usuario.email,
          };
          await mutateGenericJsonArray<any>('asistente/recordatorios.json', (recs) => [...recs, nuevo]);
          respuestaEjecucion = {
            success: true,
            mensaje: `Recordatorio anotado para ${nuevo.fechaHora}.`,
            recordatorio: nuevo,
          };
          break;
        }

        case 'agendar_reunion': {
          const resReunion = await ejecutarAccionSecretario({
            accion: 'agendar_reunion',
            datos: argumentos,
            confirmado: true,
          });
          respuestaEjecucion = resReunion;
          break;
        }

        case 'ver_mi_semana': {
          const resSemana = await ejecutarAccionSecretario({
            accion: 'ver_mi_semana',
            datos: argumentos,
          });
          respuestaEjecucion = resSemana;
          break;
        }

        case 'cuanto_me_deben': {
          const resDeuda = await ejecutarAccionSecretario({
            accion: 'cuanto_me_deben',
            datos: argumentos,
          });
          respuestaEjecucion = resDeuda;
          break;
        }

        case 'que_falta_de_la_fiesta': {
          const nombreBuscado = String(argumentos.nombreFiesta || '').toLowerCase().trim();
          let fiestas: any[];
          try {
            fiestas = await getFiestas();
          } catch {
            return {
              success: false,
              error: 'Falla al leer fiestas',
              mensaje: 'No pude leer las fiestas para consultar los pendientes.',
            };
          }

          const candidatas = fiestas.filter((f: any) => {
            const nom = (f.configuracion?.nombreEvento || f.configuracion?.clienteNombre || '').toLowerCase();
            return nom.includes(nombreBuscado);
          });

          if (candidatas.length === 0) {
            respuestaEjecucion = {
              success: true,
              mensaje: `No encontré ninguna fiesta próxima que coincida con "${argumentos.nombreFiesta}".`,
            };
          } else if (candidatas.length > 1) {
            const nombres = candidatas.map((f: any) => f.configuracion?.nombreEvento || f.configuracion?.clienteNombre).join(' y ');
            respuestaEjecucion = {
              success: true,
              mensaje: `Encontré dos fiestas parecidas: ${nombres}. ¿De cuál querés saber los pendientes?`,
            };
          } else {
            const f = candidatas[0];
            const prep = calculateFiestaPreparationScore(f);
            const rawPendientes = prep.importantPending || [];
            const pendientes = rawPendientes.map((p: any) => typeof p === 'string' ? p : p.label || p.title || 'pendiente');
            const nombreFiesta = f.configuracion?.nombreEvento || f.configuracion?.clienteNombre;
            if (pendientes.length === 0) {
              respuestaEjecucion = {
                success: true,
                mensaje: `A la fiesta de ${nombreFiesta} no le queda ningún pendiente crítico. Está todo listo.`,
              };
            } else {
              respuestaEjecucion = {
                success: true,
                mensaje: `A la fiesta de ${nombreFiesta} le falta: ${pendientes.slice(0, 3).join(', ')}.`,
                pendientes,
              };
            }
          }
          break;
        }

        case 'preparar_borrador_whatsapp': {
          const targetName = argumentos.destinatario || argumentos.targetName || 'Cliente';
          const targetPhone = argumentos.telefono || argumentos.targetPhone || '';
          const messageText = argumentos.mensaje || argumentos.messageText || '';

          // Contrato esperado por src/app/(app)/contabilidad/crm/outbox/page.tsx
          const nuevoBorrador = {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            targetName,
            targetPhone,
            messageText,
            channel: 'whatsapp',
            status: 'pendiente',
            scheduledAt: new Date().toISOString(),
            targetType: 'prospecto',
            templateType: 'personalizado',
            sendingMode: 'manual_click',
            destinatario: targetName,
            mensaje: messageText,
            canal: 'whatsapp',
            estado: 'borrador',
            creadoPor: usuario.email,
            createdAt: new Date().toISOString(),
            manual_click: true,
          };
          await mutateGenericJsonArray<any>('scheduled-messages.json', (mensajes) => [...mensajes, nuevoBorrador]);
          respuestaEjecucion = {
            success: true,
            mensaje: `Dejé listo el borrador de WhatsApp para ${targetName}: "${messageText}". Podés mandarlo con un toque desde Mi Día.`,
            borrador: nuevoBorrador,
          };
          break;
        }

        case 'preparar_mail': {
          const resMail = await ejecutarAccionSecretario({
            accion: 'preparar_mail',
            datos: argumentos,
            confirmado: Boolean(confirmado),
          });
          respuestaEjecucion = resMail;
          break;
        }

        default: {
          respuestaEjecucion = {
            success: false,
            mensaje: 'Eso todavía no lo sé hacer',
          };
        }
      }
    } catch (err: any) {
      respuestaEjecucion = {
        success: false,
        error: err.message || 'Error al ejecutar la acción.',
      };
    }

    // Deja el rastro con registrarAccionAsistente
    await registrarAccionAsistente({
      pedido: accion,
      accion,
      canal: 'voz_en_vivo',
      nivel: riesgo,
      resultado: respuestaEjecucion.mensaje || respuestaEjecucion.error || 'ok',
      usuarioIdentificado: usuario.email,
    }).catch(() => {});

    if (id) {
      toolCallCache.set(cacheKey, respuestaEjecucion);
    }

    return respuestaEjecucion;
  };

  if (id) {
    const promise = ejecutarAccion();
    inFlightPromises.set(cacheKey, promise);
    try {
      const resp = await promise;
      return NextResponse.json(resp);
    } finally {
      inFlightPromises.delete(cacheKey);
    }
  }

  const resp = await ejecutarAccion();
  return NextResponse.json(resp);
}
