export interface TimelineTemplate {
  id: string;
  nombre: string;
  emoji: string;
  diasAntesDelEvento: number;
  descripcion: string;
}

export const bodaTemplate: TimelineTemplate[] = [
  { id: 'sena', nombre: 'Seña / Reserva del salón', emoji: '💰', diasAntesDelEvento: 365, descripcion: 'Pago de seña y firma de contrato con el salón' },
  { id: 'primera-reunion', nombre: 'Primera reunión de planificación', emoji: '🤝', diasAntesDelEvento: 330, descripcion: 'Reunión inicial con el equipo de AK para definir el estilo del evento' },
  { id: 'eleccion-menu', nombre: 'Elección del menú', emoji: '🍽️', diasAntesDelEvento: 270, descripcion: 'Degustación y definición del menú de la celebración' },
  { id: 'prueba-vestido', nombre: 'Prueba de vestido', emoji: '👗', diasAntesDelEvento: 180, descripcion: 'Primera prueba del vestido de novia' },
  { id: 'lista-invitados', nombre: 'Lista de invitados cerrada', emoji: '📋', diasAntesDelEvento: 120, descripcion: 'Envío de invitaciones y cierre de lista definitiva' },
  { id: 'cierre-pagos', nombre: 'Cierre de pagos', emoji: '💳', diasAntesDelEvento: 60, descripcion: 'Pago final y cierre de cuentas con todos los proveedores' },
  { id: 'entrega-musica', nombre: 'Entrega de lista musical', emoji: '🎵', diasAntesDelEvento: 30, descripcion: 'Entrega de las canciones favoritas al DJ' },
  { id: 'ensayo', nombre: 'Ensayo de ceremonia', emoji: '💍', diasAntesDelEvento: 7, descripcion: 'Ensayo general con todos los participantes' },
  { id: 'armado', nombre: 'Armado del salón', emoji: '🎪', diasAntesDelEvento: 1, descripcion: 'Decoración y preparación del salón' },
  { id: 'evento', nombre: '¡La gran celebración!', emoji: '🎊', diasAntesDelEvento: 0, descripcion: 'El día más especial de sus vidas' },
  { id: 'desmontaje', nombre: 'Desmontaje y entrega', emoji: '📦', diasAntesDelEvento: -1, descripcion: 'Retiro de la decoración y entrega del salón' },
];

export const xvAnosTemplate: TimelineTemplate[] = [
  { id: 'sena', nombre: 'Seña / Reserva del salón', emoji: '💰', diasAntesDelEvento: 365, descripcion: 'Pago de seña y firma de contrato' },
  { id: 'reunion-inicial', nombre: 'Reunión inicial', emoji: '🤝', diasAntesDelEvento: 330, descripcion: 'Primera reunión para definir el estilo y los detalles del evento' },
  { id: 'sesion-fotos', nombre: 'Sesión de fotos exteriores', emoji: '📸', diasAntesDelEvento: 180, descripcion: 'Sesión fotográfica previa al evento' },
  { id: 'eleccion-menu', nombre: 'Elección del menú', emoji: '🍽️', diasAntesDelEvento: 120, descripcion: 'Degustación y definición del menú' },
  { id: 'lista-invitados', nombre: 'Lista de invitados', emoji: '📋', diasAntesDelEvento: 90, descripcion: 'Cierre de la lista definitiva de invitados' },
  { id: 'cierre-pagos', nombre: 'Cierre de pagos', emoji: '💳', diasAntesDelEvento: 60, descripcion: 'Pago final a todos los proveedores' },
  { id: 'ensayo-vals', nombre: 'Ensayo del vals', emoji: '💃', diasAntesDelEvento: 14, descripcion: 'Ensayo final del vals de la quinceañera' },
  { id: 'armado', nombre: 'Armado del salón', emoji: '🎪', diasAntesDelEvento: 1, descripcion: 'Decoración y preparación del salón' },
  { id: 'evento', nombre: '¡La gran noche!', emoji: '👑', diasAntesDelEvento: 0, descripcion: 'La celebración de los quince años' },
  { id: 'desmontaje', nombre: 'Desmontaje y entrega', emoji: '📦', diasAntesDelEvento: -1, descripcion: 'Retiro de la decoración y entrega del salón' },
];

export const fiestaGeneralTemplate: TimelineTemplate[] = [
  { id: 'sena', nombre: 'Seña / Reserva del salón', emoji: '💰', diasAntesDelEvento: 180, descripcion: 'Pago de seña y firma de contrato' },
  { id: 'reunion', nombre: 'Reunión de planificación', emoji: '🤝', diasAntesDelEvento: 150, descripcion: 'Reunión para definir los detalles del evento' },
  { id: 'definir-servicios', nombre: 'Definición de servicios', emoji: '📋', diasAntesDelEvento: 120, descripcion: 'Confirmación de todos los servicios contratados' },
  { id: 'lista-invitados', nombre: 'Lista de invitados', emoji: '👥', diasAntesDelEvento: 60, descripcion: 'Cierre de la lista definitiva de invitados' },
  { id: 'cierre-pagos', nombre: 'Cierre de pagos', emoji: '💳', diasAntesDelEvento: 30, descripcion: 'Pago final a todos los proveedores' },
  { id: 'armado', nombre: 'Armado del salón', emoji: '🎪', diasAntesDelEvento: 1, descripcion: 'Decoración y preparación del salón' },
  { id: 'evento', nombre: '¡La celebración!', emoji: '🎉', diasAntesDelEvento: 0, descripcion: 'El gran día de la celebración' },
  { id: 'desmontaje', nombre: 'Desmontaje y entrega', emoji: '📦', diasAntesDelEvento: -1, descripcion: 'Retiro de la decoración y entrega del salón' },
];

export function getTemplateForTipoEvento(tipoEvento: string): TimelineTemplate[] {
  const tipo = tipoEvento?.toLowerCase() ?? '';
  if (tipo.includes('boda') || tipo.includes('casamiento')) return bodaTemplate;
  if (tipo.includes('quince') || tipo.includes('xv') || tipo.includes('quincea')) return xvAnosTemplate;
  return fiestaGeneralTemplate;
}
