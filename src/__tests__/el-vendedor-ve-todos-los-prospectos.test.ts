/**
 * Auditoría del 18/11/2026, A18-04: con 16 prospectos el asistente Vendedor veía 12 y no encontraba uno recién creado.
 */
import { armarContextoDelNegocio } from '@/lib/multiagent/contexto-negocio';

it('con 16 prospectos, el recién creado y el más viejo están en el contexto', () => {
  const prospectos = Array.from({ length: 16 }, (_, i) => ({
    name: `Prospecto ${String(i + 1).padStart(2, '0')}`,
    createdAt: `2026-11-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
  }));
  const texto = armarContextoDelNegocio({ perfil: 'dueno', role: 'admin' } as any, { prospectos } as any);
  expect(texto).toContain('16 en total');
  expect(texto).toContain('Prospecto 16'); // el más nuevo, con detalle
  expect(texto).toContain('Prospecto 01'); // el más viejo, por nombre
});
