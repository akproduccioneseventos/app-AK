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

jest.mock('@/lib/ai/gemini-image', () => ({
  generateGeminiImage: jest.fn(async () => 'https://mock.image/gemini-salon.jpg'),
}));

// Desde la orden 250 la vista del salón pasa por el tope de gasto de IA del mes.
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => {}),
}));

describe('Orden 106 — El salón se arma con una frase y vista mágica', () => {
  test('el configurador de reunión retirado en Orden 321 redirige a plantillas de reuniones y su acción sigue activa', () => {
    const nextConfig = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
    const templatesReuniones = path.join(
      process.cwd(),
      'src/components/settings/panels/templates--reuniones.tsx'
    );
    const decoracionActions = fs.readFileSync(
      path.join(process.cwd(), 'src/app/actions/fiesta/decoracion.actions.ts'),
      'utf8'
    );

    expect(nextConfig).toContain("'/empresa/configurador-reunion'");
    expect(nextConfig).toContain('/settings?seccion=contratos&sub=templates--reuniones');
    expect(fs.existsSync(templatesReuniones)).toBe(true);
    expect(decoracionActions).toContain('export async function generarVisualizacionSalonReunion');
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
