/**
 * MATAFUEGO: lo interno del itinerario y datos privados NO salen del servidor
 * hacia las pantallas públicas del invitado.
 *
 * El portal público del invitado (`buildPublicGuestEvent`) recibía las notas
 * internas del equipo como reemplazo cuando no había descripción escrita para el
 * cliente. Además, se verifica que presupuestos, costos, personal asignado y
 * datos sensibles no se expongan a quien adivine el enlace público.
 *
 * Orden 64 - Bloque 3.
 */
import { buildPublicGuestEvent } from '@/lib/guest-portal-public-data';
import { toPublicSocialEvent } from '@/lib/social-fiesta/public-event';

const FIESTA = {
  id: 'fiesta-publica-1',
  configuracion: {
    nombreEvento: 'Quince de Camila',
    nombreAgasajado: 'Camila',
    fechaEvento: '2026-10-15',
    horaInicio: '21:00',
    nombreLugar: 'Salón Salto Grande',
    clienteNombre: 'Cliente Privado',
    clienteContacto: '099111222',
    presupuestoEstimado: 500000,
  },
  presupuestoId: 'presupuesto-secreto-1',
  personalAsignado: [{ empleadoId: 'emp-1', rolId: 'coordinador' }],
  gestionCostos: { ingresosTotalesEstimados: 500000 },
  programa: [
    {
      id: 'p1',
      hora: '21:00',
      titulo: 'Entrada de la quinceañera',
      descripcion: 'OJO: el padre llega tarde, estirar la espera',
      descripcionCliente: 'Tu entrada triunfal',
      visibleParaCliente: true,
      responsableNombre: 'Coordinador Juan',
    },
    {
      id: 'p2',
      hora: '23:30',
      titulo: 'Cambio de turno del personal',
      descripcion: 'Se van los dos mozos nuevos',
      visibleParaCliente: false,
    },
    {
      id: 'p3',
      hora: '01:00',
      titulo: 'Torta',
      descripcion: 'Nota interna: la torta la trae el proveedor a las 00:30',
      // Sin descripción de cliente: no debe colarse la descripción interna
    },
  ],
} as any;

describe('El invitado no ve lo interno en pantallas públicas', () => {
  const publicEvent = buildPublicGuestEvent(FIESTA);

  it('un momento marcado como interno NO se le manda al invitado', () => {
    expect(publicEvent.programa.map((p) => p.id)).not.toContain('p2');
  });

  it('las notas internas del equipo no salen del servidor hacia el invitado', () => {
    const texto = JSON.stringify(publicEvent.programa);
    expect(texto).not.toContain('el padre llega tarde');
    expect(texto).not.toContain('Se van los dos mozos');
    expect(texto).not.toContain('la torta la trae el proveedor');
  });

  it('tampoco sale quien es el responsable interno de cada momento', () => {
    expect(JSON.stringify(publicEvent.programa)).not.toContain('Coordinador Juan');
  });

  it('la descripción del cliente sí llega completa', () => {
    const entrada = publicEvent.programa.find((p) => p.id === 'p1');
    expect(entrada?.titulo).toBe('Entrada de la quinceañera');
    expect(entrada?.descripcion).toBe('Tu entrada triunfal');
  });

  it('no expone presupuestoId, costos ni personal en el evento público', () => {
    expect(publicEvent).not.toHaveProperty('presupuestoId');
    expect(publicEvent).not.toHaveProperty('personalAsignado');
    expect(publicEvent).not.toHaveProperty('gestionCostos');
    expect(publicEvent.configuracion).not.toHaveProperty('clienteContacto');
    expect(publicEvent.configuracion).not.toHaveProperty('presupuestoEstimado');
  });
});
