import { NextResponse } from 'next/server';
import { usuarioDelEquipo } from '@/lib/auth/equipo-de-la-fiesta';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
import { nivelDeRiesgo, registrarAccionAsistente } from '@/lib/asistente/que-puede-hacer-solo';
import { ejecutarAccionSecretario } from '@/app/actions/multiagent';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { calculateFiestaPreparationScore } from '@/lib/fiesta/preparation-score';

// Cache en memoria para idempotencia: evita ejecutar dos veces el mismo toolCall
const toolCallCache = new Map<string, any>();

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

  // Idempotencia: si el id ya se ejecutó, devolvemos el resultado anterior
  if (id && toolCallCache.has(id)) {
    return NextResponse.json(toolCallCache.get(id));
  }

  // 2. Nivel de riesgo
  const riesgo = nivelDeRiesgo(accion);

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
    if (id) toolCallCache.set(id, resp);
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
    if (id) toolCallCache.set(id, resp);
    return NextResponse.json(resp);
  }

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

  // 3. Permisos por acción (mismo permiso que su pantalla)
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
        const fiestas = await getFiestas().catch(() => []);
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
        const nuevoBorrador = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          destinatario: argumentos.destinatario || 'Cliente',
          mensaje: argumentos.mensaje || '',
          creadoPor: usuario.email,
          createdAt: new Date().toISOString(),
          canal: 'whatsapp',
          manual_click: true,
          estado: 'borrador',
        };
        await mutateGenericJsonArray<any>('scheduled-messages.json', (mensajes) => [...mensajes, nuevoBorrador]);
        respuestaEjecucion = {
          success: true,
          mensaje: `Dejé listo el borrador de WhatsApp para ${argumentos.destinatario}: "${argumentos.mensaje}". Podés mandarlo con un toque desde Mi Día.`,
        };
        break;
      }

      case 'preparar_mail': {
        const resMail = await ejecutarAccionSecretario({
          accion: 'preparar_mail',
          datos: argumentos,
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

  // 4. Deja el rastro con registrarAccionAsistente
  await registrarAccionAsistente({
    pedido: accion,
    accion,
    canal: 'voz_en_vivo',
    nivel: riesgo,
    resultado: respuestaEjecucion.mensaje || respuestaEjecucion.error || 'ok',
    usuarioIdentificado: usuario.email,
  }).catch(() => {});

  if (id) {
    toolCallCache.set(id, respuestaEjecucion);
  }

  return NextResponse.json(respuestaEjecucion);
}
