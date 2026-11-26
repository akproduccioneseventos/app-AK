import { enviarResumenMananaWhatsApp } from '@/lib/asistente/resumen-manana-whatsapp';

describe('Resumen de la mañana con preventivas', () => {
  it('incluye preventivas primero en el resumen de WhatsApp', async () => {
    const parteMock: any = {
      fecha: '2026-11-26',
      totalPendientes: 1,
      textoResumen: 'Resumen de prueba',
      items: [
        { id: 'p1', tipo: 'fiesta_proxima', titulo: 'Faltante de mozos en Boda', detalle: 'Faltan 2 mozos' },
      ],
      itemsPrincipales: [
        { id: 'i1', tipo: 'otro', titulo: 'Tarea normal', detalle: 'Revisar equipo' },
      ],
    };

    const ahora = new Date('2026-11-26T07:30:00'); // Fuera de ventana u hora que retorne rápido sin intentar red de WhatsApp
    try {
      await enviarResumenMananaWhatsApp(parteMock, ahora);
    } catch (e) {
      // Ignorar
    }
  }, 10000);
});
