export type FinalReleaseBlockId = 'accesos' | 'guardado' | 'cliente' | 'social' | 'lanzamiento';

export type FinalReleaseBlock = {
  id: FinalReleaseBlockId;
  order: number;
  title: string;
  plainGoal: string;
  route: string;
  doneMeans: string[];
};

export const FINAL_RELEASE_BLOCKS: FinalReleaseBlock[] = [
  {
    id: 'accesos',
    order: 1,
    title: 'Accesos y orden general',
    plainGoal: 'Que las pantallas nuevas no queden escondidas.',
    route: '/fiestas/nueva',
    doneMeans: [
      'El planificador muestra accesos rapidos Post #445.',
      'Social Fiesta, cliente y comercial quedan a un toque.',
      'Los enlaces conservan el evento abierto cuando existe fiestaId.',
    ],
  },
  {
    id: 'guardado',
    order: 2,
    title: 'Guardado definitivo',
    plainGoal: 'Que backup y restauracion cubran los modulos importantes.',
    route: '/configuracion/backup-final',
    doneMeans: [
      'El ZIP incluye datos y metadatos de cobertura.',
      'La restauracion ignora archivos internos del backup.',
      'Hay una pantalla simple para revisar que entra en el guardado.',
    ],
  },
  {
    id: 'cliente',
    order: 3,
    title: 'Modulo cliente completo',
    plainGoal: 'Que una persona con celular entienda su evento sin pedir ayuda.',
    route: '/fiestas/nueva/portal-cliente/cierre-final',
    doneMeans: [
      'Portada, organizacion, contable, invitados y contacto se revisan juntos.',
      'Cada area dice si esta lista o falta activar algo.',
      'Hay enlaces directos a configurar y ver como cliente.',
    ],
  },
  {
    id: 'social',
    order: 4,
    title: 'Fiesta en vivo y muro social',
    plainGoal: 'Que lo que ve la gente en la fiesta quede probado y controlado.',
    route: '/fiestas/nueva/social-fiesta-pro/cierre-final',
    doneMeans: [
      'Invitacion, QR, RSVP, muro, moderacion y pantalla se revisan juntos.',
      'AK sabe que probar antes de abrir la fiesta.',
      'El operador tiene claro que controla durante el evento.',
    ],
  },
  {
    id: 'lanzamiento',
    order: 5,
    title: 'Revision final de producto',
    plainGoal: 'Mirar la app completa como si fuera el dia de lanzamiento.',
    route: '/fiestas/nueva/cierre-100',
    doneMeans: [
      'Se ve el orden correcto de las 5 PR.',
      'Quedan claros los modulos listos y donde abrirlos.',
      'La app se revisa por uso real, no solo por codigo creado.',
    ],
  },
];

export function getFinalReleaseBlock(id: FinalReleaseBlockId): FinalReleaseBlock | undefined {
  return FINAL_RELEASE_BLOCKS.find((block) => block.id === id);
}
