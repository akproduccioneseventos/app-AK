export const NOMBRE_DE_LA_EMPRESA = 'AK Producciones Eventos';

/**
 * El titulo de la portada es lo primero que lee la gente en Google, antes de
 * entrar. Un titulo como "Inicio" no dice ni que es un salon de fiestas ni que
 * esta en Salto: se desperdicia el renglon que decide el clic.
 *
 * Paso de verdad: el sitio estaba indexado como "Inicio - AK Producciones".
 * Por eso, si en Ajustes quedo cargada una palabra generica, se ignora y se usa
 * el nombre de la empresa.
 */
const TITULOS_QUE_NO_DICEN_NADA = [
  'inicio',
  'home',
  'index',
  'principal',
  'pagina principal',
  'página principal',
  'landing',
  'portada',
];

export function tituloQueSirve(titulo?: string | null): string {
  const limpio = (titulo || '').trim();
  if (!limpio) return NOMBRE_DE_LA_EMPRESA;

  const normalizado = limpio
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (TITULOS_QUE_NO_DICEN_NADA.includes(normalizado)) return NOMBRE_DE_LA_EMPRESA;

  return limpio;
}
