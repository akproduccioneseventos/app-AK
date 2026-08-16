import { calculateSimulatorPricing } from '@/lib/simulator/pricing';
import type { ServicioEmpresa } from '@/types/empresa';

describe('Bloque C — Configurador visual de cierre', () => {
  const serviciosMock: ServicioEmpresa[] = [
    {
      id: 'pista_led',
      nombre: 'Pista LED RGB',
      categoria: 'Pista y Luces',
      precioBase: 15000,
      calculationMethod: 'fijo',
      activo: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'pantalla_gigante',
      nombre: 'Pantalla Gigante P3',
      categoria: 'Audiovisual',
      precioBase: 25000,
      calculationMethod: 'fijo',
      activo: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'cotillon',
      nombre: 'Cotillón Luminoso',
      categoria: 'Animación',
      precioPorPersona: 150,
      calculationMethod: 'por_persona',
      activo: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  it('calcula el precio utilizando estrictamente calculateSimulatorPricing sin recalcular reglas de negocio', () => {
    const result = calculateSimulatorPricing({
      selectedServiceIds: ['pista_led', 'pantalla_gigante', 'cotillon'],
      servicios: serviciosMock,
      invitados: 100,
      fechaEvento: '2026-12-01',
      esClubUruguay: false,
    });

    // 15000 + 25000 + (150 * 100 = 15000) = 55000 subtotal
    expect(result.subtotalBruto).toBe(55000);
    expect(result.totalSinAjuste).toBe(55000);
    expect(result.precioPorPersona).toBe(550); // 55000 / 100
    expect(result.detallados).toHaveLength(3);
  });
});
