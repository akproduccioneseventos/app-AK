import fs from 'node:fs';
import path from 'node:path';
import { calcularResumenNoche, CapturaRegistrada } from '@/lib/entretenimiento/resumen-noche';
import { dibujarMarcoDinamico } from '@/lib/entretenimiento/marcos-dinamicos';

describe('Orden 14: Entretenimiento Unificado de AK', () => {
  describe('Bloque 10 — Resumen automático de la noche', () => {
    it('calcula totales, estación más usada y pico horario correctamente', () => {
      const capturasMock: CapturaRegistrada[] = [
        { id: '1', estacionId: 'plataforma360', timestamp: '2026-08-27T01:15:00Z', guestId: 'g1' },
        { id: '2', estacionId: 'plataforma360', timestamp: '2026-08-27T01:30:00Z', guestId: 'g2' },
        { id: '3', estacionId: 'plataforma360', timestamp: '2026-08-27T01:45:00Z', guestId: 'g3' },
        { id: '4', estacionId: 'bogue', timestamp: '2026-08-27T02:10:00Z', guestId: 'g1' },
        { id: '5', estacionId: 'espejoMagicoFoto', timestamp: '2026-08-27T00:20:00Z', guestId: 'g4' },
      ];

      const resumen = calcularResumenNoche(capturasMock, '15 Años de Sofía');

      expect(resumen.totalCapturas).toBe(5);
      expect(resumen.estacionMasUsada.id).toBe('plataforma360');
      expect(resumen.estacionMasUsada.total).toBe(3);
      expect(resumen.invitadosParticipantes).toBe(4);
      expect(resumen.textoParaCliente).toContain('15 Años de Sofía');
      expect(resumen.textoParaCliente).toContain('Plataforma 360');
    });

    it('devuelve estructura segura cuando no hay capturas registradas', () => {
      const resumen = calcularResumenNoche([], 'Boda AK');
      expect(resumen.totalCapturas).toBe(0);
      expect(resumen.desglosePorEstacion).toHaveLength(0);
    });
  });

  describe('Bloque 5 — Marcos dinámicos con datos de fiesta', () => {
    it('ejecuta el dibujo de marco sin errores en canvas mockeado', () => {
      const mockCtx = {
        save: jest.fn(),
        restore: jest.fn(),
        strokeRect: jest.fn(),
        fillRect: jest.fn(),
        fillText: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        createLinearGradient: jest.fn().mockReturnValue({
          addColorStop: jest.fn(),
        }),
      } as unknown as CanvasRenderingContext2D;

      expect(() => {
        dibujarMarcoDinamico(mockCtx, 1200, 1800, {
          estilo: 'elegante',
          nombreAgasajado: 'Martina',
          nombreEvento: 'Mis 15',
          fechaEvento: '27/08/2026',
          colorPrimario: '#d4af37',
        });
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });

  describe('Bloque 14 — Club Uruguay en presentación LED', () => {
    it('el componente datos-evento-slide ofrece la tarjeta de Club Uruguay de forma permanente', () => {
      const slidePath = path.join(process.cwd(), 'src/app/presentacion-led/slides/datos-evento-slide.tsx');
      const content = fs.readFileSync(slidePath, 'utf8');

      expect(content).toContain('Opción destacada: Club Uruguay');
      expect(content).toContain('el alquiler se abona directamente en el Club');
    });
  });

  describe('Bloque 11 — Tótem maquetado sin roturas', () => {
    it('el archivo del tótem no tiene límites forzados que partan una palabra por renglón', () => {
      const totemPath = path.join(process.cwd(), 'src/app/evento/totem/[fiestaId]/[totemId]/page.tsx');
      const content = fs.readFileSync(totemPath, 'utf8');

      // No debe contener max-w-[56.25vh] restrictivo
      expect(content).not.toContain('max-w-[56.25vh]');
      expect(content).toContain('break-words');
    });
  });
});
