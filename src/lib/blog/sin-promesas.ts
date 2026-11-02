import { applyAutomaticStaffByGuests } from '@/lib/commercial/live-budget-editor';
import type { BlogPost } from '@/types/blog';

const REGEX_PROMESAS = /garant|congel|cuotas fijas|24\/7|cero fallas|segur[oa]s? para interiores|te aseguramos|la mayor[ií]a de (?:los )?clientes|opci[oó]n preferida|sin riesgos|base exacta|precio exacto|cálculo exacto|\bexact[oa]s?\b/i;

/**
 * Devuelve la coincidencia encontrada si el texto tiene promesas no verificables,
 * o null si está limpio.
 */
export function textoQuePromete(texto: string): string | null {
  if (!texto || typeof texto !== 'string') return null;
  const match = texto.match(REGEX_PROMESAS);
  return match ? match[0] : null;
}

/**
 * Obtiene la cantidad de invitados por personal desde la lógica de presupuesto.
 */
export function getGuestsPerStaff(): number {
  try {
    for (let g = 1; g <= 100; g++) {
      const res = applyAutomaticStaffByGuests({ guestCount: g, items: [] } as any);
      const mozo = res.items.find((i) => i.id === 'auto_mozo');
      if (mozo && mozo.quantity > 1) {
        return g - 1;
      }
    }
    return 25;
  } catch {
    return 25;
  }
}

/**
 * Datos oficiales de AK Producciones para que el generador del blog no invente.
 */
export function getDatosDeAkParaElBlog(): string {
  const guests = getGuestsPerStaff();
  return `El personal se calcula por invitados: un mozo de cocina y un mozo de atención cada ${guests} invitados. Las islas y la comida de pie pueden usar menos vajilla que el servicio a la mesa. AK trabaja en Salto, Uruguay, hace 7 años y lleva más de 200 fiestas. El precio lleva el ajuste anual.`;
}

export let DATOS_DE_AK_PARA_EL_BLOG: string = getDatosDeAkParaElBlog();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = new Proxy(module.exports, {
    get(target, prop, receiver) {
      if (prop === 'DATOS_DE_AK_PARA_EL_BLOG') {
        return getDatosDeAkParaElBlog();
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

function limpiarTextoDeOracionesQuePrometen(texto: string): string {
  if (!texto || !textoQuePromete(texto)) return texto;
  // Cortar por '. ' para aislar oraciones
  const oraciones = texto.split(/(?<=\.)\s+/);
  const limpias = oraciones.filter((o) => !textoQuePromete(o));
  return limpias.join(' ').trim();
}

/**
 * Corrige artículos del blog eliminando y reemplazando promesas no deseadas.
 */
export function corregirPromesasDelBlog(posts: BlogPost[]): BlogPost[] {
  if (!Array.isArray(posts)) return [];

  return posts.map((postOriginal) => {
    // Clon profundo para no mutar el objeto en memoria
    const post: BlogPost = JSON.parse(JSON.stringify(postOriginal));

    // 1. Reemplazos específicos por slug
    if (post.slug === 'tecnologias-iluminacion-pantallas-quince') {
      const antes = 'Asegurar chispas frías homologadas y seguras para interiores.';
      const despues = 'Consultar con el salón si permite chispas frías y usar sólo equipos con ficha técnica del proveedor.';
      if (post.checklist) {
        post.checklist = post.checklist.map((item) => item.replace(antes, despues));
      }
      post.sections = post.sections.map((sec) => ({
        ...sec,
        body: sec.body.map((b) => b.replace(antes, despues)),
      }));
    }

    if (post.slug === 'catering-tradicional-vs-islas-quinceanos') {
      const antes1 = /Es la opción preferida para las quinceañeras en Salto porque/gi;
      const despues1 = 'Es una opción que eligen muchas quinceañeras porque';
      const antes2 = /la mayoría de los clientes de AK Producciones eligen la propuesta mixta/gi;
      const despues2 = 'una opción que funciona muy bien es la propuesta mixta';

      post.takeaway = (post.takeaway || '')
        .replace(antes1, despues1)
        .replace(antes2, despues2);

      post.sections = post.sections.map((sec) => ({
        ...sec,
        body: sec.body.map((b) => b.replace(antes1, despues1).replace(antes2, despues2)),
      }));
    }

    if (post.slug === 'como-calcular-bebida-evento-salto') {
      const reemplazarPromesasBebida = (texto: string) => {
        if (!texto) return texto;
        return texto
          .replace(/cálculo exacto/gi, 'cálculo estimado')
          .replace(/calculo exacto/gi, 'cálculo estimado')
          .replace(/\bexacto\b/gi, 'estimado')
          .replace(/\bexacta\b/gi, 'estimada')
          .replace(/La gente consume el doble de agua y refrescos/gi, 'con calor conviene tener más agua y refrescos disponibles')
          .replace(/el doble de agua y refrescos/gi, 'con calor conviene tener más agua y refrescos disponibles')
          .replace(/calcular de 3 a 4 tragos promedio por adulto/gi, 'estimar una compra de 3 a 4 tragos para adultos mayores de 18')
          .replace(/Estimar 3 a 4 tragos con alcohol por adulto promedio/gi, 'Estimación de compra de 3 a 4 tragos con alcohol para adultos mayores de 18')
          .replace(/3 a 4 tragos promedio por adulto/gi, '3 a 4 tragos como estimación de compra para adultos mayores de 18')
          .replace(/por adulto promedio/gi, 'para adultos mayores de 18');
      };

      if (post.title) post.title = reemplazarPromesasBebida(post.title);
      if (post.excerpt) post.excerpt = reemplazarPromesasBebida(post.excerpt);
      if (post.takeaway) post.takeaway = reemplazarPromesasBebida(post.takeaway);
      if (post.checklist) post.checklist = post.checklist.map(reemplazarPromesasBebida);

      const antesBebida = /Si contratás una barra tecnológica de AK Producciones, el cálculo del stock ya está cubierto, pero si/gi;
      const despuesBebida = 'Si contratás la barra de AK Producciones, el cálculo lo hacemos con vos; si';

      const aclaracionResponsable = 'Es una estimación para calcular la compra, no una recomendación de consumo. En fiestas de 15, los menores van con barra sin alcohol; siempre agua disponible y servicio responsable.';

      post.sections = post.sections.map((sec) => {
        let body = sec.body.map((b) => reemplazarPromesasBebida(b.replace(antesBebida, despuesBebida)));
        if (sec.heading.toLowerCase().includes('barra')) {
          if (!body.some((p) => p.includes(aclaracionResponsable))) {
            body.push(aclaracionResponsable);
          }
        }
        return {
          ...sec,
          body,
        };
      });

      if (post.takeaway && /^El promedio ideal es 1\.5 litros/i.test(post.takeaway.trim())) {
        post.takeaway = 'Como referencia orientativa, ' + post.takeaway.charAt(0).toLowerCase() + post.takeaway.slice(1);
      } else if (post.takeaway && post.takeaway.includes('El promedio ideal es 1.5 litros') && !post.takeaway.includes('Como referencia orientativa')) {
        post.takeaway = post.takeaway.replace('El promedio ideal es 1.5 litros', 'Como referencia orientativa, el promedio ideal es 1.5 litros');
      }
    }

    // 2. Limpieza general de oraciones o renglones restantes que aún prometan
    if (post.takeaway && textoQuePromete(post.takeaway)) {
      post.takeaway = limpiarTextoDeOracionesQuePrometen(post.takeaway);
    }

    if (post.excerpt && textoQuePromete(post.excerpt)) {
      post.excerpt = limpiarTextoDeOracionesQuePrometen(post.excerpt);
    }

    if (post.checklist) {
      post.checklist = post.checklist.filter((item) => !textoQuePromete(item));
    }

    post.sections = post.sections.map((sec) => {
      const nuevoBody = sec.body
        .map((parrafo) => limpiarTextoDeOracionesQuePrometen(parrafo))
        .filter((parrafo) => parrafo.length > 0);
      return {
        ...sec,
        body: nuevoBody,
      };
    });

    return post;
  });
}
