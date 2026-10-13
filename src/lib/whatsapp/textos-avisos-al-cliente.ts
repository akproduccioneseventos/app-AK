import { rellenarPlantilla } from '@/lib/whatsapp/plantilla-mensaje';

// Textos puros de los avisos al cliente. Viven aparte porque la pantalla de alertas (cliente) los
// usa, y `avisos-al-cliente.ts` arrastra codigo de servidor (`server-only`): importarlo desde una
// pantalla rompe la compilacion.
export const PLANTILLAS_AVISOS_CLIENTE: Record<string, string> = {
  'faltan-canciones':
    '¡Hola {{NOMBRE}}! ¿Cómo estás? Te escribimos de AK Producciones. Cuando tengas un tiempito pasanos la lista de canciones o los temas especiales para la fiesta, así el DJ va preparando todo.',
  'faltan-fotos-video-vida':
    '¡Hola {{NOMBRE}}! ¿Todo bien? Te mandamos este mensajito para recordarte las fotos del video de vida. Si nos las pasás estos días ya lo vamos editando con tiempo.',
  'menu-sin-definir':
    '¡Hola {{NOMBRE}}! ¿Cómo andás? Te escribimos de AK Producciones para coordinar la elección del menú de la fiesta. Avisanos cuando puedas y lo dejamos definido.',
  'invitados-sin-confirmar':
    '¡Hola {{NOMBRE}}! ¿Cómo van los preparativos? Te recordamos revisar las confirmaciones de los invitados para ir cerrando la cantidad con el catering y el salón.',
};

export function armarTextoAviso(reglaId: string, nombreCliente: string): string {
  const plantilla =
    PLANTILLAS_AVISOS_CLIENTE[reglaId] ||
    '¡Hola {{NOMBRE}}! Te escribimos de AK Producciones para coordinar detalles de tu fiesta.';
  return rellenarPlantilla(plantilla, { NOMBRE: nombreCliente });
}
