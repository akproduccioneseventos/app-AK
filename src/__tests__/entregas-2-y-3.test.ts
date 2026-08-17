import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });

import { calcularHorariosDisponibles } from '@/lib/agenda/horarios-disponibles';
import { getGuestCountForItem } from '@/lib/calculations';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Entregas 2 y 3: Validaciones Unitarias', () => {
  describe('Bloque E: Horarios disponibles de atención', () => {
    it('calcula franjas horarias válidas excluyendo domingos y lunes', () => {
      const fechaBase = new Date(2026, 7, 18); // Martes 18 de agosto 2026
      const days = calcularHorariosDisponibles([], 7, fechaBase);

      expect(days.length).toBeGreaterThan(0);
      days.forEach((day) => {
        const d = new Date(day.date + 'T12:00:00');
        const dayOfWeek = d.getDay();
        // Domingo (0) y Lunes (1) no deben tener slots
        expect(dayOfWeek).not.toBe(0);
        expect(dayOfWeek).not.toBe(1);
        expect(day.slots.length).toBeGreaterThan(0);
      });
    });

    it('bloquea correctamente franjas ocupadas por citas existentes', () => {
      const fechaBase = new Date(2026, 7, 18); // Martes
      const slotOcupadoIso = '2026-08-18T10:00:00';
      const appointments = [
        {
          id: 'apt-1',
          clienteNombre: 'Test',
          clienteContacto: '099111222',
          fechaHora: slotOcupadoIso,
          estado: 'Agendada' as const,
          creadoEn: new Date().toISOString(),
        },
      ];

      const days = calcularHorariosDisponibles(appointments, 7, fechaBase);
      const martes = days.find((d) => d.date === '2026-08-18');
      expect(martes).toBeDefined();
      const slotDiez = martes?.slots.find((s) => s.time === '10:00');
      expect(slotDiez).toBeUndefined(); // El slot de las 10:00 debe haber sido filtrado
    });
  });

  describe('Bloque G: Categoría Adolescentes y Menores agrupados', () => {
    it('agrupa niños y adolescentes para platos de menores sin alterar fórmulas', () => {
      const itemMenores = {
        nombreServicio: 'Menú Infantil y Nuggets',
        categoriaServicio: 'Menú Infantil',
      };
      const totalMenores = getGuestCountForItem(itemMenores, 80, 15, 10);
      // 15 adolescentes + 10 niños = 25 menores
      expect(totalMenores).toBe(25);
    });

    it('aplica plato principal solo a adultos excluyendo menores', () => {
      const itemAdultos = {
        nombreServicio: 'Plato Principal Gourmet',
        categoriaServicio: 'Plato Principal',
      };
      const totalAdultos = getGuestCountForItem(itemAdultos, 80, 15, 10);
      expect(totalAdultos).toBe(80);
    });
  });

  describe('Bloque L: Generador de Libro de la Fiesta en PDF', () => {
    it('genera un documento PDF válido con portada y secciones', async () => {
      const { generarLibroFiestaPdf } = await import('@/lib/pdf/generador-libro-fiesta');
      const fiestaMock: FiestaEnPlanificacion = {
        id: 'fiesta-123',
        presupuestoId: 'pres-123',
        clienteId: 'cli-123',
        configuracion: {
          nombreEvento: '15 de Valentina',
          fechaEvento: '2026-11-20',
          nombreLugar: 'Club Uruguay, Salto',
          cantidadInvitados: 120,
        },
        invitados: [],
        mesas: [],
        pagos: [],
        programa: [
          { id: 'h-1', hora: '21:00', titulo: 'Recepción' },
          { id: 'h-2', hora: '22:30', titulo: 'Entrada de la Quinceañera' },
        ],
        estado: 'En Planificación',
      };

      const doc = generarLibroFiestaPdf({
        fiesta: fiestaMock,
        posts: [],
        dedications: [
          {
            id: 'd-1',
            authorName: 'Marta (Abuela)',
            message: '¡Felices 15 mi vida! Te amamos con todo el corazón.',
            timestamp: new Date().toISOString(),
          },
        ],
        songs: [
          {
            id: 's-1',
            song: 'Danza Kuduro',
            requestedBy: 'Juan',
            votes: 18,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      expect(doc).toBeDefined();
      expect(doc.internal.pages.length).toBeGreaterThanOrEqual(3);
    });
  });
});
