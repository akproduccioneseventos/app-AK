/**
 * @fileOverview Pruebas para la Orden 106 Bloques 7 y 11:
 * El salón se arma con una frase y visualización de referencia del salón decorado.
 */

import fs from 'node:fs';
import path from 'node:path';
import { generarVisualizacionSalonReunion } from '@/app/actions/fiesta/decoracion.actions';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ user: { id: 'usr_admin', role: 'admin' } })),
  hasAppSession: jest.fn(async () => true),
}));

jest.mock('@/lib/google-workspace', () => ({
  generateGeminiImage: jest.fn(async () => 'https://mock.image/gemini-salon.jpg'),
}));

describe('Orden 106 — El salón se arma con una frase y vista mágica', () => {
  const configuradorPath = path.join(
    process.cwd(),
    'src/app/(app)/empresa/configurador-reunion/page.tsx'
  );

  test('el configurador de reunión existe y contiene los elementos solicitados (frase, recorrer, salón decorado, asistente)', () => {
    expect(fs.existsSync(configuradorPath)).toBe(true);
    const content = fs.readFileSync(configuradorPath, 'utf8');

    expect(content).toContain('Armar con una frase');
    expect(content).toContain('Ver salón decorado');
    expect(content).toContain('Recorrer');
    expect(content).toContain('Asistente');
    expect(content).toContain('Imagen de referencia generada con IA');
  });

  test('generarVisualizacionSalonReunion devuelve dos imágenes de referencia', async () => {
    const res = await generarVisualizacionSalonReunion({
      tipoEvento: '15 Años',
      salonNombre: 'Club Uruguay',
      colorHex: '#7c3aed',
    });

    expect(res.success).toBe(true);
    expect(res.imagenes).toBeDefined();
    expect(res.imagenes!.length).toBe(2);
  });
});
