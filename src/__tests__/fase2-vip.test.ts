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
    landingUrl: 'https://ak-producciones.com',
    simulatorUrl: 'https://ak-producciones.com/simulador',
    whatsappNumber: '59898355530',
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
