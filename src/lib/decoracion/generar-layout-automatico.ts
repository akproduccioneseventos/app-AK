import type { DecoracionData, FiestaEnPlanificacion, LayoutElement } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';

export interface ResultadoGeneracionLayout {
  aplicado: boolean;
  motivo?: 'ya_tiene_plano' | 'generado_exitoso';
  decoracion: DecoracionData;
  elementosGenerados: number;
}

/**
 * Genera automáticamente la distribución del salón en base a lo que contrató el cliente:
 * - Mesas según la cantidad de invitados confirmados (o estimados si aún no confirmaron).
 * - Pista de baile si hay discoteca/DJ/baile contratado o evento bailable.
 * - Escenario si hay banda/show/animación.
 * - Barra de tragos si está contratada en el presupuesto.
 * - Sector de sillones (living) si está contratado en el presupuesto.
 * - Mesa de la torta si hay repostería/torta contratada.
 * - Photo-opportunity si hay cabina/espejo/tótem/fotos contratadas.
 * - Pantalla LED si hay pantallas/LED en el presupuesto.
 *
 * REGLA ESTRICTA: NUNCA pisa un plano que ya esté hecho (si ya tiene salonElements > 0).
 */
export function generarEscenaAutomatica(params: {
  fiesta: FiestaEnPlanificacion;
  presupuesto?: Presupuesto | null;
  forzar?: boolean;
}): ResultadoGeneracionLayout {
  const { fiesta, presupuesto, forzar = false } = params;
  const decoracionActual = fiesta.decoracion || {};
  const elementosExistentes = decoracionActual.salonElements || [];

  // Regla 2: NUNCA pisar un plano que ya esté hecho
  if (!forzar && elementosExistentes.length > 0) {
    return {
      aplicado: false,
      motivo: 'ya_tiene_plano',
      decoracion: decoracionActual,
      elementosGenerados: 0,
    };
  }

  const ppm = decoracionActual.pixelsPerMeter || 40;
  const salonWidthM = decoracionActual.salonWidth || 15;
  const salonHeightM = decoracionActual.salonHeight || 15;
  const salonWidthPx = salonWidthM * ppm;
  const salonHeightPx = salonHeightM * ppm;

  // 1. Contar confirmados o estimados
  // Los invitados tienen `rsvp` y `partySize`, y nada mas: `asistencia`, `confirmado` y
  // `cantidadPersonas` NO existen en el tipo ni los escribe nadie. Leerlos con `as any`
  // daba siempre vacio y apagaba al revisor de tipos. Es la pregunta 17 del metodo.
  const confirmados = (fiesta.invitados || []).filter(
    (inv) => String(inv.rsvp || '').toLowerCase() === 'confirmado'
  );
  const personasConfirmadas = confirmados.reduce((sum, inv) => sum + (inv.partySize || 1), 0);
  const totalPersonas =
    personasConfirmadas > 0
      ? personasConfirmadas
      : fiesta.configuracion?.invitadosEstimados || presupuesto?.invitadosCantidad || 50;

  // Mesas de 10 personas
  const cantMesas = Math.max(1, Math.ceil(totalPersonas / 10));

  // 2. Analizar presupuesto y configuración
  const itemsPresupuesto = presupuesto?.itemsPresupuestados || [];
  const nombresServicios = itemsPresupuesto.map((it) =>
    `${it.nombreServicio || ''} ${it.nombre || ''} ${it.categoriaServicio || ''} ${it.subcategoria || ''}`.toLowerCase()
  );
  const textoGeneral = nombresServicios.join(' ');

  const tipoCelebracion = (fiesta.configuracion?.tipoCelebracion || '').toLowerCase();
  const esEventoBailable =
    tipoCelebracion.includes('boda') ||
    tipoCelebracion.includes('xv') ||
    tipoCelebracion.includes('cumpleaños') ||
    tipoCelebracion.includes('fiesta');

  const tienePista =
    esEventoBailable ||
    textoGeneral.includes('pista') ||
    textoGeneral.includes('discoteca') ||
    textoGeneral.includes('dj') ||
    textoGeneral.includes('baile');

  const tieneEscenario =
    textoGeneral.includes('escenario') ||
    textoGeneral.includes('banda') ||
    textoGeneral.includes('show') ||
    textoGeneral.includes('animacion') ||
    textoGeneral.includes('tarima') ||
    textoGeneral.includes('vivo');

  const tieneBarra =
    textoGeneral.includes('barra') ||
    textoGeneral.includes('tragos') ||
    textoGeneral.includes('bartender') ||
    textoGeneral.includes('cocktail') ||
    textoGeneral.includes('open bar') ||
    textoGeneral.includes('bebidas');

  const tieneSillones =
    textoGeneral.includes('living') ||
    textoGeneral.includes('sillon') ||
    textoGeneral.includes('sillones') ||
    textoGeneral.includes('relax') ||
    textoGeneral.includes('lounge') ||
    textoGeneral.includes('sofa');

  const tieneTorta =
    textoGeneral.includes('torta') ||
    textoGeneral.includes('candy') ||
    textoGeneral.includes('mesa dulce') ||
    textoGeneral.includes('postres') ||
    Boolean(fiesta.decoracion?.decoracionTorta);

  const tienePhotoOp =
    textoGeneral.includes('fotocabina') ||
    textoGeneral.includes('photo') ||
    textoGeneral.includes('foto') ||
    textoGeneral.includes('espejo') ||
    textoGeneral.includes('totem') ||
    textoGeneral.includes('360');

  const tienePantallaLed =
    textoGeneral.includes('led') ||
    textoGeneral.includes('pantalla') ||
    textoGeneral.includes('proyeccion') ||
    textoGeneral.includes('visuales');

  const nuevosElementos: LayoutElement[] = [];
  let zIndexCounter = 1;

  // --- ESCENARIO ---
  if (tieneEscenario) {
    const escW = 5 * ppm;
    const escH = 2.5 * ppm;
    nuevosElementos.push({
      id: `el_escenario_${Date.now()}`,
      name: 'Escenario',
      category: 'Escenario',
      type: 'area',
      shape: 'rectangle',
      x: Math.round((salonWidthPx - escW) / 2),
      y: 30,
      width: escW,
      height: escH,
      rotation: 0,
      zIndex: 0,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
    });
  }

  // --- PANTALLA LED ---
  if (tienePantallaLed) {
    const ledW = 3.5 * ppm;
    const ledH = 1 * ppm;
    nuevosElementos.push({
      id: `el_led_${Date.now()}`,
      name: 'Pantalla LED',
      category: 'Pantalla LED',
      type: 'element',
      shape: 'rectangle',
      x: Math.round((salonWidthPx - ledW) / 2),
      y: tieneEscenario ? 10 : 30,
      width: ledW,
      height: ledH,
      rotation: 0,
      zIndex: zIndexCounter++,
      backgroundColor: '#09090b',
    });
  }

  // --- PISTA DE BAILE ---
  const pistaW = 5 * ppm;
  const pistaH = 5 * ppm;
  const pistaX = Math.round((salonWidthPx - pistaW) / 2);
  const pistaY = Math.round((salonHeightPx - pistaH) / 2);

  if (tienePista) {
    nuevosElementos.push({
      id: `el_pista_${Date.now()}`,
      name: 'Pista de Baile',
      category: 'Pista de Baile',
      type: 'area',
      shape: 'rectangle',
      x: pistaX,
      y: pistaY,
      width: pistaW,
      height: pistaH,
      rotation: 0,
      zIndex: 0,
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
    });
  }

  // --- BARRA DE TRAGOS ---
  if (tieneBarra) {
    const barW = 4 * ppm;
    const barH = 1.5 * ppm;
    nuevosElementos.push({
      id: `el_barra_${Date.now()}`,
      name: 'Barra de Tragos',
      category: 'Barra',
      type: 'area',
      shape: 'rectangle',
      x: 30,
      y: Math.round(pistaY + (pistaH - barH) / 2),
      width: barW,
      height: barH,
      rotation: 90,
      zIndex: 0,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
    });
  }

  // --- SECTOR DE SILLONES ---
  if (tieneSillones) {
    const silW = 3.5 * ppm;
    const silH = 3 * ppm;
    nuevosElementos.push({
      id: `el_sillones_${Date.now()}`,
      name: 'Sector de Sillones',
      category: 'Living',
      type: 'area',
      shape: 'rectangle',
      x: Math.round(salonWidthPx - silW - 30),
      y: Math.round(pistaY + (pistaH - silH) / 2),
      width: silW,
      height: silH,
      rotation: 0,
      zIndex: 0,
      backgroundColor: 'rgba(234, 179, 8, 0.2)',
    });
  }

  // --- MESA DE LA TORTA ---
  if (tieneTorta) {
    const tortaW = 2 * ppm;
    const tortaH = 2 * ppm;
    nuevosElementos.push({
      id: `el_torta_${Date.now()}`,
      name: 'Mesa de la Torta',
      category: 'Mesa de la Torta',
      type: 'element',
      shape: 'circle',
      seats: 0,
      x: Math.round(salonWidthPx - tortaW - 40),
      y: 40,
      width: tortaW,
      height: tortaH,
      rotation: 0,
      zIndex: zIndexCounter++,
      backgroundColor: '#ffffff',
    });
  }

  // --- PHOTO-OPPORTUNITY ---
  if (tienePhotoOp) {
    const photoW = 3 * ppm;
    const photoH = 2 * ppm;
    nuevosElementos.push({
      id: `el_photo_${Date.now()}`,
      name: 'Photo-opportunity',
      category: 'Photo-opportunity',
      type: 'area',
      shape: 'rectangle',
      x: 30,
      y: Math.round(salonHeightPx - photoH - 30),
      width: photoW,
      height: photoH,
      rotation: 0,
      zIndex: 0,
      backgroundColor: 'rgba(236, 72, 153, 0.2)',
    });
  }

  // --- MESAS DE INVITADOS (según confirmados) ---
  const mesaW = 2 * ppm;
  const mesaH = 2 * ppm;
  const espacioMesa = 2.8 * ppm;

  // Calculamos posiciones libres para las mesas (distribuidas en filas abajo y a los lados)
  let mesaCount = 0;
  const cols = Math.max(2, Math.floor(salonWidthPx / espacioMesa));
  const startY = Math.max(pistaY + pistaH + 30, Math.round(salonHeightPx * 0.55));

  for (let r = 0; r < 5 && mesaCount < cantMesas; r++) {
    for (let c = 0; c < cols && mesaCount < cantMesas; c++) {
      const posX = Math.round(c * espacioMesa + 50);
      const posY = Math.round(startY + r * espacioMesa);

      // Si se sale de los límites del salón, ajustar al margen
      if (posX + mesaW > salonWidthPx - 30 || posY + mesaH > salonHeightPx - 20) {
        continue;
      }

      mesaCount++;
      nuevosElementos.push({
        id: `el_mesa_${mesaCount}_${Date.now()}`,
        name: `Mesa ${mesaCount}`,
        category: 'Mesa Redonda',
        type: 'element',
        shape: 'circle',
        seats: 10,
        x: posX,
        y: posY,
        width: mesaW,
        height: mesaH,
        rotation: 0,
        zIndex: zIndexCounter++,
        backgroundColor: '#ffffff',
      });
    }
  }

  // Si aún faltan mesas por espacio, ubicarlas en los huecos superiores
  while (mesaCount < cantMesas) {
    mesaCount++;
    nuevosElementos.push({
      id: `el_mesa_${mesaCount}_${Date.now()}`,
      name: `Mesa ${mesaCount}`,
      category: 'Mesa Redonda',
      type: 'element',
      shape: 'circle',
      seats: 10,
      x: Math.round(50 + (mesaCount % 4) * espacioMesa),
      y: Math.round(120 + Math.floor(mesaCount / 4) * espacioMesa),
      width: mesaW,
      height: mesaH,
      rotation: 0,
      zIndex: zIndexCounter++,
      backgroundColor: '#ffffff',
    });
  }

  const decoracionActualizada: DecoracionData = {
    ...decoracionActual,
    salonElements: nuevosElementos,
    salonWidth: salonWidthM,
    salonHeight: salonHeightM,
    pixelsPerMeter: ppm,
  };

  return {
    aplicado: true,
    motivo: 'generado_exitoso',
    decoracion: decoracionActualizada,
    elementosGenerados: nuevosElementos.length,
  };
}
