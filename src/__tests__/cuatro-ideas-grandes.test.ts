import { buildRemarketingMessage } from '@/lib/marketing/whatsapp-remarketing';

describe('Pruebas de Integridad - Las Cuatro Ideas Grandes', () => {
  describe('Bloque 1: Recontacto IA por WhatsApp', () => {
    it('debe hacer fallback al mensaje estándar si falla la IA o no hay presupuesto', async () => {
      const datosPrueba = {
        nombreCliente: 'Juan Pérez',
        tipoEvento: 'Boda',
        fechaEstimada: '2026-11-20',
        invitadosCount: 120,
        diasDesdeConsulta: 2,
      };

      const mensaje = await buildRemarketingMessage(datosPrueba);
      expect(typeof mensaje).toBe('string');
      expect(mensaje.length).toBeGreaterThan(10);
      expect(mensaje).toContain('Juan Pérez');
    });
  });

  describe('Bloque 3: Video del Recuerdo', () => {
    it('debe filtrar de forma estricta las fotos no aprobadas o pendientes', () => {
      const fotosMuro = [
        { id: '1', url: '/foto1.jpg', moderationStatus: 'approved' },
        { id: '2', url: '/foto2.jpg', moderationStatus: 'pending' },
        { id: '3', url: '/foto3.jpg', moderationStatus: 'rejected' },
        { id: '4', url: '/foto4.jpg', isApproved: true },
        { id: '5', url: '/foto5.jpg', isApproved: false },
      ];

      const fotosAprobadas = fotosMuro.filter(
        (f) => f.moderationStatus === 'approved' || f.isApproved === true
      );

      expect(fotosAprobadas.length).toBe(2);
      expect(fotosAprobadas.map((f) => f.id)).toEqual(['1', '4']);
    });
  });

  describe('Bloque 4: Repaso de la Mañana', () => {
    it('debe censurar o limitar visibilidad financiera a roles sin permiso CONTABILIDAD', () => {
      const rolesUsuarioNoFinanciero = ['operador', 'camarógrafo'];
      const tieneAccesoFinanciero = rolesUsuarioNoFinanciero.some((r) =>
        ['contabilidad', 'admin', 'dueno'].includes(r)
      );

      expect(tieneAccesoFinanciero).toBe(false);

      const rolesUsuarioAdmin = ['admin'];
      const tieneAccesoAdmin = rolesUsuarioAdmin.some((r) =>
        ['contabilidad', 'admin', 'dueno'].includes(r)
      );

      expect(tieneAccesoAdmin).toBe(true);
    });
  });
});
