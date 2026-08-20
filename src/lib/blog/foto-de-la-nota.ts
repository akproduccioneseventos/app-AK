/**
 * La foto de cada nota del blog: siempre una foto real de una fiesta de AK.
 *
 * **Por que no se generan con inteligencia artificial.** El generador de notas
 * pedia una imagen inventada y solo caia al catalogo si fallaba. Tres motivos
 * para darlo vuelta:
 *
 * 1. **Vende mas una foto real.** El que entra a leer "cuanto sale la bebida de
 *    una fiesta" y ve la barra de tragos de verdad, montada en Salto, ya vio el
 *    producto. Una imagen inventada no muestra nada que se pueda contratar.
 * 2. **A Google le sirve mas.** Una foto propia y unica pesa; una imagen generada
 *    no aporta nada que no aporte el texto, y ninguna se puede reutilizar en la
 *    ficha de Google ni en las redes.
 * 3. **No cuesta un peso.** Generar una imagen por nota era la parte cara de la
 *    nota entera.
 *
 * Las fotos salen del catalogo de servicios, que son trabajos de la empresa.
 *
 * **El texto alternativo importa tanto como la foto:** es lo que lee Google y lo
 * que escucha alguien que no puede ver la pantalla. Describe lo que se ve y donde,
 * en una frase natural. No se amontonan palabras clave: eso hoy penaliza.
 */

export interface FotoDeLaNota {
  url: string;
  alt: string;
}

interface Familia {
  /** Palabras que, si aparecen en el tema, eligen esta familia de fotos. */
  pistas: string[];
  fotos: string[];
  /** Como se describe la foto. Se completa con la ciudad. */
  descripcion: string;
}

const BASE = '/media/catalogo-servicios';

const FAMILIAS: Familia[] = [
  {
    pistas: ['trago', 'barra', 'bebida', 'coctel', 'alcohol', 'brindis'],
    fotos: [
      `${BASE}/barra-tragos-ak-01.jpeg`,
      `${BASE}/barra_tragos_img_289_p34_x1805.jpeg`,
      `${BASE}/barra_tragos_img_339_p41_x4281.jpeg`,
    ],
    descripcion: 'Barra de tragos montada por AK Producciones en una fiesta en Salto',
  },
  {
    pistas: ['catering', 'comida', 'plato', 'menu', 'finger', 'isla', 'gastro', 'cena'],
    fotos: [
      `${BASE}/catering-mesa-ak-01.jpeg`,
      `${BASE}/catering_img_074_p09_x1198.jpeg`,
      `${BASE}/catering_img_202_p19_x1580.jpeg`,
    ],
    descripcion: 'Mesa servida por el catering de AK Producciones en una fiesta en Salto',
  },
  {
    pistas: ['candy', 'dulce', 'torta', 'postre', 'reposteria'],
    fotos: [
      `${BASE}/candy-bar-xv-01.jpeg`,
      `${BASE}/candy-bar-completo-ak-02.jpeg`,
      `${BASE}/candy-bar-xv-luces-04.jpeg`,
    ],
    descripcion: 'Mesa dulce armada por AK Producciones para una fiesta de 15 en Salto',
  },
  {
    pistas: ['decoracion', 'ambientacion', 'mesa', 'centro', 'flores'],
    fotos: [
      `${BASE}/decoracion-boda-mesa-01.jpeg`,
      `${BASE}/boda-decoracion-dorada-01.jpeg`,
    ],
    descripcion: 'Ambientacion y decoracion de mesas de AK Producciones en un salon de Salto',
  },
  {
    pistas: ['luz', 'luces', 'pantalla', 'led', 'robotizada', 'disco', 'pista', 'baile', 'neon', 'tecnolog'],
    fotos: [`${BASE}/blog_iluminacion.png`],
    descripcion: 'Pista de baile con luces y pantallas de AK Producciones en Salto',
  },
  {
    pistas: ['foto', 'cabina', 'fotocabina', 'espejo', '360', 'recuerdo'],
    fotos: [`${BASE}/blog_salon.png`],
    descripcion: 'Invitados en la fotocabina de AK Producciones durante una fiesta en Salto',
  },
  {
    pistas: ['presupuesto', 'calcular', 'costo', 'plata', 'precio'],
    fotos: [`${BASE}/blog_presupuesto.png`],
    descripcion: 'Reunion para armar el presupuesto de una fiesta con AK Producciones en Salto',
  },
  {
    pistas: ['organizar', 'planific', 'checklist', 'semana', 'coordinar', 'equipo', 'estres'],
    fotos: [`${BASE}/organizador_equipo.png`],
    descripcion: 'Equipo de AK Producciones coordinando el armado de una fiesta en Salto',
  },
  {
    pistas: ['boda', 'casamiento', 'novia', 'novio'],
    fotos: [`${BASE}/boda_persuasiva.png`],
    descripcion: 'Casamiento producido por AK Producciones en Salto',
  },
  {
    pistas: ['15', 'quince', 'xv', 'adolescente'],
    fotos: [`${BASE}/quinceanera_persuasiva.png`],
    descripcion: 'Fiesta de 15 producida por AK Producciones en Salto',
  },
  {
    pistas: ['salon', 'lugar', 'espacio', 'acustica', 'capacidad'],
    fotos: [`${BASE}/blog_salon.png`],
    descripcion: 'Salon montado por AK Producciones para una fiesta en Salto',
  },
];

const POR_DEFECTO: Familia = {
  pistas: [],
  fotos: [`${BASE}/quinceanera_hero.png`],
  descripcion: 'Fiesta producida por AK Producciones en Salto',
};

function sinAcentos(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Reparte las fotos de una misma familia entre las notas, para que dos notas
 * seguidas del mismo tema no salgan con la misma imagen. La cuenta sale del
 * nombre de la nota, asi que la misma nota siempre muestra la misma foto.
 */
function elegirDeLaFamilia(familia: Familia, semilla: string): string {
  if (familia.fotos.length === 1) return familia.fotos[0];

  let suma = 0;
  for (const caracter of semilla) suma += caracter.charCodeAt(0);
  return familia.fotos[suma % familia.fotos.length];
}

export function fotoDeLaNota(input: {
  slug: string;
  title?: string;
  category?: string;
}): FotoDeLaNota {
  const texto = sinAcentos(`${input.slug} ${input.title || ''} ${input.category || ''}`);
  const familia = FAMILIAS.find((item) => item.pistas.some((pista) => texto.includes(pista))) || POR_DEFECTO;

  return {
    url: elegirDeLaFamilia(familia, input.slug),
    alt: familia.descripcion,
  };
}
