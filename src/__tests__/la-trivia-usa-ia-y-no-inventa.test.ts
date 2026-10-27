import { generarTriviaConIa } from '@/app/actions/games.actions';
import { launchGame } from '@/app/actions/fiesta/screen-mode.actions';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';
import { generateWithGeminiFallback } from '@/ai/genkit';
import fs from 'fs';
import path from 'path';

jest.mock('@/lib/auth/session-token', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { email: 'admin@ak.uy', role: 'admin' } }),
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { email: 'admin@ak.uy', role: 'admin' } }),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn().mockResolvedValue({
    id: 'fiesta_test',
    configuracion: { nombreEvento: 'Fiesta Test' },
    triviaGame: { id: 'trivia_1', confirmadaPorEquipo: false },
  }),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn().mockResolvedValue({
    id: 'fiesta_test',
    configuracion: { nombreEvento: 'Fiesta Test' },
    triviaGame: { id: 'trivia_1', confirmadaPorEquipo: false },
  }),
  saveFiesta: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(),
  registrarConsumoIA: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/ai/genkit', () => ({
  generateWithGeminiFallback: jest.fn(),
  geminiModel: 'gemini-test',
}));

describe('La trivia usa IA y no inventa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('con el tope de IA agotado no llama a Gemini', async () => {
    (hayPresupuestoParaIA as jest.Mock).mockResolvedValue(false);

    const res = await generarTriviaConIa('fiesta_test');

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/tope de ia agotado/i);
    expect(generateWithGeminiFallback).not.toHaveBeenCalled();
  });

  test('sin la confirmación del equipo, la trivia no arranca', async () => {
    const res = await launchGame('fiesta_test', {
      type: 'trivia',
      question: '¿Pregunta?',
      options: [{ id: 'a', text: 'Opción A' }],
      correctOptionId: 'a',
      timeLimitSeconds: 20,
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/confirmada por el equipo antes de jugar/i);
  });

  test('en ningún lado aparece la pregunta fija "¿Quién dijo"', () => {
    const gamesActionsCode = fs.readFileSync(
      path.join(process.cwd(), 'src/app/actions/games.actions.ts'),
      'utf8'
    );
    expect(gamesActionsCode).not.toContain('Quién dijo');
    expect(gamesActionsCode).not.toContain('quién dijo');
  });
});
