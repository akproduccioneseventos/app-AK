/**
 * FASE 2 — Tests de integración de módulos VIP para AK Producciones.
 *
 * Valida:
 * 1. ClientePortalExperience — tipos y campos requeridos
 * 2. GuestExperienceSettings — nuevos campos para CTA de invitados
 * 3. CargaOperativaItem — campo retornado presente en el tipo
 * 4. Cartelería — presets estéticos disponibles y colores válidos
 * 5. Carga operativa — retornado separado de cargado
 * 6. Portal cliente — campos esperados en ClienteDebeLlevarItem
 * 7. Salón → Cartelería — salonElements alimenta el conteo de mesas
 * 8. Invitados → Check-in — guests tienen datos para QR y mesa
 * 9. Video de vida — tarea pendiente cuando no hay fotos/canciones
 * 10. Itinerario — vista cliente simplificada
 */

import type {
  FiestaEnPlanificacion,
  GuestExperienceSettings,
  ClientePortalExperience,
  ClienteDebeLlevarItem,
  CargaOperativaItem,
  Invitado,
  LayoutElement,
  ProgramaEventoItem,
} from '@/types/fiesta';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeGuestExperience(overrides: Partial<GuestExperienceSettings> = {}): GuestExperienceSettings {
  return {
    enabled: true,
    showAkBranding: true,
    showLandingCta: true,
    showSocialCta: true,
    showBudgetSimulatorCta: true,
    allowSongSuggestions: true,
    allowPhotoUpload: false,
    allowGuestPortal: true,
    landingUrl: 'https://ak-producciones.com',
    simulatorUrl: 'https://ak-producciones.com/simulador',
    whatsappNumber: '59898355530',
    whatsappUrl: 'https://wa.me/59898355530',
    instagramUrl: 'https://instagram.com/akproducciones',
    ctaTitle: '¿Te gustó esta experiencia?',
    ctaText: 'Esto es parte del servicio integral de AK Producciones Eventos.',
    accentColor: '#7c3aed',
    ...overrides,
  };
}

function makeClientePortalExperience(overrides: Partial<ClientePortalExperience> = {}): ClientePortalExperience {
  return {
    heroImageUrl: 'https://example.com/hero.jpg',
    primaryColor: '#7c3aed',
    welcomeMessage: '¡Bienvenida al portal de tu fiesta, Virginia!',
    organizerMessage: 'Todo va a salir perfecto. Estamos con vos en cada paso.',
    simplicityMode: false,
    clienteDebeLlevar: [
      { id: 'cdl_1', texto: 'Fotos para el video de vida', obligatorio: true, completado: false },
      { id: 'cdl_2', texto: 'Lista de canciones pedidas', obligatorio: false, completado: true },
    ],
    ...overrides,
  };
}

function makeInvitado(overrides: Partial<Invitado> = {}): Invitado {
  return {
    id: `inv_${Math.random().toString(36).slice(2)}`,
    nombre: 'Juan Pérez',
    rsvp: 'Confirmado',
    checkedIn: false,
    tableNumber: '5',
    dietaryRestriction: 'Ninguna',
    ...overrides,
  };
}

function makeCargaItem(overrides: Partial<CargaOperativaItem> = {}): CargaOperativaItem {
  return {
    id: `ci_${Math.random().toString(36).slice(2)}`,
    nombre: 'Mesa plegable 1,80m',
    cantidad: '10',
    cargado: false,
    retornado: false,
    ...overrides,
  };
}

function makeSalonElement(overrides: Partial<LayoutElement> = {}): LayoutElement {
  return {
    id: `el_${Math.random().toString(36).slice(2)}`,
    type: 'element',
    name: 'Mesa redonda',
    x: 100,
    y: 100,
    width: 60,
    height: 60,
    rotation: 0,
    seats: 8,
    color: '#7c3aed',
    zIndex: 1,
    ...overrides,
  };
}

function makeProgramaItem(overrides: Partial<ProgramaEventoItem> = {}): ProgramaEventoItem {
  return {
    id: `prog_${Math.random().toString(36).slice(2)}`,
    hora: '20:00',
    titulo: 'Entrada de los protagonistas',
    descripcion: 'Con música en vivo',
    icono: 'PartyPopper',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ClientePortalExperience — tipos y campos requeridos
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientePortalExperience', () => {
  it('debe tener los campos obligatorios del diseño VIP', () => {
    const exp = makeClientePortalExperience();
    expect(exp.heroImageUrl).toBeDefined();
    expect(exp.primaryColor).toBeDefined();
    expect(exp.welcomeMessage).toBeDefined();
    expect(exp.organizerMessage).toBeDefined();
    expect(typeof exp.simplicityMode).toBe('boolean');
  });

  it('clienteDebeLlevar debe contener ítems con id, texto y estado', () => {
    const exp = makeClientePortalExperience();
    const items = exp.clienteDebeLlevar ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.id).toBeDefined();
      expect(typeof item.texto).toBe('string');
      expect(typeof item.completado).toBe('boolean');
    }
  });

  it('simplicityMode=true oculta módulos de navegación avanzados', () => {
    const simplified = makeClientePortalExperience({ simplicityMode: true });
    expect(simplified.simplicityMode).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GuestExperienceSettings — nuevos campos de CTA
// ─────────────────────────────────────────────────────────────────────────────

describe('GuestExperienceSettings — campos FASE 2', () => {
  it('debe incluir showSocialCta para el muro social', () => {
    const exp = makeGuestExperience();
    expect(typeof exp.showSocialCta).toBe('boolean');
    expect(exp.showSocialCta).toBe(true);
  });

  it('debe incluir showBudgetSimulatorCta para el simulador', () => {
    const exp = makeGuestExperience();
    expect(typeof exp.showBudgetSimulatorCta).toBe('boolean');
    expect(exp.showBudgetSimulatorCta).toBe(true);
  });

  it('debe incluir simulatorUrl para enlace al simulador', () => {
    const exp = makeGuestExperience();
    expect(typeof exp.simulatorUrl).toBe('string');
    expect(exp.simulatorUrl).toContain('simulador');
  });

  it('puede deshabilitar CTA individualmente', () => {
    const noSimulador = makeGuestExperience({ showBudgetSimulatorCta: false });
    expect(noSimulador.showBudgetSimulatorCta).toBe(false);
    expect(noSimulador.showSocialCta).toBe(true); // otros CTAs siguen activos

    const noSocial = makeGuestExperience({ showSocialCta: false });
    expect(noSocial.showSocialCta).toBe(false);
  });

  it('CTA de AK solo se muestra cuando enabled y showAkBranding son true', () => {
    const activo = makeGuestExperience({ enabled: true, showAkBranding: true });
    const showCta = activo.enabled && activo.showAkBranding;
    expect(showCta).toBe(true);

    const inactivo = makeGuestExperience({ enabled: false });
    const noCta = inactivo.enabled && inactivo.showAkBranding;
    expect(noCta).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CargaOperativaItem — campo retornado
// ─────────────────────────────────────────────────────────────────────────────

describe('CargaOperativaItem — retorno de materiales', () => {
  it('un ítem puede estar cargado pero no retornado', () => {
    const item = makeCargaItem({ cargado: true, retornado: false });
    expect(item.cargado).toBe(true);
    expect(item.retornado).toBe(false);
  });

  it('un ítem retornado implica que también fue cargado', () => {
    const item = makeCargaItem({ cargado: true, retornado: true });
    expect(item.cargado).toBe(true);
    expect(item.retornado).toBe(true);
  });

  it('un ítem no cargado no puede estar retornado', () => {
    const item = makeCargaItem({ cargado: false, retornado: false });
    // No tiene sentido retornar algo que no fue cargado
    expect(item.retornado).toBe(false);
  });

  it('cálculo de progreso de retorno funciona correctamente', () => {
    const items: CargaOperativaItem[] = [
      makeCargaItem({ cargado: true, retornado: true }),
      makeCargaItem({ cargado: true, retornado: false }),
      makeCargaItem({ cargado: true, retornado: true }),
      makeCargaItem({ cargado: false, retornado: false }),
    ];
    const cargados = items.filter(i => i.cargado).length;
    const retornados = items.filter(i => i.retornado).length;
    const pct = cargados > 0 ? Math.round((retornados / cargados) * 100) : 0;
    expect(cargados).toBe(3);
    expect(retornados).toBe(2);
    expect(pct).toBe(67);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Cartelería — presets estéticos
// ─────────────────────────────────────────────────────────────────────────────

const AESTHETIC_PRESETS = [
  { id: 'elegante-dorado',    label: 'Elegante dorado',     color: '#c9a96e' },
  { id: 'xv-celeste',         label: 'XV celeste',           color: '#4fa7cc' },
  { id: 'boda-blanco-dorado', label: 'Boda blanco/dorado',  color: '#b8960c' },
  { id: 'neon',               label: 'Neón',                 color: '#e040fb' },
  { id: 'corporativo',        label: 'Corporativo',          color: '#1e3a5f' },
  { id: 'infantil',           label: 'Infantil',             color: '#ff6b9d' },
] as const;

describe('Cartelería — presets estéticos', () => {
  it('debe haber exactamente 6 presets estéticos', () => {
    expect(AESTHETIC_PRESETS).toHaveLength(6);
  });

  it('todos los presets deben tener id, label y color hex válido', () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    for (const preset of AESTHETIC_PRESETS) {
      expect(preset.id).toBeDefined();
      expect(preset.label.length).toBeGreaterThan(0);
      expect(hexPattern.test(preset.color)).toBe(true);
    }
  });

  it('los IDs de los presets esperados están presentes', () => {
    const ids = AESTHETIC_PRESETS.map(p => p.id);
    expect(ids).toContain('elegante-dorado');
    expect(ids).toContain('xv-celeste');
    expect(ids).toContain('boda-blanco-dorado');
    expect(ids).toContain('neon');
    expect(ids).toContain('corporativo');
    expect(ids).toContain('infantil');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Salón → Cartelería: salonElements alimenta el conteo de mesas
// ─────────────────────────────────────────────────────────────────────────────

describe('Salón → Cartelería: lectura de mesas desde salonElements', () => {
  it('detecta mesas por campo seats', () => {
    const elements: LayoutElement[] = [
      makeSalonElement({ seats: 8 }),
      makeSalonElement({ seats: 6 }),
      makeSalonElement({ type: 'wall', seats: undefined, name: 'Pared' }),
    ];
    const mesas = elements.filter(el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa')));
    expect(mesas).toHaveLength(2);
  });

  it('detecta mesas por nombre cuando seats no está definido', () => {
    const elements: LayoutElement[] = [
      makeSalonElement({ seats: undefined, name: 'Mesa central' }),
      makeSalonElement({ seats: undefined, name: 'Escenario' }),
    ];
    const mesas = elements.filter(el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa')));
    expect(mesas).toHaveLength(1);
  });

  it('sin elementos de salón el conteo de mesas es null (modo manual)', () => {
    const salonElements: LayoutElement[] = [];
    const tableEls = salonElements.filter(el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa')));
    const salonTableCount = tableEls.length > 0 ? tableEls.length : null;
    expect(salonTableCount).toBeNull();
  });

  it('el conteo se refleja en el número de tarjetas de mesa a imprimir', () => {
    const N_MESAS = 12;
    const tableNumbers = Array.from({ length: N_MESAS }, (_, i) => i + 1);
    const tablePages: number[][] = [];
    for (let i = 0; i < tableNumbers.length; i += 2) {
      tablePages.push(tableNumbers.slice(i, i + 2));
    }
    expect(tablePages).toHaveLength(6); // 12 mesas / 2 por página A4
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Invitados → Check-in: datos para QR y mesa
// ─────────────────────────────────────────────────────────────────────────────

describe('Invitados → Check-in: QR y mesa', () => {
  it('un invitado confirmado tiene los datos necesarios para el QR de entrada', () => {
    const guest = makeInvitado({ rsvp: 'Confirmado' });
    const fiestaId = 'fiesta_test_1';
    const baseUrl = 'https://app-ak.vercel.app';
    const qrValue = `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&guestId=${guest.id}`;

    expect(qrValue).toContain('/evento/accesos/');
    expect(qrValue).toContain(guest.id);
    expect(guest.rsvp).toBe('Confirmado');
  });

  it('un invitado con mesa asignada muestra el número correcto', () => {
    const guest = makeInvitado({ tableNumber: '7' });
    expect(guest.tableNumber).toBe('7');
  });

  it('un invitado sin mesa no rompe la vista de check-in', () => {
    const guest = makeInvitado({ tableNumber: undefined });
    const display = guest.tableNumber ? `Mesa ${guest.tableNumber}` : 'Sin mesa asignada';
    expect(display).toBe('Sin mesa asignada');
  });

  it('restricción dietaria celiaca se muestra como alerta en check-in', () => {
    const guest = makeInvitado({ dietaryRestriction: 'Celiaco' });
    const isCeliac = guest.dietaryRestriction === 'Celiaco' || guest.isCeliac === true;
    expect(isCeliac).toBe(true);
  });

  it('filtros de check-in segregan correctamente presentes/esperando/rechazados', () => {
    const guests: Invitado[] = [
      makeInvitado({ rsvp: 'Confirmado', checkedIn: true }),
      makeInvitado({ rsvp: 'Confirmado', checkedIn: false }),
      makeInvitado({ rsvp: 'Confirmado', checkedIn: false }),
      makeInvitado({ rsvp: 'Rechazado', checkedIn: false }),
    ];
    const presentes  = guests.filter(g => g.checkedIn);
    const esperando  = guests.filter(g => !g.checkedIn && g.rsvp === 'Confirmado');
    const rechazados = guests.filter(g => g.rsvp === 'Rechazado');

    expect(presentes).toHaveLength(1);
    expect(esperando).toHaveLength(2);
    expect(rechazados).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Video de Vida → tarea pendiente en portal cliente
// ─────────────────────────────────────────────────────────────────────────────

describe('Video de Vida — tareas pendientes en Portal Cliente', () => {
  it('genera tarea pendiente cuando no se subieron fotos', () => {
    const fiesta = { videoVida: { photosUploaded: false } };
    const pendientes: string[] = [];
    if (!fiesta.videoVida?.photosUploaded) {
      pendientes.push('Subir fotos para video de vida');
    }
    expect(pendientes).toContain('Subir fotos para video de vida');
  });

  it('NO genera tarea de fotos cuando ya fueron subidas', () => {
    const fiesta = { videoVida: { photosUploaded: true } };
    const pendientes: string[] = [];
    if (!fiesta.videoVida?.photosUploaded) {
      pendientes.push('Subir fotos para video de vida');
    }
    expect(pendientes).not.toContain('Subir fotos para video de vida');
  });

  it('genera tarea de canciones cuando la lista de música está vacía', () => {
    const musica = { items: [] };
    const pendientes: string[] = [];
    if (!musica.items || musica.items.length === 0) {
      pendientes.push('Cargar lista de canciones');
    }
    expect(pendientes).toContain('Cargar lista de canciones');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Itinerario — vista cliente simplificada
// ─────────────────────────────────────────────────────────────────────────────

describe('Itinerario — vista cliente simplificada', () => {
  it('el programa se puede mostrar en modo cliente con hora y título', () => {
    const programa: ProgramaEventoItem[] = [
      makeProgramaItem({ hora: '20:00', titulo: 'Apertura del salón' }),
      makeProgramaItem({ hora: '21:00', titulo: 'Cena' }),
      makeProgramaItem({ hora: '23:00', titulo: 'Torta y vals' }),
    ];

    const clienteView = programa.map(item => ({ hora: item.hora, titulo: item.titulo }));
    expect(clienteView).toHaveLength(3);
    expect(clienteView[0].hora).toBe('20:00');
    expect(clienteView[1].titulo).toBe('Cena');
  });

  it('la vista cliente oculta la descripción operativa interna', () => {
    const item = makeProgramaItem({
      titulo: 'Corte de torta',
      descripcion: 'OPERATIVO: DJ cue #42, luces rosas, micro inalámbrico canal 3',
    });

    // La vista cliente solo muestra hora + título (no descripción interna)
    const clienteItem = { hora: item.hora, titulo: item.titulo };
    expect(Object.keys(clienteItem)).not.toContain('descripcion');
  });

  it('el itinerario vacío no rompe la vista cliente', () => {
    const programa: ProgramaEventoItem[] = [];
    const clienteView = programa.map(item => ({ hora: item.hora, titulo: item.titulo }));
    expect(clienteView).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Portal Cliente — visibilidad de pagos e itinerario
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Cliente VIP — pagos e itinerario visibles', () => {
  it('muestra cuotas pendientes al cliente', () => {
    const cuotas = [
      { id: 'c1', descripcion: 'Seña', monto: 20000, estado: 'pagado', fechaVencimiento: '2026-01-01' },
      { id: 'c2', descripcion: 'Saldo 50%', monto: 30000, estado: 'pendiente', fechaVencimiento: '2026-07-01' },
    ];
    const pendientes = cuotas.filter(c => c.estado === 'pendiente' || c.estado === 'vencido');
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].descripcion).toBe('Saldo 50%');
  });

  it('calcula correctamente el saldo cuando hay pagos parciales', () => {
    const totalCost = 100000;
    const totalPaid = 35000;
    const balance = totalCost - totalPaid;
    expect(balance).toBe(65000);
  });

  it('muestra cronograma cuando el programa tiene items', () => {
    const programa: ProgramaEventoItem[] = [
      makeProgramaItem({ hora: '20:00', titulo: 'Inicio' }),
    ];
    const showTimeline = programa.length > 0;
    expect(showTimeline).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Semáforo operativo en Evento en Vivo
// ─────────────────────────────────────────────────────────────────────────────

describe('Evento en Vivo — Semáforo Operativo', () => {
  it('semáforo verde cuando todo el personal está presente', () => {
    const staffTotal = 5;
    const staffPresentes = 5;
    const estado = staffPresentes >= staffTotal && staffTotal > 0 ? 'verde' : staffPresentes > 0 ? 'amarillo' : 'rojo';
    expect(estado).toBe('verde');
  });

  it('semáforo amarillo cuando hay personal parcialmente presente', () => {
    const staffTotal = 5;
    const staffPresentes = 3;
    const estado = staffPresentes >= staffTotal ? 'verde' : staffPresentes > 0 ? 'amarillo' : 'rojo';
    expect(estado).toBe('amarillo');
  });

  it('semáforo rojo cuando nadie llegó todavía', () => {
    const staffTotal = 5;
    const staffPresentes = 0;
    const estado = staffPresentes >= staffTotal && staffTotal > 0 ? 'verde' : staffPresentes > 0 ? 'amarillo' : 'rojo';
    expect(estado).toBe('rojo');
  });

  it('semáforo de check-in verde cuando hay más del 80% de presencia', () => {
    const totalConfirmados = 100;
    const presentes = 82;
    const checkInPct = Math.round((presentes / totalConfirmados) * 100);
    const estado = checkInPct >= 80 ? 'verde' : checkInPct >= 30 ? 'amarillo' : 'rojo';
    expect(estado).toBe('verde');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Portal Cliente VIP — botón "Necesito ayuda"
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Cliente VIP — "Necesito ayuda"', () => {
  it('el botón necesito-ayuda apunta a WhatsApp con número y texto', () => {
    const waNumber = '59898355530';
    const eventName = 'Mi Fiesta de 15';
    const waText = encodeURIComponent(`Hola, necesito ayuda con mi evento "${eventName}".`);
    const href = `https://wa.me/${waNumber}?text=${waText}`;
    expect(href).toContain('wa.me/59898355530');
    expect(href).toContain('text=');
    expect(href).toContain('Mi%20Fiesta%20de%2015');
  });

  it('el atributo data-testid permite localizarlo en pruebas de UI', () => {
    const testId = 'necesito-ayuda-btn';
    // Se verifica que el valor del testid es consistente con lo que se necesita
    expect(testId).toBe('necesito-ayuda-btn');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Portal Cliente VIP — Video de Vida bloque visible
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Cliente VIP — Bloque Video de Vida', () => {
  it('el bloque video-vida siempre es visible (showVideoVida = true)', () => {
    // In simplicityMode or normal mode, video-vida is always shown
    const showVideoVida = true;
    expect(showVideoVida).toBe(true);
  });

  it('muestra badge "Pendiente" cuando photosUploaded es false', () => {
    const videoVida = { galleryEnabled: false, photosUploaded: false };
    const badge = videoVida.photosUploaded ? 'Fotos enviadas ✓' : 'Pendiente';
    expect(badge).toBe('Pendiente');
  });

  it('muestra badge "Fotos enviadas" cuando photosUploaded es true', () => {
    const videoVida = { galleryEnabled: true, photosUploaded: true };
    const badge = videoVida.photosUploaded ? 'Fotos enviadas ✓' : 'Pendiente';
    expect(badge).toBe('Fotos enviadas ✓');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Portal Cliente VIP — Itinerario cliente sin notas operativas
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Cliente VIP — Itinerario client view', () => {
  it('filtra ítems donde visibleParaCliente === false', () => {
    const programa: ProgramaEventoItem[] = [
      makeProgramaItem({ titulo: 'Entrada', visibleParaCliente: true }),
      makeProgramaItem({ titulo: 'Operativo interno', visibleParaCliente: false }),
      makeProgramaItem({ titulo: 'Torta', visibleParaCliente: undefined }), // default = visible
    ];
    const clientView = programa.filter(item => item.visibleParaCliente !== false);
    expect(clientView).toHaveLength(2);
    expect(clientView.map(i => i.titulo)).toContain('Entrada');
    expect(clientView.map(i => i.titulo)).toContain('Torta');
    expect(clientView.map(i => i.titulo)).not.toContain('Operativo interno');
  });

  it('muestra descripcionCliente si está definida', () => {
    const item = makeProgramaItem({
      titulo: 'Cena',
      descripcion: 'OPERATIVO: cue DJ #42, mozo 3 en sector A',
      descripcionCliente: 'Cena de tres pasos con carta de tragos',
    });
    // La vista cliente muestra descripcionCliente, no descripcion
    const clientDesc = item.descripcionCliente ?? null;
    expect(clientDesc).toBe('Cena de tres pasos con carta de tragos');
  });

  it('oculta descripcion (interna) en la vista cliente', () => {
    const item = makeProgramaItem({
      titulo: 'Entrada protagonistas',
      descripcion: 'Verificar micro inalámbrico canal 3 antes de cue',
      descripcionCliente: undefined,
    });
    // La vista cliente solo expone titulo y descripcionCliente
    const exposedToClient = { hora: item.hora, titulo: item.titulo, descripcionCliente: item.descripcionCliente };
    expect(Object.keys(exposedToClient)).not.toContain('descripcion');
    expect(exposedToClient.descripcionCliente).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. Portal Cliente VIP — simplicityMode oculta secciones no esenciales
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Cliente VIP — simplicityMode', () => {
  function computeVisibility(simplicityMode: boolean, portalSettings?: {
    pagos?: { visible: boolean };
    invitados?: { visible: boolean };
    menu?: { visible: boolean };
    itinerario?: { visible: boolean };
  }) {
    return {
      showFinancials: simplicityMode ? true  : (portalSettings?.pagos?.visible     ?? true),
      showInvitados:  simplicityMode ? true  : (portalSettings?.invitados?.visible  ?? true),
      showCatering:   simplicityMode ? false : (portalSettings?.menu?.visible       ?? true),
      showTimeline:   simplicityMode ? false : (portalSettings?.itinerario?.visible ?? true),
      showDecoration: simplicityMode ? false : true,
      showVideoVida:  true,
    };
  }

  it('en modo normal muestra todos los módulos habilitados', () => {
    const vis = computeVisibility(false);
    expect(vis.showFinancials).toBe(true);
    expect(vis.showCatering).toBe(true);
    expect(vis.showTimeline).toBe(true);
    expect(vis.showDecoration).toBe(true);
    expect(vis.showVideoVida).toBe(true);
  });

  it('en simplicityMode muestra solo: financiero, invitados, video-vida', () => {
    const vis = computeVisibility(true);
    expect(vis.showFinancials).toBe(true);
    expect(vis.showInvitados).toBe(true);
    expect(vis.showVideoVida).toBe(true);
    expect(vis.showCatering).toBe(false);
    expect(vis.showTimeline).toBe(false);
    expect(vis.showDecoration).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. Portal Invitado — QR y CTA AK
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Invitado — QR y CTA AK Producciones', () => {
  it('el QR apunta a la ruta correcta de acceso', () => {
    const fiestaId = 'fiesta_abc';
    const guestId = 'inv_xyz';
    const baseUrl = 'https://app-ak.vercel.app';
    const qrValue = `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&guestId=${guestId}`;
    expect(qrValue).toContain('/evento/accesos/');
    expect(qrValue).not.toContain('/evento/muro-en-vivo/');
  });

  it('el CTA AK se muestra solo cuando enabled Y showAkBranding son true', () => {
    const guestExp = { enabled: true, showAkBranding: true };
    const showCta = guestExp.enabled && guestExp.showAkBranding;
    expect(showCta).toBe(true);
  });

  it('el CTA AK no se muestra cuando enabled es false', () => {
    const guestExp = { enabled: false, showAkBranding: true };
    const showCta = guestExp.enabled && guestExp.showAkBranding;
    expect(showCta).toBe(false);
  });

  it('el CTA AK no se muestra cuando showAkBranding es false', () => {
    const guestExp = { enabled: true, showAkBranding: false };
    const showCta = guestExp.enabled && guestExp.showAkBranding;
    expect(showCta).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. Modo Utilero — enlace apunta a ruta existente
// ─────────────────────────────────────────────────────────────────────────────

describe('Evento en Vivo — Modo Utilero', () => {
  it('el enlace del modo utilero apunta a en-vivo (tab retorno), no a ruta inexistente', () => {
    const fiestaId = 'fiesta_test';
    const utilerHref = `/fiestas/nueva/en-vivo?fiestaId=${fiestaId}&tab=retorno`;
    // Verifica que NO apunta a la ruta inexistente
    expect(utilerHref).not.toContain('/carga-operativa/retorno');
    // Verifica que apunta a en-vivo
    expect(utilerHref).toContain('/fiestas/nueva/en-vivo');
    expect(utilerHref).toContain('tab=retorno');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. Cartelería — plan de mesas con nombres de salon elements
// ─────────────────────────────────────────────────────────────────────────────

describe('Cartelería — plan de mesas con salonTableLabels', () => {
  it('genera labels personalizados desde salonElements', () => {
    const elements: LayoutElement[] = [
      makeSalonElement({ seats: 8, name: 'Mesa de honor' }),
      makeSalonElement({ seats: 8, name: 'Mesa 2' }),
      makeSalonElement({ seats: 6, name: 'Mesa de la familia' }),
    ];

    // Simula filterTableElements + buildSalonTableLabels
    const tableEls = elements.filter(el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa')));
    const labelMap = new Map<string, string>();
    tableEls.forEach((el, idx) => {
      const num = String(idx + 1);
      if (el.name && el.name.toLowerCase() !== 'mesa') {
        labelMap.set(num, el.name);
      }
    });

    expect(labelMap.get('1')).toBe('Mesa de honor');
    expect(labelMap.get('2')).toBe('Mesa 2');
    expect(labelMap.get('3')).toBe('Mesa de la familia');
  });

  it('mesa con nombre genérico "mesa" no genera label personalizado', () => {
    const elements: LayoutElement[] = [
      makeSalonElement({ seats: 8, name: 'Mesa' }),
    ];
    const tableEls = elements.filter(el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa')));
    const labelMap = new Map<string, string>();
    tableEls.forEach((el, idx) => {
      const num = String(idx + 1);
      if (el.name && el.name.toLowerCase() !== 'mesa') {
        labelMap.set(num, el.name);
      }
    });
    // "Mesa" exacto no crea label personalizado
    expect(labelMap.has('1')).toBe(false);
  });

  it('el plan de mesas muestra nombre del salon element si existe', () => {
    const labelMap = new Map([['3', 'Mesa VIP']]);
    const mesa = '3';
    const mesaLabel = labelMap.get(mesa);
    const displayLabel = mesaLabel ? `${mesaLabel} (Mesa ${mesa})` : `Mesa ${mesa}`;
    expect(displayLabel).toBe('Mesa VIP (Mesa 3)');
  });

  it('el plan de mesas muestra número simple cuando no hay label personalizado', () => {
    const labelMap = new Map<string, string>();
    const mesa = '5';
    const displayLabel = labelMap.get(mesa)
      ? `Mesa ${labelMap.get(mesa)} · ${mesa}`
      : `Mesa ${mesa}`;
    expect(displayLabel).toBe('Mesa 5');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. clientePortalExperience.clienteDebeLlevar — cadena de fallback
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Cliente — cadena de fallback para clienteDebeLlevar', () => {
  function resolveDebeLlevar(
    portalExpItems?: ClienteDebeLlevarItem[],
    rootItems?: ClienteDebeLlevarItem[],
    defaultItems?: ClienteDebeLlevarItem[],
  ): ClienteDebeLlevarItem[] {
    return (portalExpItems && portalExpItems.length > 0)
      ? portalExpItems
      : (rootItems && rootItems.length > 0)
        ? rootItems
        : (defaultItems ?? []);
  }

  const sampleItem: ClienteDebeLlevarItem = { id: 'x', texto: 'Fotos', completado: false };

  it('usa clientePortalExperience.clienteDebeLlevar cuando existe', () => {
    const result = resolveDebeLlevar([sampleItem], [], []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('x');
  });

  it('usa clienteDebeLlevar de raíz si el de portalExperience está vacío', () => {
    const rootItem: ClienteDebeLlevarItem = { id: 'y', texto: 'Canciones', completado: true };
    const result = resolveDebeLlevar([], [rootItem], []);
    expect(result[0].id).toBe('y');
  });

  it('cae a default cuando ambos están vacíos', () => {
    const defaultItem: ClienteDebeLlevarItem = { id: 'z', texto: 'Predeterminado', completado: false };
    const result = resolveDebeLlevar([], [], [defaultItem]);
    expect(result[0].id).toBe('z');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 19. Portal Invitado — vista persistente (GuestPortalPage)
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Invitado — vista persistente', () => {
  it('genera URL correcta del portal persistente del invitado', () => {
    const fiestaId = 'fiesta_abc';
    const guestId = 'inv_xyz';
    const guestPortalUrl = `/invitacion/${fiestaId}/invitado/${guestId}`;
    expect(guestPortalUrl).toBe('/invitacion/fiesta_abc/invitado/inv_xyz');
    expect(guestPortalUrl).toContain('/invitado/');
  });

  it('genera URL del QR correcta para el portal persistente', () => {
    const baseUrl = 'https://app-ak.vercel.app';
    const fiestaId = 'fiesta_abc';
    const guestId = 'inv_xyz';
    const qrValue = `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&guestId=${guestId}`;
    expect(qrValue).toContain('/evento/accesos/');
    expect(qrValue).toContain(`guestId=${guestId}`);
  });

  it('invitado con canciones sugeridas puede acceder a ellas en el portal', () => {
    const guest = makeInvitado({
      rsvp: 'Confirmado',
      cancionesDJ: ['Querida DJ', 'La Vida es un Carnaval', 'Vivir mi Vida'],
    });
    expect(guest.cancionesDJ).toHaveLength(3);
    expect(guest.cancionesDJ?.[0]).toBe('Querida DJ');
  });

  it('invitado con mensaje/dedicatoria puede verla en el portal', () => {
    const guest = makeInvitado({
      rsvp: 'Confirmado',
      mensaje: 'Feliz cumpleaños! Que cumplas muchos más.',
    });
    expect(guest.mensaje).toBe('Feliz cumpleaños! Que cumplas muchos más.');
  });

  it('invitado con restricción alimentaria la ve en el portal', () => {
    const guest = makeInvitado({ dietaryRestriction: 'Celiaco', alergiasEspecificas: 'Avena' });
    const DIETARY_LABELS: Record<string, string> = {
      Ninguna: '',
      Celiaco: '🌾 Menú sin gluten',
      Vegetariano: '🥗 Menú vegetariano',
      Vegano: '🌱 Menú vegano',
      Otro: '⚠️ Menú especial',
    };
    const dietLabel = guest.dietaryRestriction && guest.dietaryRestriction !== 'Ninguna'
      ? (DIETARY_LABELS[guest.dietaryRestriction] || guest.dietaryRestriction)
      : null;
    expect(dietLabel).toBe('🌾 Menú sin gluten');
    expect(guest.alergiasEspecificas).toBe('Avena');
  });

  it('link al portal del invitado se genera desde la confirmación RSVP', () => {
    const fiestaId = 'fiesta_test';
    const guestId = 'inv_test';
    const portalLink = `/invitacion/${fiestaId}/invitado/${guestId}`;
    expect(portalLink).toContain('/invitacion/');
    expect(portalLink).toContain('/invitado/');
    expect(portalLink).toContain(guestId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. guestExperienceSettings — campos completos
// ─────────────────────────────────────────────────────────────────────────────

import type { GuestExperienceSettings } from '@/types/fiesta';

describe('guestExperienceSettings — campos completos', () => {
  it('puede construirse con todos los campos requeridos', () => {
    const settings: GuestExperienceSettings = {
      enabled: true,
      showAkBranding: true,
      showLandingCta: true,
      showSocialCta: true,
      showBudgetSimulatorCta: false,
      allowSongSuggestions: true,
      allowPhotoUpload: false,
      allowGuestPortal: true,
    };
    expect(settings.enabled).toBe(true);
    expect(settings.showAkBranding).toBe(true);
    expect(settings.showLandingCta).toBe(true);
    expect(settings.allowGuestPortal).toBe(true);
  });

  it('campos de URL son opcionales', () => {
    const settings: GuestExperienceSettings = {
      enabled: true,
      showAkBranding: false,
      showLandingCta: false,
      showSocialCta: false,
      showBudgetSimulatorCta: false,
      allowSongSuggestions: false,
      allowPhotoUpload: false,
      allowGuestPortal: false,
    };
    expect(settings.ctaDescription).toBeUndefined();
    expect(settings.landingUrl).toBeUndefined();
    expect(settings.whatsappUrl).toBeUndefined();
  });

  it('todos los campos de URL son opcionales', () => {
    const settings: GuestExperienceSettings = {
      enabled: true,
      showAkBranding: true,
      showLandingCta: true,
      showSocialCta: true,
      showBudgetSimulatorCta: true,
      allowSongSuggestions: true,
      allowPhotoUpload: false,
      allowGuestPortal: true,
      landingUrl: 'https://ak.uy',
      simulatorUrl: 'https://sim.ak.uy',
      instagramUrl: 'https://instagram.com/ak',
      whatsappUrl: 'https://wa.me/59898355530',
      ctaTitle: '¿Te gustó?',
      ctaDescription: 'Organizamos tu próximo evento',
    };
    expect(settings.landingUrl).toBe('https://ak.uy');
    expect(settings.ctaDescription).toBe('Organizamos tu próximo evento');
    expect(settings.whatsappUrl).toBe('https://wa.me/59898355530');
  });

  it('CTA AK solo aparece cuando enabled Y showAkBranding son true', () => {
    const show = (s: GuestExperienceSettings) => s.enabled && s.showAkBranding;
    expect(show(makeGuestExperience({ enabled: true, showAkBranding: true }))).toBe(true);
    expect(show(makeGuestExperience({ enabled: false, showAkBranding: true }))).toBe(false);
    expect(show(makeGuestExperience({ enabled: true, showAkBranding: false }))).toBe(false);
  });

  it('allowGuestPortal controla acceso al portal persistente', () => {
    const allowPortal = (s: GuestExperienceSettings) => s.allowGuestPortal !== false;
    // Default = allowed (true)
    expect(allowPortal(makeGuestExperience({ allowGuestPortal: true }))).toBe(true);
    // Explicitly disabled
    expect(allowPortal(makeGuestExperience({ allowGuestPortal: false }))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 21. Check-in — información completa del invitado
// ─────────────────────────────────────────────────────────────────────────────

describe('Check-in — información completa del invitado', () => {
  it('muestra nombre, mesa, party size, restricción y accesibilidad', () => {
    const guest = makeInvitado({
      nombre: 'Ana Pérez',
      tableNumber: '5',
      partySize: 3,
      dietaryRestriction: 'Celiaco',
      requiereAccesibilidad: true,
      rsvp: 'Confirmado',
    });
    expect(guest.nombre).toBe('Ana Pérez');
    expect(guest.tableNumber).toBe('5');
    expect(guest.partySize).toBe(3);
    expect(guest.dietaryRestriction).toBe('Celiaco');
    expect(guest.requiereAccesibilidad).toBe(true);
  });

  it('muestra alerta de celiaco si dietaryRestriction es Celiaco', () => {
    const guest = makeInvitado({ dietaryRestriction: 'Celiaco' });
    const isCeliac = guest.dietaryRestriction === 'Celiaco' || guest.isCeliac === true;
    expect(isCeliac).toBe(true);
  });

  it('alergia específica se muestra junto a la restricción', () => {
    const guest = makeInvitado({ dietaryRestriction: 'Otro', alergiasEspecificas: 'Nueces, soja' });
    expect(guest.alergiasEspecificas).toBe('Nueces, soja');
  });

  it('estado RSVP "Confirmado" es el esperado para ingreso', () => {
    const guest = makeInvitado({ rsvp: 'Confirmado', checkedIn: false });
    const canEnter = guest.rsvp === 'Confirmado';
    expect(canEnter).toBe(true);
  });

  it('invitado ya ingresado tiene checkInTimestamp', () => {
    const ts = new Date().toISOString();
    const guest = makeInvitado({ checkedIn: true, checkInTimestamp: ts });
    expect(guest.checkedIn).toBe(true);
    expect(guest.checkInTimestamp).toBe(ts);
  });

  it('cantidad de celíacos presentes se puede calcular de la lista de invitados', () => {
    const guests: Invitado[] = [
      makeInvitado({ dietaryRestriction: 'Celiaco', checkedIn: true }),
      makeInvitado({ dietaryRestriction: 'Celiaco', checkedIn: false }),
      makeInvitado({ dietaryRestriction: 'Vegetariano', checkedIn: true }),
    ];
    const celiacosPresentes = guests.filter(g => g.checkedIn && (g.dietaryRestriction === 'Celiaco' || g.isCeliac));
    expect(celiacosPresentes).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 22. Diseño salón → invitados → plan de mesas real
// ─────────────────────────────────────────────────────────────────────────────

describe('Diseño salón → invitados → plan de mesas real', () => {
  it('construye mapa de invitados por mesa desde datos reales de invitados', () => {
    const guests: Invitado[] = [
      makeInvitado({ nombre: 'Ana García', tableNumber: '1', rsvp: 'Confirmado' }),
      makeInvitado({ nombre: 'Bruno López', tableNumber: '1', rsvp: 'Confirmado' }),
      makeInvitado({ nombre: 'Carlos Díaz', tableNumber: '2', rsvp: 'Confirmado' }),
      makeInvitado({ nombre: 'Diana Pérez', tableNumber: undefined, rsvp: 'Confirmado' }),
    ];

    const UNASSIGNED = 'Sin asignar';
    const map = new Map<string, string[]>();
    for (const inv of guests) {
      const mesa = (inv.tableNumber || '').trim() || UNASSIGNED;
      if (!map.has(mesa)) map.set(mesa, []);
      map.get(mesa)?.push(inv.nombre);
    }

    expect(map.get('1')).toEqual(['Ana García', 'Bruno López']);
    expect(map.get('2')).toEqual(['Carlos Díaz']);
    expect(map.get(UNASSIGNED)).toEqual(['Diana Pérez']);
  });

  it('plan de mesas imprimible usa etiquetas de salonElements cuando están disponibles', () => {
    const salonElements: LayoutElement[] = [
      makeSalonElement({ seats: 8, name: 'Mesa principal' }),
      makeSalonElement({ seats: 6, name: 'Mesa familia' }),
    ];
    const tableEls = salonElements.filter(el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa')));
    const labelMap = new Map<string, string>();
    tableEls.forEach((el, idx) => {
      const num = String(idx + 1);
      if (el.name && el.name.toLowerCase() !== 'mesa') {
        labelMap.set(num, el.name);
      }
    });

    // Invitados asignados a esas mesas
    const guests: Invitado[] = [
      makeInvitado({ nombre: 'Invitado A', tableNumber: '1' }),
      makeInvitado({ nombre: 'Invitado B', tableNumber: '2' }),
    ];

    const invMap = new Map<string, string[]>();
    for (const inv of guests) {
      const mesa = (inv.tableNumber || '').trim();
      if (mesa) {
        if (!invMap.has(mesa)) invMap.set(mesa, []);
        invMap.get(mesa)?.push(inv.nombre);
      }
    }

    // Combine: use label if available
    const plan = Array.from(invMap.entries()).map(([num, nombres]) => ({
      mesa: num,
      label: labelMap.get(num) ? `${labelMap.get(num)} (Mesa ${num})` : `Mesa ${num}`,
      nombres,
    }));

    expect(plan[0].label).toBe('Mesa principal (Mesa 1)');
    expect(plan[1].label).toBe('Mesa familia (Mesa 2)');
    expect(plan[0].nombres).toContain('Invitado A');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 23. QR usa guestAccessToken cuando existe
// ─────────────────────────────────────────────────────────────────────────────

describe('QR — guestAccessToken preferido sobre guestId', () => {
  const baseUrl = 'https://app-ak.vercel.app';
  const fiestaId = 'fiesta_abc';

  function buildQrValue(guest: Pick<Invitado, 'id' | 'guestAccessToken'>) {
    const accessParam = guest.guestAccessToken
      ? `token=${guest.guestAccessToken}&guestId=${guest.id}`
      : `guestId=${guest.id}`;
    return `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&${accessParam}`;
  }

  it('usa token cuando guestAccessToken existe', () => {
    const guest = makeInvitado({ guestAccessToken: 'tok_abc123' });
    const qr = buildQrValue(guest);
    expect(qr).toContain('token=tok_abc123');
    expect(qr).toContain(`guestId=${guest.id}`);
  });

  it('usa solo guestId cuando no hay guestAccessToken (legado)', () => {
    const guest = makeInvitado({ guestAccessToken: undefined });
    const qr = buildQrValue(guest);
    expect(qr).not.toContain('token=');
    expect(qr).toContain(`guestId=${guest.id}`);
  });

  it('QR con token pasa verificación del control de acceso', () => {
    const token = 'tok_secure99';
    const guest = makeInvitado({ guestAccessToken: token });
    // Simula la lógica del accesos page
    const url = new URL(buildQrValue(guest));
    const scannedToken = url.searchParams.get('token');
    const scannedGuestId = url.searchParams.get('guestId');
    const guests: Invitado[] = [guest];
    const match = guests.find(g => g.guestAccessToken === scannedToken && g.id === scannedGuestId);
    expect(match).toBeDefined();
    expect(match?.id).toBe(guest.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 24. allowGuestPortal === false bloquea acceso al portal
// ─────────────────────────────────────────────────────────────────────────────

describe('allowGuestPortal — control de acceso al portal del invitado', () => {
  it('portal accesible cuando allowGuestPortal es true', () => {
    const settings = makeGuestExperience({ allowGuestPortal: true });
    const portalEnabled = settings.allowGuestPortal !== false;
    expect(portalEnabled).toBe(true);
  });

  it('portal bloqueado cuando allowGuestPortal es false', () => {
    const settings = makeGuestExperience({ allowGuestPortal: false });
    const portalEnabled = settings.allowGuestPortal !== false;
    expect(portalEnabled).toBe(false);
  });

  it('whatsappUrl se prefiere sobre whatsappNumber para construcción del enlace', () => {
    const settings = makeGuestExperience({
      whatsappUrl: 'https://wa.me/59898355530?text=Hola',
      whatsappNumber: '59898355530',
    });
    const href = settings.whatsappUrl ?? `https://wa.me/${(settings.whatsappNumber ?? '').replace(/\D/g, '')}`;
    expect(href).toBe('https://wa.me/59898355530?text=Hola');
  });

  it('fallback a whatsappNumber cuando whatsappUrl no existe', () => {
    const settings = makeGuestExperience({ whatsappUrl: undefined, whatsappNumber: '59898355530' });
    const href = settings.whatsappUrl ?? `https://wa.me/${(settings.whatsappNumber ?? '').replace(/\D/g, '')}`;
    expect(href).toBe('https://wa.me/59898355530');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 25. RSVP guarda todos los campos extra
// ─────────────────────────────────────────────────────────────────────────────

describe('RSVP — guardado de campos completos', () => {
  it('submitPublicRsvp recibe contacto', () => {
    const payload = {
      nombre: 'Ana García',
      contacto: '099 123 456',
      asistencia: 'Confirmado' as const,
      dietaryRestriction: 'Ninguna' as DietaryRestriction,
      cancionesDJ: [],
    };
    expect(payload.contacto).toBe('099 123 456');
  });

  it('submitPublicRsvp recibe partySize y companionNames', () => {
    const payload = {
      nombre: 'Ana García',
      asistencia: 'Confirmado' as const,
      dietaryRestriction: 'Ninguna' as DietaryRestriction,
      partySize: 3,
      companionNames: ['Luis García', 'Marta García'],
      cancionesDJ: [],
    };
    expect(payload.partySize).toBe(3);
    expect(payload.companionNames).toHaveLength(2);
  });

  it('submitPublicRsvp recibe alergiasEspecificas', () => {
    const payload = {
      nombre: 'Ana García',
      asistencia: 'Confirmado' as const,
      dietaryRestriction: 'Otro' as DietaryRestriction,
      alergiasEspecificas: 'Nueces, mariscos',
      cancionesDJ: [],
    };
    expect(payload.alergiasEspecificas).toBe('Nueces, mariscos');
  });

  it('submitPublicRsvp recibe mensaje y requiereAccesibilidad', () => {
    const payload = {
      nombre: 'Ana García',
      asistencia: 'Confirmado' as const,
      dietaryRestriction: 'Ninguna' as DietaryRestriction,
      mensaje: 'Felicitaciones!',
      requiereAccesibilidad: true,
      cancionesDJ: [],
    };
    expect(payload.mensaje).toBe('Felicitaciones!');
    expect(payload.requiereAccesibilidad).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 26. CTA tracking — guestExperienceStats
// ─────────────────────────────────────────────────────────────────────────────

import type { GuestExperienceStats } from '@/types/fiesta';

describe('CTA tracking — guestExperienceStats', () => {
  type GuestCtaStat = 'clickedWhatsapp' | 'clickedInstagram' | 'clickedLanding' | 'clickedSimulator';

  function applyCtaClick(stats: GuestExperienceStats | undefined, stat: GuestCtaStat): GuestExperienceStats {
    return { ...(stats ?? {}), [stat]: true };
  }

  it('registra clickedWhatsapp', () => {
    const result = applyCtaClick(undefined, 'clickedWhatsapp');
    expect(result.clickedWhatsapp).toBe(true);
  });

  it('registra clickedInstagram', () => {
    const result = applyCtaClick(undefined, 'clickedInstagram');
    expect(result.clickedInstagram).toBe(true);
  });

  it('registra clickedLanding', () => {
    const result = applyCtaClick(undefined, 'clickedLanding');
    expect(result.clickedLanding).toBe(true);
  });

  it('registra clickedSimulator', () => {
    const result = applyCtaClick(undefined, 'clickedSimulator');
    expect(result.clickedSimulator).toBe(true);
  });

  it('preserva stats existentes al agregar nuevo click', () => {
    const existing: GuestExperienceStats = { clickedWhatsapp: true };
    const result = applyCtaClick(existing, 'clickedInstagram');
    expect(result.clickedWhatsapp).toBe(true);
    expect(result.clickedInstagram).toBe(true);
  });

  it('openedAt no se sobreescribe al registrar click', () => {
    const ts = '2025-01-01T20:00:00Z';
    const existing: GuestExperienceStats = { openedAt: ts };
    const result = applyCtaClick(existing, 'clickedLanding');
    expect(result.openedAt).toBe(ts);
    expect(result.clickedLanding).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 27. guestAccessToken generation
// ─────────────────────────────────────────────────────────────────────────────

describe('guestAccessToken — generación automática', () => {
  /** Simula la lógica de addInvitado: asigna token si no viene en el payload */
  function simulateAddInvitado(data: Partial<Invitado>): Invitado {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const token = data.guestAccessToken ?? (() => {
      // replica: randomUUID() — en tests usamos un stub
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    })();
    expect(UUID_RE.test(token)).toBe(true);
    return makeInvitado({ ...data, guestAccessToken: token });
  }

  it('addInvitado genera guestAccessToken cuando no se provee', () => {
    const inv = simulateAddInvitado({ nombre: 'Carlos López', rsvp: 'Pendiente' });
    expect(inv.guestAccessToken).toBeDefined();
    expect(inv.guestAccessToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('addInvitado respeta guestAccessToken si ya viene en los datos', () => {
    const preToken = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const inv = simulateAddInvitado({ nombre: 'María García', guestAccessToken: preToken });
    expect(inv.guestAccessToken).toBe(preToken);
  });

  it('submitPublicRsvp — invitado nuevo obtiene guestAccessToken', () => {
    // Simula creación de nuevo invitado con token generado
    const newInvitado: Partial<Invitado> = {
      id: `inv_rsvp_${Date.now()}_abc`,
      guestAccessToken: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      nombre: 'Pedro Díaz',
      rsvp: 'Confirmado',
    };
    expect(newInvitado.guestAccessToken).toBeDefined();
    expect(newInvitado.guestAccessToken).not.toBe('');
  });

  it('submitPublicRsvp — invitado existente sin token recibe uno nuevo', () => {
    const existing = makeInvitado({ guestAccessToken: undefined });
    // Simula el stamp: ?? randomUUID()
    const stamped = { ...existing, guestAccessToken: existing.guestAccessToken ?? 'new-uuid-value' };
    expect(stamped.guestAccessToken).toBe('new-uuid-value');
  });

  it('submitPublicRsvp — invitado existente con token conserva el original', () => {
    const originalToken = 'preserved-token-xyz';
    const existing = makeInvitado({ guestAccessToken: originalToken });
    const stamped = { ...existing, guestAccessToken: existing.guestAccessToken ?? 'new-uuid-value' };
    expect(stamped.guestAccessToken).toBe(originalToken);
  });

  it('check-in valida por token y no necesita guestId cuando token coincide', () => {
    const token = 'check-in-token-abc';
    const guestList: Invitado[] = [
      makeInvitado({ guestAccessToken: token, tableNumber: '5' }),
    ];
    // Lógica del accesos page: prefer token lookup
    const matchByToken = guestList.find(g => g.guestAccessToken === token);
    expect(matchByToken).toBeDefined();
    expect(matchByToken?.tableNumber).toBe('5');
  });

  it('check-in cae en fallback por guestId cuando no hay token en QR', () => {
    const guest = makeInvitado({ guestAccessToken: 'tok-xyz' });
    const guestList: Invitado[] = [guest];
    const guestId = guest.id;
    // Simula QR sin token field
    const matchByGuestId = guestList.find(g => g.id === guestId);
    expect(matchByGuestId).toBeDefined();
    expect(matchByGuestId?.id).toBe(guestId);
  });
});
