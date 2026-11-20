export interface DatosPresupuestoProspecto {
  fecha?: string;
  invitados?: number;
  salon?: string;
  tipoEvento?: string;
}

/**
 * Extrae fecha, cantidad de invitados, salón y tipo de evento del texto de un prospecto.
 */
export function extraerDatosPresupuestoProspecto(texto: string): DatosPresupuestoProspecto {
  const t = (texto || '').trim();
  const res: DatosPresupuestoProspecto = {};

  // 1. Invitados: ej "120 personas", "150 invitados", "para 80", etc.
  const mInvitados = t.match(/(\d{1,4})\s*(?:personas|invitados|adultos|pax)/i) ||
                     t.match(/(?:para|seriamos|seríamos|somos)\s*(\d{1,4})/i);
  if (mInvitados) {
    const cant = parseInt(mInvitados[1], 10);
    if (cant > 0) res.invitados = cant;
  }

  // 2. Fecha: ej "2027-08-08", "15/11/2026", "15 de noviembre de 2026", "marzo 2027", etc.
  const mFechaIso = t.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const mFechaSlash = t.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  const mFechaTexto = t.match(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)(?:\s+de(?:l)?\s+(\d{4}))?\b/i);
  const mFechaMesAno = t.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)(?:\s+de(?:l)?|\s+)?\s+(\d{4})\b/i);

  const meses: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', setiembre: '09', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  };

  if (mFechaIso) {
    res.fecha = mFechaIso[1];
  } else if (mFechaSlash) {
    const d = mFechaSlash[1].padStart(2, '0');
    const m = mFechaSlash[2].padStart(2, '0');
    let y = mFechaSlash[3];
    if (y.length === 2) y = '20' + y;
    res.fecha = y + '-' + m + '-' + d;
  } else if (mFechaTexto && mFechaTexto[3]) {
    const d = mFechaTexto[1].padStart(2, '0');
    const m = meses[mFechaTexto[2].toLowerCase()] || '01';
    const y = mFechaTexto[3];
    res.fecha = y + '-' + m + '-' + d;
  } else if (mFechaMesAno && mFechaMesAno[2]) {
    const m = meses[mFechaMesAno[1].toLowerCase()] || '01';
    const y = mFechaMesAno[2];
    res.fecha = `${y}-${m}-01`;
  }

  // 3. Salón: ej "salon Los Robles", "salón: Club Uruguay", "en Club Uruguay", o directamente "Club Uruguay", etc.
  if (/club\s+uruguay/i.test(t)) {
    res.salon = 'Club Uruguay';
  } else {
    const mSalon = t.match(/(?:en el salon|en salon|en el sal[oó]n|en sal[oó]n|sal[oó]n:|salon:?)\s+([^,\.\n]+)/i) ||
                   t.match(/(?:en)\s+([A-ZÁÉÍÓÚ][a-záéíóúA-ZÁÉÍÓÚ0-9\s]{3,30})/);
    if (mSalon) {
      const s = mSalon[1].trim();
      if (s && !/^(cuanto|enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)/i.test(s)) {
        res.salon = s;
      }
    }
  }

  const normalizado = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(?:boda|casamiento|nos casamos)\b/.test(normalizado)) res.tipoEvento = 'Boda';
  else if (/\b(?:xv|quince|15\s*anos|15\s*anios)\b/.test(normalizado) || /\b15\s*años\b/i.test(t)) res.tipoEvento = 'XV años';
  else if (/\b(?:corporativo|empresarial)\b/.test(normalizado)) res.tipoEvento = 'Evento corporativo';
  else if (/\b(?:infantil|cumple de ninos)\b/.test(normalizado)) res.tipoEvento = 'Cumpleaños infantil';
  else if (/\bcumple(?:anos)?\b/.test(normalizado)) res.tipoEvento = 'Cumpleaños';
  return res;
}

/**
 * Arma la URL del simulador de presupuesto precargada con los datos del prospecto.
 */
export function enlaceAlSimuladorDelProspecto(datos: {
  fecha?: string;
  invitados?: number;
  salon?: string;
  tipoEvento?: string;
  eventDate?: string;
  guestCount?: number;
  venueName?: string;
  partyType?: string;
  entry?: string;
}): string {
  const params = new URLSearchParams();

  const invitados = datos.invitados ?? datos.guestCount;
  if (invitados) {
    params.set('guests', String(invitados));
  }

  const tipoEventoStr = datos.tipoEvento || datos.partyType || '';
  const normTipo = tipoEventoStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let tipo = 'cumpleanos';
  if (normTipo.includes('15') || normTipo.includes('xv') || normTipo.includes('quince')) {
    tipo = '15';
  } else if (normTipo.includes('boda') || normTipo.includes('casamiento')) {
    tipo = 'boda';
  } else if (normTipo.includes('infantil')) {
    tipo = 'infantil';
  } else if (normTipo.includes('empresa') || normTipo.includes('corporativo')) {
    tipo = 'empresa';
  }
  params.set('tipo', tipo);

  const fechaStr = datos.fecha || datos.eventDate;
  if (fechaStr) {
    const mMes = fechaStr.match(/(\d{4}-\d{2})/);
    if (mMes) {
      params.set('mes', mMes[1]);
    }
  }

  const salonStr = datos.salon || datos.venueName;
  if (salonStr) {
    const normSalon = salonStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (normSalon.includes('club') && normSalon.includes('uruguay')) {
      params.set('salon', 'club');
    }
  }

  params.set('entry', datos.entry || 'whatsapp_anuncio');

  return `https://akproducciones.uy/simulador-de-presupuesto?${params.toString()}`;
}
