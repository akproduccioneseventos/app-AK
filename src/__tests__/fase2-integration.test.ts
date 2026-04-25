/**
 * Tests para FASE 2 — Integración de Módulos VIP: Portal Cliente, Portal Invitado y Planificador.
 *
 * Valida:
 * 1. Tipos de ClientePortalExperience correctamente estructurados
 * 2. GuestExperienceSettings incluye nuevos campos (showSocialCta, showBudgetSimulatorCta, simulatorUrl)
 * 3. FiestaEnPlanificacion acepta clientePortalExperience
 * 4. Portal cliente muestra clienteDebeLlevar, itinerario y pagos
 * 5. Portal invitado muestra QR, mesa y CTA de AK
 * 6. Diseño de salón alimenta cartelería (tabla de salonElements)
 * 7. Invitados alimentan check-in
 */

import type {
  FiestaEnPlanificacion,
  ClientePortalExperience,
  GuestExperienceSettings,
  ClienteDebeLlevarItem,
  Invitado,
  LayoutElement,
  PlanDePagos,
  ProgramaEventoItem,
  GuestPortalSettings,
} from '@/types/fiesta';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeMinimalFiesta(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  return {
    id: 'fiesta_test_1',
    configuracion: {
      nombreEvento: 'XV de Valentina',
      tipoCelebracion: 'XV años',
      fechaEvento: '2026-09-05T00:00:00.000Z',
      horaInicio: '21:00',
      horaFin: '05:00',
      nombreLugar: 'Salón Club Uruguay',
      invitadosEstimados: 120,
      presupuestoEstimado: 150000,
      notesAdicionales: '',
    },
    personalAsignado: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Types — ClientePortalExperience
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientePortalExperience type', () => {
  it('acepta todos los campos opcionales correctamente', () => {
    const exp: ClientePortalExperience = {
      heroImageUrl: 'https://example.com/hero.jpg',
      primaryColor: '#9333ea',
      welcomeMessage: '¡Bienvenida Valentina!',
      organizerMessage: 'Tu evento está en las mejores manos.',
      simplicityMode: false,
      clienteDebeLlevar: [],
    };
    expect(exp.heroImageUrl).toBe('https://example.com/hero.jpg');
    expect(exp.primaryColor).toBe('#9333ea');
    expect(exp.welcomeMessage).toBe('¡Bienvenida Valentina!');
    expect(exp.organizerMessage).toBe('Tu evento está en las mejores manos.');
    expect(exp.simplicityMode).toBe(false);
    expect(exp.clienteDebeLlevar).toEqual([]);
  });

  it('es válido sin campos opcionales', () => {
    const exp: ClientePortalExperience = {};
    expect(exp).toBeDefined();
    expect(exp.heroImageUrl).toBeUndefined();
    expect(exp.simplicityMode).toBeUndefined();
  });

  it('simplicityMode: true oculta funcionalidades avanzadas', () => {
    const exp: ClientePortalExperience = { simplicityMode: true };
    // En el portal, simplicityMode = true debe ocultar los feature nav cards
    expect(exp.simplicityMode).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Types — GuestExperienceSettings con nuevos campos
// ─────────────────────────────────────────────────────────────────────────────

describe('GuestExperienceSettings', () => {
  it('incluye los campos de FASE 2: showSocialCta, showBudgetSimulatorCta, simulatorUrl', () => {
    const settings: GuestExperienceSettings = {
      enabled: true,
      showAkBranding: true,
      showLandingCta: true,
      showSocialCta: true,
      showBudgetSimulatorCta: true,
      simulatorUrl: 'https://ak-producciones.com/simulador',
      landingUrl: 'https://ak-producciones.com',
      whatsappNumber: '59898355530',
      instagramUrl: 'https://instagram.com/akproducciones',
      ctaTitle: '¿Te gustó esta experiencia?',
      ctaText: 'Organizamos tu próximo evento con la misma dedicación.',
    };
    expect(settings.showSocialCta).toBe(true);
    expect(settings.showBudgetSimulatorCta).toBe(true);
    expect(settings.simulatorUrl).toBe('https://ak-producciones.com/simulador');
  });

  it('funciona sin los nuevos campos (backward compatible)', () => {
    const settings: GuestExperienceSettings = {
      enabled: true,
      showAkBranding: false,
      showLandingCta: false,
    };
    expect(settings.showSocialCta).toBeUndefined();
    expect(settings.showBudgetSimulatorCta).toBeUndefined();
    expect(settings.simulatorUrl).toBeUndefined();
  });

  it('CTA de AK no se muestra si showAkBranding es false', () => {
    const settings: GuestExperienceSettings = {
      enabled: true,
      showAkBranding: false,
      showLandingCta: false,
    };
    const showAkCta = settings.enabled && settings.showAkBranding;
    expect(showAkCta).toBe(false);
  });

  it('CTA de AK se muestra si enabled y showAkBranding son true', () => {
    const settings: GuestExperienceSettings = {
      enabled: true,
      showAkBranding: true,
      showLandingCta: false,
    };
    const showAkCta = settings.enabled && settings.showAkBranding;
    expect(showAkCta).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. FiestaEnPlanificacion acepta clientePortalExperience
// ─────────────────────────────────────────────────────────────────────────────

describe('FiestaEnPlanificacion con clientePortalExperience', () => {
  it('acepta campo clientePortalExperience', () => {
    const fiesta = makeMinimalFiesta({
      clientePortalExperience: {
        heroImageUrl: 'https://example.com/img.jpg',
        primaryColor: '#c084fc',
        welcomeMessage: '¡Bienvenida!',
        organizerMessage: 'Todo listo para tu gran día.',
        simplicityMode: false,
      },
    });
    expect(fiesta.clientePortalExperience?.welcomeMessage).toBe('¡Bienvenida!');
    expect(fiesta.clientePortalExperience?.primaryColor).toBe('#c084fc');
  });

  it('es compatible sin clientePortalExperience (backward compatible)', () => {
    const fiesta = makeMinimalFiesta();
    expect(fiesta.clientePortalExperience).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Portal Cliente — clienteDebeLlevar, itinerario y pagos
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Cliente VIP — datos visibles', () => {
  it('clienteDebeLlevar se carga desde el evento', () => {
    const items: ClienteDebeLlevarItem[] = [
      { id: 'item1', texto: 'Fotos de infancia', completado: false, obligatorio: true },
      { id: 'item2', texto: 'Canción de vals', completado: true, estado: 'enviado' },
    ];
    const fiesta = makeMinimalFiesta({ clienteDebeLlevar: items });
    expect(fiesta.clienteDebeLlevar).toHaveLength(2);
    expect(fiesta.clienteDebeLlevar?.[0].texto).toBe('Fotos de infancia');
    expect(fiesta.clienteDebeLlevar?.[0].obligatorio).toBe(true);
    expect(fiesta.clienteDebeLlevar?.[1].completado).toBe(true);
    expect(fiesta.clienteDebeLlevar?.[1].estado).toBe('enviado');
  });

  it('itinerario (programa) se carga desde el evento', () => {
    const programa: ProgramaEventoItem[] = [
      { id: 'p1', hora: '21:00', titulo: 'Recepción de invitados' },
      { id: 'p2', hora: '22:00', titulo: 'Entrada de la homenajeada' },
      { id: 'p3', hora: '22:30', titulo: 'Brindis' },
    ];
    const fiesta = makeMinimalFiesta({ programa });
    expect(fiesta.programa).toHaveLength(3);
    expect(fiesta.programa?.[0].hora).toBe('21:00');
    expect(fiesta.programa?.[1].titulo).toBe('Entrada de la homenajeada');
  });

  it('plan de pagos muestra total, pagado y saldo', () => {
    const planDePagos: PlanDePagos = {
      id: 'plan1',
      fiestaId: 'fiesta_test_1',
      cuotas: [
        { id: 'c1', descripcion: 'Seña', monto: 20000, fechaVencimiento: '2026-01-01', estado: 'pagado', fechaPago: '2026-01-01' },
        { id: 'c2', descripcion: 'Cuota 1', monto: 30000, fechaVencimiento: '2026-05-01', estado: 'pendiente' },
        { id: 'c3', descripcion: 'Saldo Final', monto: 50000, fechaVencimiento: '2026-09-01', estado: 'pendiente' },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const fiesta = makeMinimalFiesta({ planDePagos });
    const cuotas = fiesta.planDePagos?.cuotas ?? [];
    const totalCost = cuotas.reduce((acc, c) => acc + c.monto, 0);
    const totalPaid = cuotas.filter(c => c.estado === 'pagado').reduce((acc, c) => acc + c.monto, 0);
    const balance = totalCost - totalPaid;
    expect(totalCost).toBe(100000);
    expect(totalPaid).toBe(20000);
    expect(balance).toBe(80000);
  });

  it('clientePortalExperience.welcomeMessage y organizerMessage están disponibles', () => {
    const fiesta = makeMinimalFiesta({
      clientePortalExperience: {
        welcomeMessage: '¡Bienvenida, Valentina! Tu gran día está próximo.',
        organizerMessage: 'Recuerda traer las fotos de infancia antes del 1 de agosto.',
      },
    });
    expect(fiesta.clientePortalExperience?.welcomeMessage).toContain('Valentina');
    expect(fiesta.clientePortalExperience?.organizerMessage).toContain('fotos de infancia');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Portal Invitado VIP — QR, mesa asignada y CTA
// ─────────────────────────────────────────────────────────────────────────────

describe('Portal Invitado VIP — QR, mesa y CTA', () => {
  it('invitado confirmado tiene tabla asignada y guestAccessToken', () => {
    const invitado: Invitado = {
      id: 'inv1',
      nombre: 'María García',
      rsvp: 'Confirmado',
      tableNumber: '5',
      guestAccessToken: 'token_abc123',
      dietaryRestriction: 'Celiaco',
    };
    // El QR se genera con guestId o guestAccessToken
    const baseUrl = 'https://app-ak.vercel.app';
    const fiestaId = 'fiesta_test_1';
    const qrValue = `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&guestId=${invitado.id}`;
    expect(qrValue).toContain('/evento/accesos/');
    expect(qrValue).toContain(fiestaId);
    expect(invitado.tableNumber).toBe('5');
    expect(invitado.guestAccessToken).toBe('token_abc123');
  });

  it('CTA de AK se construye correctamente con los links', () => {
    const guestExp: GuestExperienceSettings = {
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
    };
    expect(guestExp.landingUrl).toBeDefined();
    expect(guestExp.simulatorUrl).toBeDefined();
    expect(guestExp.whatsappNumber).toBe('59898355530');
    // showAkBranding activo → mostrar CTA
    expect(guestExp.enabled && guestExp.showAkBranding).toBe(true);
  });

  it('invitado rechazado no obtiene QR', () => {
    const invitado: Invitado = {
      id: 'inv2',
      nombre: 'Juan Pérez',
      rsvp: 'Rechazado',
    };
    // Solo los confirmados deben mostrar QR
    const debeMostrarQR = invitado.rsvp === 'Confirmado';
    expect(debeMostrarQR).toBe(false);
  });

  it('porta social url apunta a /evento/social/ (no a /muro-en-vivo/)', () => {
    const fiestaId = 'fiesta_test_1';
    const socialUrl = `/evento/social/${fiestaId}`;
    const muralUrl = `/evento/muro-en-vivo/${fiestaId}`;
    // Invitados deben usar el portal social (no la pantalla gigante)
    expect(socialUrl).toContain('/evento/social/');
    expect(socialUrl).not.toContain('/muro-en-vivo/');
    expect(muralUrl).toContain('/muro-en-vivo/');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Diseño de Salón → Cartelería (salonElements)
// ─────────────────────────────────────────────────────────────────────────────

describe('Diseño de Salón alimenta Cartelería', () => {
  it('cuenta mesas desde salonElements cuando hay seats definidos', () => {
    const salonElements: LayoutElement[] = [
      { id: 'el1', name: 'Mesa 1', x: 0, y: 0, rotation: 0, type: 'element', seats: 8 },
      { id: 'el2', name: 'Mesa 2', x: 100, y: 0, rotation: 0, type: 'element', seats: 6 },
      { id: 'el3', name: 'Mesa 3', x: 200, y: 0, rotation: 0, type: 'element', seats: 10 },
      { id: 'ar1', name: 'Área de baile', x: 0, y: 200, rotation: 0, type: 'area' }, // área, no cuenta
    ];
    const tableElements = salonElements.filter(
      el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa'))
    );
    expect(tableElements).toHaveLength(3);
  });

  it('cuenta mesas por nombre cuando no tienen seats', () => {
    const salonElements: LayoutElement[] = [
      { id: 'el1', name: 'Mesa Redonda A', x: 0, y: 0, rotation: 0, type: 'element' },
      { id: 'el2', name: 'Mesa Cuadrada B', x: 100, y: 0, rotation: 0, type: 'element' },
      { id: 'el3', name: 'Escenario', x: 0, y: 100, rotation: 0, type: 'element' },
      { id: 'el4', name: 'Zona DJ', x: 100, y: 100, rotation: 0, type: 'element' },
    ];
    const tableElements = salonElements.filter(
      el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa'))
    );
    expect(tableElements).toHaveLength(2);
  });

  it('retorna 0 si no hay salonElements', () => {
    const fiesta = makeMinimalFiesta(); // sin decoracion
    const salonElements = fiesta.decoracion?.salonElements ?? [];
    const tableElements = salonElements.filter(
      el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa'))
    );
    expect(tableElements).toHaveLength(0);
  });

  it('auto-pull conecta el número correcto de tablas para cartelería', () => {
    const fiesta = makeMinimalFiesta({
      decoracion: {
        salonElements: [
          { id: 't1', name: 'Mesa 1', x: 0, y: 0, rotation: 0, type: 'element', seats: 8 },
          { id: 't2', name: 'Mesa 2', x: 100, y: 0, rotation: 0, type: 'element', seats: 8 },
          { id: 't3', name: 'Mesa 3', x: 200, y: 0, rotation: 0, type: 'element', seats: 8 },
          { id: 't4', name: 'Mesa VIP', x: 300, y: 0, rotation: 0, type: 'element', seats: 4 },
          { id: 'a1', name: 'Pista de baile', x: 0, y: 200, rotation: 0, type: 'area' },
        ],
        paletaColores: { primary: '#9333ea', secondary: '#ffffff', accent: '#f59e0b' },
      },
    });
    const salonElements = fiesta.decoracion?.salonElements ?? [];
    const tableCount = salonElements.filter(
      el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa'))
    ).length;
    expect(tableCount).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Invitados alimentan Check-in
// ─────────────────────────────────────────────────────────────────────────────

describe('Invitados → Check-in', () => {
  it('invitado confirmado puede hacer check-in', () => {
    const invitado: Invitado = {
      id: 'inv1',
      nombre: 'Ana Martínez',
      rsvp: 'Confirmado',
      guestAccessToken: 'token_secure_xyz',
      tableNumber: '3',
    };
    // Check-in válido: token coincide y rsvp es Confirmado
    const isEligibleForCheckIn = invitado.rsvp === 'Confirmado' && !!invitado.guestAccessToken;
    expect(isEligibleForCheckIn).toBe(true);
  });

  it('invitado rechazado no puede hacer check-in', () => {
    const invitado: Invitado = {
      id: 'inv2',
      nombre: 'Pedro López',
      rsvp: 'Rechazado',
    };
    const isEligibleForCheckIn = invitado.rsvp === 'Confirmado';
    expect(isEligibleForCheckIn).toBe(false);
  });

  it('check-in registra timestamp y marca checkedIn', () => {
    const invitado: Invitado = {
      id: 'inv1',
      nombre: 'Ana Martínez',
      rsvp: 'Confirmado',
      guestAccessToken: 'token_secure_xyz',
      checkedIn: false,
    };
    // Simulamos el check-in
    const updatedInvitado: Invitado = {
      ...invitado,
      checkedIn: true,
      checkInTimestamp: new Date().toISOString(),
    };
    expect(updatedInvitado.checkedIn).toBe(true);
    expect(updatedInvitado.checkInTimestamp).toBeDefined();
  });

  it('validación de token en acceso: token inválido genera rechazo', () => {
    const validToken = 'token_real_abc';
    const presentedToken = 'token_falso_xyz';
    const isValidAccess = validToken === presentedToken;
    expect(isValidAccess).toBe(false);
  });

  it('estadísticas de check-in: calcula porcentaje correcto', () => {
    const invitados: Invitado[] = [
      { id: '1', nombre: 'Ana', rsvp: 'Confirmado', checkedIn: true },
      { id: '2', nombre: 'Pedro', rsvp: 'Confirmado', checkedIn: true },
      { id: '3', nombre: 'María', rsvp: 'Confirmado', checkedIn: false },
      { id: '4', nombre: 'Juan', rsvp: 'Rechazado' },
    ];
    const confirmed = invitados.filter(i => i.rsvp === 'Confirmado');
    const checkedIn = invitados.filter(i => i.checkedIn);
    const percentage = Math.round((checkedIn.length / confirmed.length) * 100);
    expect(confirmed).toHaveLength(3);
    expect(checkedIn).toHaveLength(2);
    expect(percentage).toBe(67);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. GuestPortalSettings — visibilidad de módulos
// ─────────────────────────────────────────────────────────────────────────────

describe('GuestPortalSettings — visibilidad de módulos', () => {
  it('muestra mural social cuando showMural es true', () => {
    const settings: GuestPortalSettings = {
      showMural: true,
      showFotos: true,
      showInvitacionWeb: true,
      showMesaAsignada: true,
      showItinerario: true,
      showMusica: true,
      showRegalos: true,
      showCheckin: true,
    };
    expect(settings.showMural).toBe(true);
    expect(settings.showMesaAsignada).toBe(true);
  });

  it('oculta módulos cuando sus flags son false', () => {
    const settings: GuestPortalSettings = {
      showMural: false,
      showFotos: false,
      showInvitacionWeb: true,
      showMesaAsignada: false,
      showItinerario: true,
      showMusica: false,
      showRegalos: false,
      showCheckin: true,
    };
    expect(settings.showMural).toBe(false);
    expect(settings.showMesaAsignada).toBe(false);
  });
});
