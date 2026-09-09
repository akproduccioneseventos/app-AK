/**
 * MATAFUEGO: lo interno del itinerario NO sale del servidor.
 *
 * El portal del cliente recibia **el programa entero**, incluidos los momentos que el
 * equipo marca como internos, y una de las dos pantallas los mostraba tal cual.
 * Aunque la pantalla los escondiera, ya estaban en el navegador del cliente: esconder
 * algo que ya se mando no es esconderlo.
 *
 * Y habia un segundo agujero: cuando un momento no tenia texto para el cliente, la
 * pantalla usaba **la nota interna** como reemplazo.
 *
 * Lo encontro Codex el 9 de septiembre de 2026. Se probo rompiendolo: devolviendo el
 * programa sin filtrar, las dos primeras comprobaciones se ponen en rojo.
 */
import { mapFiestaToClientPortal } from '@/lib/client-portal/public-fiesta';
import { toPublicSocialEvent } from '@/lib/social-fiesta/public-event';

const FIESTA = {
  id: 'fiesta-portal-1',
  configuracion: { nombreEvento: 'Quince de Camila' },
  programa: [
    {
      id: 'p1',
      hora: '21:00',
      titulo: 'Entrada de la quinceañera',
      descripcion: 'OJO: el padre llega tarde, estirar la espera',
      descripcionCliente: 'Tu entrada, con la canción que elegiste',
      visibleParaCliente: true,
      responsableNombre: 'Coordinador Juan',
    },
    {
      id: 'p2',
      hora: '23:30',
      titulo: 'Cambio de turno del personal',
      descripcion: 'Se van los dos mozos nuevos, quedan los de siempre',
      visibleParaCliente: false,
    },
    {
      id: 'p3',
      hora: '01:00',
      titulo: 'Torta',
      descripcion: 'Nota interna: la torta la trae el proveedor a las 00:30',
      // Sin marca de visibilidad: los itinerarios viejos no la tienen.
    },
  ],
} as any;

describe('El cliente no ve lo interno del itinerario', () => {
  const proyectada: any = mapFiestaToClientPortal(FIESTA);
  const programa: any[] = proyectada.programa;

  it('un momento marcado como interno NO se le manda al cliente', () => {
    expect(programa.map((p) => p.id)).not.toContain('p2');
  });

  it('las notas internas del equipo no salen del servidor', () => {
    const texto = JSON.stringify(programa);
    expect(texto).not.toContain('el padre llega tarde');
    expect(texto).not.toContain('Se van los dos mozos');
    expect(texto).not.toContain('la torta la trae el proveedor');
  });

  it('tampoco sale quien es el responsable interno de cada momento', () => {
    expect(JSON.stringify(programa)).not.toContain('Coordinador Juan');
  });

  it('lo que SI es para el cliente le llega completo', () => {
    const entrada = programa.find((p) => p.id === 'p1');
    expect(entrada.titulo).toBe('Entrada de la quinceañera');
    expect(entrada.hora).toBe('21:00');
    expect(entrada.descripcionCliente).toBe('Tu entrada, con la canción que elegiste');
  });

  it('un itinerario viejo, sin la marca de visibilidad, se sigue viendo', () => {
    // Si se ocultara lo que no dice nada, todos los clientes con fiesta ya armada
    // se quedarian con la pantalla vacia de un dia para el otro.
    expect(programa.map((p) => p.id)).toContain('p3');
  });
});

/**
 * Y EL MURO DE LA FIESTA, QUE ES PEOR: LO VE CUALQUIER INVITADO.
 *
 * El mismo defecto estaba en la pantalla que abre el invitado con el enlace. Se
 * encontro al pasar toda la app con la pregunta nueva -*que le manda el servidor al
 * navegador*- despues del defecto del portal del cliente.
 */
describe('El invitado tampoco ve lo interno del itinerario', () => {
  const publico: any = toPublicSocialEvent(FIESTA, false);

  it('los momentos internos no salen al muro de la fiesta', () => {
    expect((publico.programa || []).map((p: any) => p.id)).not.toContain('p2');
  });

  it('las notas internas tampoco', () => {
    const texto = JSON.stringify(publico.programa || []);
    expect(texto).not.toContain('el padre llega tarde');
    expect(texto).not.toContain('la torta la trae el proveedor');
  });

  it('lo que si es para el invitado le llega', () => {
    const entrada = (publico.programa || []).find((p: any) => p.id === 'p1');
    expect(entrada.titulo).toBe('Entrada de la quinceañera');
  });
});
