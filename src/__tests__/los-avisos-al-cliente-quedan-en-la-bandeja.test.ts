import { procesarAvisosAlClienteParaFiesta } from '@/lib/whatsapp/avisos-al-cliente';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Bloque 1 - Los avisos al cliente quedan en la bandeja', () => {
  it('una fiesta sin canciones a diez días genera un mensaje en la bandeja con el teléfono del cliente', async () => {
    const fechaEvento = new Date();
    fechaEvento.setDate(fechaEvento.getDate() + 10);

    const fiesta: FiestaEnPlanificacion = {
      id: 'fiesta-test-sin-canciones',
      configuracion: {
        nombreEvento: '15 de Sofía',
        clienteNombre: 'Sofía',
        fechaEvento: fechaEvento.toISOString().split('T')[0],
        telefonoAsistencia: '59899123456',
      },
      musica: {}, // sin canciones
      videoVida: { photosUploaded: true, galleryEnabled: true },
      personalAsignado: [],
    };

    const mensajesGuardados: any[] = [];
    const mockGuardar = jest.fn().mockImplementation((msg: any) => {
      mensajesGuardados.push(msg);
      return Promise.resolve({ success: true, message: { id: 'msg-1', ...msg } });
    });

    const { resultados, fiestaModificada } = await procesarAvisosAlClienteParaFiesta(fiesta, mockGuardar as any);

    expect(fiestaModificada).toBe(true);
    expect(mensajesGuardados).toHaveLength(1);
    expect(mensajesGuardados[0].targetPhone).toBe('59899123456');
    expect(mensajesGuardados[0].targetName).toBe('Sofía');
    expect(mensajesGuardados[0].sendingMode).toBe('manual_click');
    expect(mensajesGuardados[0].messageText).toContain('canciones');
    expect(resultados.find((r) => r.reglaId === 'faltan-canciones')?.enviado).toBe(true);
  });

  it('correr la tarea dos veces no genera dos mensajes', async () => {
    const fechaEvento = new Date();
    fechaEvento.setDate(fechaEvento.getDate() + 10);

    const fiesta: FiestaEnPlanificacion = {
      id: 'fiesta-test-dos-veces',
      configuracion: {
        nombreEvento: 'Boda Carlos y Ana',
        clienteNombre: 'Carlos',
        fechaEvento: fechaEvento.toISOString().split('T')[0],
        telefonoAsistencia: '59898765432',
      },
      musica: {},
      videoVida: { photosUploaded: true, galleryEnabled: true },
      personalAsignado: [],
    };

    const mensajesGuardados: any[] = [];
    const mockGuardar = jest.fn().mockImplementation((msg: any) => {
      mensajesGuardados.push(msg);
      return Promise.resolve({ success: true, message: { id: `msg-${mensajesGuardados.length}`, ...msg } });
    });

    // Primera corrida
    const corrida1 = await procesarAvisosAlClienteParaFiesta(fiesta, mockGuardar as any);
    expect(corrida1.fiestaModificada).toBe(true);
    expect(mensajesGuardados).toHaveLength(1);

    // Segunda corrida sobre la misma fiesta ya actualizada con avisosPreparados
    const corrida2 = await procesarAvisosAlClienteParaFiesta(fiesta, mockGuardar as any);
    expect(corrida2.fiestaModificada).toBe(false);
    expect(mensajesGuardados).toHaveLength(1); // no se agregó otro
    expect(corrida2.resultados.find((r) => r.reglaId === 'faltan-canciones')?.enviado).toBe(false);
  });

  it('sin teléfono no genera nada', async () => {
    const fechaEvento = new Date();
    fechaEvento.setDate(fechaEvento.getDate() + 10);

    const fiesta: FiestaEnPlanificacion = {
      id: 'fiesta-test-sin-telefono',
      configuracion: {
        nombreEvento: 'Cumpleaños Sin Celular',
        clienteNombre: 'Martín',
        fechaEvento: fechaEvento.toISOString().split('T')[0],
        // Sin telefonoAsistencia
      },
      musica: {},
      personalAsignado: [],
    };

    const mensajesGuardados: any[] = [];
    const mockGuardar = jest.fn().mockImplementation((msg: any) => {
      mensajesGuardados.push(msg);
      return Promise.resolve({ success: true, message: { id: 'msg-1', ...msg } });
    });

    const { resultados, fiestaModificada } = await procesarAvisosAlClienteParaFiesta(fiesta, mockGuardar as any);

    expect(fiestaModificada).toBe(false);
    expect(mensajesGuardados).toHaveLength(0);
    const resultadoRegla = resultados.find((r) => r.reglaId === 'faltan-canciones');
    expect(resultadoRegla?.enviado).toBe(false);
    expect(resultadoRegla?.motivo).toContain('Esta fiesta no tiene teléfono del cliente');
  });
});
