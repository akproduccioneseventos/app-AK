import { toPublicSocialEvent } from '@/lib/social-fiesta/public-event';

describe('public social event payload', () => {
  it('exposes only the fields required by the guest experience', () => {
    const source = {
      id: 'fiesta-publica',
      configuracion: {
        nombreEvento: 'XV de Ana',
        fechaEvento: '2026-08-08',
        clienteNombre: 'Dato privado',
        presupuestoEstimado: 900000,
      },
      socialGallerySettings: { enabled: true, title: 'Muro de Ana' },
      modulosContratados: { muroSocial: true },
      zonaDigitalAdolescentes: { enabled: true, features: [] },
      buzonConfig: { enabled: true },
      galeriaUrl: 'https://example.com/album',
      clientPortalSettings: { accessKey: 'clave-secreta' },
      presupuestoId: 'presupuesto-privado',
      invoiceIds: ['factura-privada'],
      pagosProveedores: [{ id: 'pago-privado', monto: 5000 }],
      personalAsignado: [{ empleadoId: 'empleado-privado' }],
      gestionCostos: { ingresosTotalesEstimados: 900000 },
    } as any;

    const result = toPublicSocialEvent(source, true);

    expect(result.clientAccessGranted).toBe(true);
    expect(result.configuracion).toEqual({ nombreEvento: 'XV de Ana', fechaEvento: '2026-08-08' });
    expect(result).not.toHaveProperty('clientPortalSettings');
    expect(result).not.toHaveProperty('presupuestoId');
    expect(result).not.toHaveProperty('invoiceIds');
    expect(result).not.toHaveProperty('pagosProveedores');
    expect(result).not.toHaveProperty('personalAsignado');
    expect(result).not.toHaveProperty('gestionCostos');
  });
});
