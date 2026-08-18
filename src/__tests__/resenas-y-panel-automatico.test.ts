jest.mock('server-only', () => ({}));

let memoryStore: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) => memoryStore[file] ?? def),
  writeData: jest.fn(async (file: string, data: any) => {
    memoryStore[file] = data;
    return true;
  }),
}));

const ahora = new Date();
const hace5Dias = new Date(ahora.getTime() - 5 * 86400000).toISOString().split('T')[0];

const mockFiestas = [
  {
    id: 'fiesta_1',
    configuracion: {
      nombreEvento: '15 Años de Martina',
      tipoCelebracion: '15_anos',
      fechaEvento: hace5Dias,
      clienteNombre: 'Gonzalo Silva',
      telefonoAsistencia: '098123456',
      nombreLugar: 'Club Uruguay',
    },
    invitacionConfig: {
      galeriaFotos: ['https://example.com/foto1.jpg', 'https://example.com/foto2.jpg'],
    },
    googleReviewRequested: false,
  },
];

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn(async () => mockFiestas),
  getFiestaById: jest.fn(async (id: string) => mockFiestas.find((f) => f.id === id)),
  saveFiesta: jest.fn(async () => true),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => []),
}));

jest.mock('@/app/actions/feedback', () => ({
  getFeedbackByFiestaId: jest.fn(async () => []),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => false),
  registrarConsumoIA: jest.fn(async () => {}),
}));

import {
  DIRECTORIOS_CANONICOS,
  getDirectorioAltas,
  toggleDirectorioItemInternal,
} from '@/lib/presencia-digital/directorio-altas';
import { autoGenerarBorradoresSemanales } from '@/lib/presencia-digital/autogenerador-semanal';
import {
  getFiestasSeguimientoResenas,
  marcarResenaSolicitada,
} from '@/lib/presencia-digital/resenas-seguimiento';
import fs from 'fs';
import path from 'path';

describe('Orden: La reseña de Google y el panel que trabaja solo', () => {
  beforeEach(() => {
    memoryStore = {};
  });

  describe('Bloque 1 — Pedir reseña de Google al final de la encuesta', () => {
    it('la pantalla de feedback ofrece dejar la reseña en Google a todos los que terminan', () => {
      const feedbackPageSource = fs.readFileSync(
        path.join(process.cwd(), 'src/app/feedback/[fiestaId]/page.tsx'),
        'utf8'
      );

      expect(feedbackPageSource).toContain('Dejar mi reseña en Google');
      expect(feedbackPageSource).toContain('¿Nos ayudás con una reseña en Google?');

      // El enlace sale de Ajustes, NO escrito a mano en la pantalla. Escribirlo a
      // mano ya pasó dos veces: si el dueño lo cambia, el botón sigue mandando al
      // viejo, y si nunca lo cargó, manda al cliente a una ficha que no es suya.
      expect(feedbackPageSource).toContain('getEnlaceDeResenaPublico');
      expect(feedbackPageSource).not.toMatch(/https:\/\/g\.page\//);
      // Y si no hay enlace cargado, el bloque no se muestra.
      expect(feedbackPageSource).toContain('{googleReviewsUrl && (');
    });

    it('no esconde el botón a los clientes que tuvieron una mala experiencia (anti gatekeeping)', () => {
      const feedbackPageSource = fs.readFileSync(
        path.join(process.cwd(), 'src/app/feedback/[fiestaId]/page.tsx'),
        'utf8'
      );

      expect(feedbackPageSource).toContain('Lamentamos no haber alcanzado tus expectativas al 100%');
      expect(feedbackPageSource).toContain('Nuestro equipo se va a contactar con vos');
    });

    it('enviarPedidoDeResena y saveFeedback no filtran por calificación (sin gatekeeping en el servidor)', () => {
      const feedbackActionsSource = fs.readFileSync(
        path.join(process.cwd(), 'src/app/actions/feedback.ts'),
        'utf8'
      );

      expect(feedbackActionsSource).not.toContain('feedback.npsScore ?? 0) < 9');
      expect(feedbackActionsSource).not.toContain('newFeedback.npsScore ?? 0) >= 9');
      expect(feedbackActionsSource).toContain('esDetractor');
    });
  });

  describe('Bloque 2 — Seguimiento de reseñas de los últimos 30 días', () => {
    it('obtiene el resumen de fiestas de los últimos 30 días con datos estructurados', async () => {
      const res = await getFiestasSeguimientoResenas();
      expect(res).toBeDefined();
      expect(res.totalUltimos30Dias).toBe(1);
      expect(res.fiestas[0].nombreEvento).toBe('15 Años de Martina');
      expect(res.fiestas[0].clienteTelefono).toBe('59898123456');
      expect(res.fiestas[0].whatsappUrl).toContain('wa.me/59898123456');
    });

    it('permite marcar la reseña como solicitada', async () => {
      const ok = await marcarResenaSolicitada('fiesta_1');
      expect(ok).toBe(true);
      expect(mockFiestas[0].googleReviewRequested).toBe(true);
    });
  });

  describe('Bloque 3 — Alerta de puntaje menor a 4 estrellas', () => {
    it('el panel de presencia digital tiene la alerta por si el puntaje baja de 4.0', () => {
      const clientSource = fs.readFileSync(
        path.join(
          process.cwd(),
          'src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx'
        ),
        'utf8'
      );

      expect(clientSource).toContain('kpis.googleRating < 4.0');
      expect(clientSource).toContain('Tu puntaje en Google bajó a');
      expect(clientSource).toContain('El 87% de las familias no contacta a empresas con menos de 4 estrellas');
    });
  });

  describe('Bloque 4 — El tablero de 16 altas en directorios', () => {
    it('cuenta con exactamente 16 directorios oficiales clasificados en gratis y pagos', () => {
      expect(DIRECTORIOS_CANONICOS).toHaveLength(16);

      const gratis = DIRECTORIOS_CANONICOS.filter((d) => d.tipo === 'gratis');
      const pagos = DIRECTORIOS_CANONICOS.filter((d) => d.tipo === 'pago');

      expect(gratis).toHaveLength(10);
      expect(pagos).toHaveLength(6);

      const nombres = DIRECTORIOS_CANONICOS.map((d) => d.nombre);
      expect(nombres).toContain('Google Perfil de Empresa');
      expect(nombres).toContain('Casamiento.com.uy');
      expect(nombres).toContain('Gallito');
      expect(nombres).toContain('Centro Comercial e Industrial de Salto');
      expect(nombres).toContain('Cámara de Eventos del Uruguay');
      expect(nombres).toContain('Revista Bodas Uruguay');
    });

    it('calcula porcentaje y permite tildar altas completadas', async () => {
      const inicial = await getDirectorioAltas();
      expect(inicial.total).toBe(16);
      expect(typeof inicial.porcentaje).toBe('number');

      // Tildar Google Business
      const actualizado = await toggleDirectorioItemInternal('google_business', true);
      const item = actualizado.items.find((i) => i.id === 'google_business');
      expect(item?.completado).toBe(true);
      expect(actualizado.completados).toBe(1);
    });
  });

  describe('Bloque 5 — Generador de publicaciones semanales desatendido', () => {
    it('genera publicaciones en estado Borrador sin publicar nada automáticamente', async () => {
      const resultado = await autoGenerarBorradoresSemanales();
      expect(resultado.success).toBe(true);
      expect(resultado.createdCount).toBeGreaterThan(0);
      expect(['fiesta_reciente', 'preguntas_frecuentes', 'sin_material']).toContain(
        resultado.tipoOrigen
      );

      for (const p of resultado.posts) {
        expect(p.status).toBe('Borrador');
        expect(p.text.length).toBeGreaterThan(10);
      }
    });
  });
});
