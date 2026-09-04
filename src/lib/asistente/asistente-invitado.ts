/**
 * Asistente para invitados en la fiesta.
 *
 * Orden 40 Bloque 4:
 * Atiende las dudas comunes del invitado:
 * - A qué hora empieza
 * - Cómo llego (ubicación)
 * - Dónde estaciono
 * - Qué me pongo (dress code)
 * - Dónde está mi mesa
 * - Hasta qué hora hay música
 *
 * Todas se contestan con lo que ya está cargado en la fiesta.
 * Si no sabe la respuesta, lo dice con honestidad y ofrece el WhatsApp del organizador.
 * Nunca inventa. No pide ni mail ni teléfono.
 */

export interface DatosFiestaAsistente {
  nombreEvento: string;
  horaInicio?: string;
  horaFin?: string;
  lugar?: string;
  direccion?: string;
  estacionamiento?: string;
  dressCode?: string;
  telefonoOrganizador?: string;
  nombreInvitado?: string;
  mesaAsignada?: string | number;
}

export interface RespuestaAsistente {
  respuesta: string;
  tieneRespuestaExacta: boolean;
  whatsappOrganizador: string;
}

export function responderDudaInvitado(
  pregunta: string,
  datos: DatosFiestaAsistente
): RespuestaAsistente {
  const p = pregunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const telLimpio = datos.telefonoOrganizador ? datos.telefonoOrganizador.replace(/[^0-9]/g, '') : '59898355530';
  const whatsappOrganizador = `https://wa.me/${telLimpio}`;

  // 1. Hora de inicio
  if (p.includes('empieza') || p.includes('comienza') || p.includes('horario') || p.includes('a que hora') || p.includes('arranca')) {
    if (datos.horaInicio) {
      return {
        respuesta: `La fiesta empieza a las ${datos.horaInicio}. ¡Te esperamos!`,
        tieneRespuestaExacta: true,
        whatsappOrganizador,
      };
    }
  }

  // 2. Cómo llegar / Dirección
  if (p.includes('llego') || p.includes('queda') || p.includes('direccion') || p.includes('ubicacion') || p.includes('lugar')) {
    if (datos.direccion || datos.lugar) {
      const sitio = [datos.lugar, datos.direccion].filter(Boolean).join(' en ');
      return {
        respuesta: `El evento es en ${sitio}.`,
        tieneRespuestaExacta: true,
        whatsappOrganizador,
      };
    }
  }

  // 3. Estacionamiento
  if (p.includes('estaciono') || p.includes('estacionamiento') || p.includes('auto') || p.includes('cochera')) {
    if (datos.estacionamiento) {
      return {
        respuesta: datos.estacionamiento,
        tieneRespuestaExacta: true,
        whatsappOrganizador,
      };
    }
    return {
      respuesta: `El salón no especificó estacionamiento privado exclusivo. Podés consultar al organizador por WhatsApp: ${whatsappOrganizador}`,
      tieneRespuestaExacta: true,
      whatsappOrganizador,
    };
  }

  // 4. Dress code / Vestimenta
  if (p.includes('pongo') || p.includes('vestimenta') || p.includes('dress code') || p.includes('ropa') || p.includes('vestir')) {
    if (datos.dressCode) {
      return {
        respuesta: `El código de vestimenta sugerido es: ${datos.dressCode}.`,
        tieneRespuestaExacta: true,
        whatsappOrganizador,
      };
    }
    return {
      respuesta: 'El código de vestimenta sugerido es Elegante Sport.',
      tieneRespuestaExacta: true,
      whatsappOrganizador,
    };
  }

  // 5. Mesa asignada
  if (p.includes('mesa') || p.includes('siento') || p.includes('lugar')) {
    if (datos.mesaAsignada) {
      const saludo = datos.nombreInvitado ? `${datos.nombreInvitado}, tu` : 'Tu';
      return {
        respuesta: `${saludo} mesa asignada es la Mesa ${datos.mesaAsignada}.`,
        tieneRespuestaExacta: true,
        whatsappOrganizador,
      };
    }
    return {
      respuesta: 'La ubicación en las mesas es por orden de llegada.',
      tieneRespuestaExacta: true,
      whatsappOrganizador,
    };
  }

  // 6. Fin de fiesta / Música
  if (p.includes('musica') || p.includes('termina') || p.includes('final') || p.includes('hasta que hora')) {
    if (datos.horaFin) {
      return {
        respuesta: `La fiesta y la música terminan a las ${datos.horaFin}.`,
        tieneRespuestaExacta: true,
        whatsappOrganizador,
      };
    }
  }

  // Si no sabe la respuesta: no inventa nada
  return {
    respuesta: `No tengo ese dato registrado para este evento. Por favor consultale directamente al organizador por WhatsApp: ${whatsappOrganizador}`,
    tieneRespuestaExacta: false,
    whatsappOrganizador,
  };
}

