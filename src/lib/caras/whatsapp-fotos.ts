export const VENTANA_WHATSAPP_FOTOS_MS = 2 * 60 * 60 * 1000;

export function esRespuestaBajaWhatsapp(texto?: string | null): boolean {
  const norm = String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return norm === 'no' || norm === 'baja' || norm === 'stop' || norm === 'cancelar';
}

export function armarMensajeWhatsappFotos(params: {
  nombre: string;
  cantidad: number;
  nombreEvento: string;
  linkMisFotos?: string;
}): string {
  const nombreLimpio = (params.nombre || 'Invitado').trim() || 'Invitado';
  const eventoLimpio = (params.nombreEvento || 'la fiesta').trim() || 'la fiesta';
  const sufijoFoto = params.cantidad === 1 ? 'foto' : 'fotos';
  const base = `¡Hola ${nombreLimpio}! Aparecés en ${params.cantidad} ${sufijoFoto} de ${eventoLimpio} 📸`;
  return params.linkMisFotos ? `${base} Mirá tus fotos acá: ${params.linkMisFotos}` : base;
}

export function calcularEstimadoMensajesFotosWhatsapp(
  invitados: Array<{
    contacto?: string;
    rsvp?: string;
    whatsappFotosBaja?: boolean;
  }> = [],
): {
  invitadosConTelefono: number;
  mensajesEstimados: number;
  leyendaCosto: string;
} {
  const elegibles = invitados.filter((inv) => {
    if (!inv || inv.rsvp === 'Rechazado' || inv.whatsappFotosBaja) return false;
    const digits = String(inv.contacto || '').replace(/\D/g, '');
    return digits.length >= 8;
  });
  const invitadosConTelefono = elegibles.length;
  // Estimación conservadora de 1 tanda en vivo + 1 resumen al día siguiente por invitado con teléfono.
  const mensajesEstimados = invitadosConTelefono * 2;
  return {
    invitadosConTelefono,
    mensajesEstimados,
    leyendaCosto: `~${mensajesEstimados} mensajes ≈ costo según la tarifa de Meta`,
  };
}
