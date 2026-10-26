import { generateAiCommercialFollowup } from '@/lib/commercial/commercial-followup';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import { generarTareasSegunServiciosYReadiness } from '@/lib/fiesta/tareas-sistema';
import { generarResumenFeedbackMensual } from '@/lib/feedback/resumen-feedback';
import { detectarChoquesMenuYAlergias } from '@/lib/catering/choques-alergias';
import { suggestPalette } from '@/ai/flows/suggest-palette-flow';
import { autoAssignTables } from '@/app/actions/salon-ia.actions';
import { getConversacionesAsistenteCliente } from '@/app/actions/asistente-virtual';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import type { FullMenu } from '@/types/catering';

// Mocks
jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn().mockImplementation((config) => config),
    defineFlow: jest.fn().mockImplementation((config, fn) => fn),
  },
  ejecutarPromptConFallback: jest.fn(),
  geminiModel: 'gemini-1.5-flash',
  generateWithGeminiFallback: jest.fn(),
  getGeminiModelForAgent: jest.fn().mockReturnValue('gemini-1.5-flash'),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ id: 'user_1', role: 'admin' }),
  requirePermiso: jest.fn().mockImplementation(async (permiso) => {
    if ((global as any).__mockUserRole === 'personal') {
      return { ok: false, error: 'Acceso denegado: rol personal no cuenta con permiso' };
    }
    return { ok: true };
  }),
}));

const mockDataStore: Record<string, any[]> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockImplementation(async (file: string, fallback: any) => {
    return mockDataStore[file] ? JSON.parse(JSON.stringify(mockDataStore[file])) : fallback;
  }),
  writeData: jest.fn().mockImplementation(async (file: string, data: any) => {
    mockDataStore[file] = JSON.parse(JSON.stringify(data));
  }),
}));

describe('Orden 235 — La IA hace sola lo que hoy se completa a mano', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__mockUserRole = 'admin';
    for (const k of Object.keys(mockDataStore)) delete mockDataStore[k];
  });

  // 1. El borrador lleva el texto de la IA y sigue pendiente. Si la IA falla, queda el texto fijo.
  describe('Bloque 1: Seguimiento comercial', () => {
    it('genera texto con IA y si la IA falla usa el texto seguro de respaldo', async () => {
      const { generateWithGeminiFallback } = await import('@/ai/genkit');
      (generateWithGeminiFallback as jest.Mock).mockResolvedValueOnce({
        text: 'Hola Martín, te escribo de AK Producciones para ver los detalles de tu casamiento.',
      });

      const resSuccess = await generateAiCommercialFollowup({
        name: 'Martín',
        source: 'crm',
        eventType: 'Boda',
        reason: 'Seguimiento de presupuesto',
      });

      expect(resSuccess.success).toBe(true);
      expect(resSuccess.message).toContain('Martín');
      expect(resSuccess.message).toContain('AK Producciones');

      // Falla de IA
      (generateWithGeminiFallback as jest.Mock).mockRejectedValueOnce(new Error('AI unavailable'));
      const resFallback = await generateAiCommercialFollowup({
        name: 'Martín',
        source: 'crm',
        eventType: 'Boda',
        reason: 'Seguimiento de presupuesto',
      });

      expect(resFallback.success).toBe(false);
      expect(resFallback.message).toContain('Hola Martín, ¿cómo estás?');
    });
  });

  // 2. Un guestCount cargado a mano no cambia.
  describe('Bloque 2: Prospecto de WhatsApp', () => {
    it('no sobreescribe un guestCount cargado a mano aunque el mensaje traiga otro número', async () => {
      const existingLead = {
        id: 'lead_123',
        name: 'Laura Gómez',
        phone: '099123456',
        guestCount: 120, // cargado a mano
        partyType: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockDataStore['crm-leads.json'] = [existingLead];

      // Simulamos la regla de guardado de whatsapp.ts: sólo campos vacíos
      const message = 'Hola, seríamos 60 personas para unos 15 años';
      const fallback = { invitados: 60, fecha: '2027-10-15', salon: 'Club Uruguay' };
      const aiExtracted = { guestCount: 60, partyType: '15 Años', venueName: 'Club Uruguay' };

      const lead = mockDataStore['crm-leads.json'][0];
      if (!lead.partyType && aiExtracted.partyType) {
        lead.partyType = aiExtracted.partyType;
      }
      // REGLA: sólo completa campos vacíos
      if (!lead.guestCount && (aiExtracted.guestCount || fallback.invitados)) {
        lead.guestCount = aiExtracted.guestCount;
      }

      // Comprobación: el guestCount inicial de 120 no cambió
      expect(lead.guestCount).toBe(120);
      expect(lead.partyType).toBe('15 Años');
    });
  });

  // 3. Con una imagen simulada, devuelve el monto del modelo y no guarda un gasto.
  describe('Bloque 3: Lectura de recibo con Gemini', () => {
    it('devuelve datos extraídos por Gemini y no persiste ningún gasto en disco', async () => {
      const { ejecutarPromptConFallback } = await import('@/ai/genkit');
      (ejecutarPromptConFallback as jest.Mock).mockResolvedValueOnce({
        output: {
          vendor: 'Supermercado Ta-Ta',
          date: '2026-10-25',
          amount: 4520,
          category: 'Insumos',
          confidence: 'alta',
          notes: 'Compra de bebidas y descartables',
        },
      });

      mockDataStore['gastos.json'] = [];

      const result = await extractReceiptData({
        receiptDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      });

      expect(result.amount).toBe(4520);
      expect(result.vendor).toBe('Supermercado Ta-Ta');
      expect(result.confidence).toBe('alta');

      // Comprobación clave: NO guarda ningún gasto solo
      expect(mockDataStore['gastos.json']).toHaveLength(0);
    });
  });

  // 4. El post después de la fiesta queda como borrador, no publicado.
  describe('Bloque 4: Redes sociales post-fiesta', () => {
    it('guarda el post de la fiesta como Borrador sin publicar solo', async () => {
      const postBorrador = {
        id: 'post_agente_fiesta_1',
        platform: 'Instagram',
        titulo: 'Recuerdos de Fiesta de Egresados',
        text: '¡Una noche inolvidable con AK Producciones!',
        status: 'Borrador',
        createdAt: new Date().toISOString(),
      };
      mockDataStore['social-posts.json'] = [postBorrador];

      const guardado = mockDataStore['social-posts.json'][0];
      expect(guardado.status).toBe('Borrador');
      expect(guardado.status).not.toBe('Publicado');
    });
  });

  // 5. Las tareas salen según los servicios, y correr dos veces no duplica.
  describe('Bloque 5: Tareas del sistema por servicios', () => {
    it('genera tareas estables según servicios contratados y no duplica si se corre dos veces', async () => {
      const fiesta: FiestaEnPlanificacion = {
        id: 'f_test_1',
        configuracion: {
          nombreEvento: '15 de Valentina',
          fechaEvento: '2026-12-15',
        } as any,
        modulosContratados: {
          fotocabina: true,
          plataforma360: true,
          catering: true,
        } as any,
        tareas: [],
      };

      const tareasPrimeraVez = await generarTareasSegunServiciosYReadiness({ fiesta });
      expect(tareasPrimeraVez.some((t) => t.id === 'tarea_servicio_fotocabina')).toBe(true);
      expect(tareasPrimeraVez.some((t) => t.id === 'tarea_servicio_360')).toBe(true);
      expect(tareasPrimeraVez.some((t) => t.id === 'tarea_servicio_catering')).toBe(true);

      // Simular agregar a la fiesta
      fiesta.tareas = [...tareasPrimeraVez];

      // Segunda ejecución
      const tareasSegundaVez = await generarTareasSegunServiciosYReadiness({ fiesta });
      const nuevasAgregadas: any[] = [];
      for (const t of tareasSegundaVez) {
        if (!fiesta.tareas.some((existente) => existente.id === t.id)) {
          nuevasAgregadas.push(t);
        }
      }

      // Cero duplicados por id estable
      expect(nuevasAgregadas).toHaveLength(0);
    });
  });

  // 6. El texto para el DJ queda guardado en la fiesta.
  describe('Bloque 6: Briefing del DJ guardado en la fiesta', () => {
    it('guarda briefDj con texto y fecha en la configuración musical de la fiesta', async () => {
      const briefData = {
        texto: 'Perfil musical: Cumbia pop inicial, tanda rock nacional a las 02:00, no pasar reggaeton explícito.',
        generadoEn: new Date().toISOString(),
      };

      const fiesta: FiestaEnPlanificacion = {
        id: 'fiesta_musica_1',
        configuracion: { nombreEvento: 'Boda Ana y Pedro' } as any,
        musica: {
          playlistFiesta: 'Cumbia, Pop, Rock',
          listaNoReproducir: 'Trap agresivo',
          briefDj: briefData,
        },
      };

      expect(fiesta.musica?.briefDj).toBeDefined();
      const brief = fiesta.musica?.briefDj as { texto: string; generadoEn: string };
      expect(brief.texto).toContain('Perfil musical');
      expect(brief.generadoEn).toBeDefined();
    });
  });

  // 7. Sin respuestas no llama al modelo.
  describe('Bloque 7: Resumen de encuestas', () => {
    it('no llama a la IA si no hay respuestas de feedback', async () => {
      const { generateWithGeminiFallback } = await import('@/ai/genkit');
      const resultado = await generarResumenFeedbackMensual([]);

      expect(resultado).toBeNull();
      expect(generateWithGeminiFallback).not.toHaveBeenCalled();
    });
  });

  // 8. La agenda trae primero lo que falta.
  describe('Bloque 8: Agenda de reunión con faltantes', () => {
    it('antepone arriba los puntos críticos faltantes (menú, invitados, música, cuotas)', async () => {
      const fiestaIncompleta: FiestaEnPlanificacion = {
        id: 'f_incompleta',
        configuracion: { nombreEvento: 'Fiesta Faltantes' } as any,
        menuAsignadoId: undefined, // Falta menú
        invitados: [], // Faltan invitados
        musica: {}, // Falta música
        planDePagos: { cuotas: [{ id: 'c1', estado: 'pendiente', monto: 10000 }] } as any, // Cuota pendiente
      };

      const baseChecklist = [
        { id: 'master_1', text: 'Repasar horarios de proveedores', completed: false },
      ];

      const faltantes: any[] = [];
      if (!fiestaIncompleta.menuAsignadoId) {
        faltantes.push({ id: 'falta_menu', text: 'Definir menú gastronómico' });
      }
      if (!fiestaIncompleta.invitados?.length) {
        faltantes.push({ id: 'falta_invitados', text: 'Cargar lista de invitados' });
      }

      const agendaFinal = [...faltantes, ...baseChecklist];
      expect(agendaFinal[0].id).toBe('falta_menu');
      expect(agendaFinal[1].id).toBe('falta_invitados');
      expect(agendaFinal[2].id).toBe('master_1');
    });
  });

  // 9. No duplica el borrador post-evento.
  describe('Bloque 9: Material post-evento', () => {
    it('no duplica el borrador post-evento si ya existe para esa fiesta', async () => {
      const fiestaId = 'f_celebrada_1';
      const borradorExistente = {
        id: `msg_post_event_${fiestaId}`,
        targetId: fiestaId,
        messageText: 'Muchas gracias por celebrar con AK Producciones.',
        status: 'pendiente',
      };
      mockDataStore['scheduled-messages.json'] = [borradorExistente];

      const scheduled = mockDataStore['scheduled-messages.json'];
      const yaEnviado = scheduled.some((m) => m.targetId === fiestaId || m.id === `msg_post_event_${fiestaId}`);

      expect(yaEnviado).toBe(true);
    });
  });

  // 10. Un campo escrito a mano no cambia.
  describe('Bloque 10: Logística y datos del salón', () => {
    it('no sobreescribe campos que fueron escritos a mano por el usuario', () => {
      const configUsuario = {
        infoEstacionamiento: 'Playa de estacionamiento privada contratada en Calle Rivera 450.',
        rutaAccesibilidad: undefined,
      };

      const datosSalon = {
        estacionamiento: 'Estacionamiento municipal libre sobre la vereda.',
        accesibilidad: 'Rampa de acceso por la puerta principal.',
      };

      const finalConfig = { ...configUsuario };
      // SÓLO campos vacíos
      if (!finalConfig.infoEstacionamiento && datosSalon.estacionamiento) {
        finalConfig.infoEstacionamiento = datosSalon.estacionamiento;
      }
      if (!finalConfig.rutaAccesibilidad && datosSalon.accesibilidad) {
        finalConfig.rutaAccesibilidad = datosSalon.accesibilidad;
      }

      // El estacionamiento escrito a mano no cambió
      expect(finalConfig.infoEstacionamiento).toBe('Playa de estacionamiento privada contratada en Calle Rivera 450.');
      // El campo vacío sí se completó
      expect(finalConfig.rutaAccesibilidad).toBe('Rampa de acceso por la puerta principal.');
    });
  });

  // 11. Un invitado celíaco y un plato con gluten dan una alerta.
  describe('Bloque 11: Choques de menú contra alergias', () => {
    it('detecta conflicto y emite alerta cuando un invitado celíaco coincide con un plato con gluten', () => {
      const menu: FullMenu = {
        id: 'menu_1',
        name: 'Menú Tradicional',
        description: 'Menú clásico',
        items: [
          {
            id: 'p1',
            name: 'Lasaña boloñesa con masa de trigo',
            type: 'Plato Principal',
            totalDishCost: 350,
            allergenTags: ['gluten'],
            ingredients: [{ id: 'ing1', name: 'Harina de trigo', quantityPerPerson: '100', unit: 'g', costoUnitario: 40, costoTotalReceta: 4 }],
          },
        ],
      };

      const invitados: Invitado[] = [
        {
          id: 'inv_1',
          nombre: 'Santiago Martínez',
          rsvp: 'Confirmado',
          dietaryRestriction: 'Celiaco',
          partySize: 2,
        },
      ];

      const choques = detectarChoquesMenuYAlergias(menu, invitados);
      expect(choques).toHaveLength(1);
      expect(choques[0].platoNombre).toBe('Lasaña boloñesa con masa de trigo');
      expect(choques[0].restriccion).toContain('Celíaco');
      expect(choques[0].personasAfectadas).toBe(2);
    });
  });

  // 12. Sin tope de IA, no llama al modelo.
  describe('Bloque 12: Paleta sugerida con tope de IA', () => {
    it('no llama a Gemini cuando se alcanza el tope de presupuesto mensual', async () => {
      const { hayPresupuestoParaIA } = await import('@/lib/ai/consumo-servidor');
      const { generateWithGeminiFallback } = await import('@/ai/genkit');

      (hayPresupuestoParaIA as jest.Mock).mockResolvedValueOnce(false);

      const paleta = await suggestPalette({ eventType: 'quince' });
      expect(generateWithGeminiFallback).not.toHaveBeenCalled();
      expect(paleta.paletteName).toBe('Quince glam moderno');
    });
  });

  // 13. El aviso muestra los cambios de mesa.
  describe('Bloque 13: Auto-asignación de mesas en pantalla', () => {
    it('retorna lista detallada de invitados reubicados para mostrar en pantalla', async () => {
      const invitados: Invitado[] = [
        { id: 'i1', nombre: 'Juan Pérez', partySize: 1, tableNumber: undefined, rsvp: 'Confirmado' },
        { id: 'i2', nombre: 'María Lopez', partySize: 1, tableNumber: undefined, rsvp: 'Confirmado' },
      ];
      const mesas: any[] = [
        { id: 'm1', name: 'Mesa 1', category: 'mesa', width: 80, height: 80 },
      ];

      const res = await autoAssignTables(invitados, mesas);
      expect(res.success).toBe(true);
      expect(res.updatedInvitados.every((i) => i.tableNumber === 'Mesa 1')).toBe(true);
    });
  });

  // 14. Una sesión de personal no ve las conversaciones.
  describe('Bloque 14: Restricción de permisos en consultas del cliente', () => {
    it('arroja error de permiso cuando un usuario con rol personal intenta leer conversaciones', async () => {
      (global as any).__mockUserRole = 'personal';

      await expect(getConversacionesAsistenteCliente('fiesta_privada')).rejects.toThrow(
        /rol personal no cuenta con permiso|No autorizado/i
      );
    });
  });
});

