/**
 * Impresion del recuerdo en las estaciones de entretenimiento.
 *
 * Vive en un solo lugar a proposito. La fotocabina y el espejo magico imprimen
 * igual, y cuando cada pantalla se armaba su propia impresion terminaban
 * saliendo hojas distintas y el defecto se copiaba de una a otra.
 *
 * Se abre una ventana aparte con la hoja sola: si se imprimiera la pantalla del
 * kiosco saldrian los botones y el fondo negro encima de la foto.
 */

export interface ResultadoDeImpresion {
  ok: boolean;
  /** Mensaje ya escrito para mostrarle al invitado. Vacio si salio bien. */
  aviso?: string;
}

export type TamanoPapelImpresion = '10x15' | '5x15' | '13x18';
export type DisenoImpresion = 'una' | 'dos' | 'tira';

const TAMANOS_HOJA: Record<TamanoPapelImpresion, string> = {
  '10x15': '10cm 15cm',
  '5x15': '5cm 15cm',
  '13x18': '13cm 18cm',
};

export function imprimirRecuerdo(
  imagen: string,
  copias: number = 1,
  tamano: TamanoPapelImpresion = '10x15',
  disenoImpresion: DisenoImpresion = 'tira'
): ResultadoDeImpresion {
  if (!imagen) {
    return { ok: false, aviso: 'Todavía no hay un recuerdo para imprimir.' };
  }

  const cantidadCopias = Math.max(1, Math.min(10, copias));
  const hojaCss = TAMANOS_HOJA[tamano] || TAMANOS_HOJA['10x15'];

  try {
    const ventana = window.open('', '_blank', 'width=800,height=1100');
    if (!ventana) {
      return {
        ok: false,
        aviso: 'El navegador bloqueó la ventana de impresión. Avisá al operador.',
      };
    }

    const fotosContenido = disenoImpresion === 'una'
      ? `<div class="foto-una"><img src="${imagen}" alt="Recuerdo" /></div>`
      : disenoImpresion === 'dos'
      ? `<div class="foto-dos"><img src="${imagen}" alt="Recuerdo 1" /><img src="${imagen}" alt="Recuerdo 2" /></div>`
      : `<div class="foto-tira"><img src="${imagen}" alt="Recuerdo 1" /><img src="${imagen}" alt="Recuerdo 2" /><img src="${imagen}" alt="Recuerdo 3" /><img src="${imagen}" alt="Recuerdo 4" /></div>`;

    const paginasHtml = Array.from({ length: cantidadCopias })
      .map(() => `<div class="pagina" data-diseno="${disenoImpresion}">${fotosContenido}</div>`)
      .join('');

    ventana.document.write(
      `<html><head><title>Recuerdo</title><style>` +
        `@page{size:${hojaCss};margin:0}` +
        `html,body{margin:0;padding:0;background:#fff}` +
        `.pagina{width:100%;height:100vh;page-break-after:always;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:8px}` +
        `.foto-una{width:100%;height:100%;display:flex;align-items:center;justify-content:center}` +
        `.foto-una img{width:100%;height:100%;object-fit:contain;display:block}` +
        `.foto-dos{width:100%;height:100%;display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:space-around}` +
        `.foto-dos img{max-width:100%;max-height:48%;object-fit:contain;display:block}` +
        `.foto-tira{width:100%;height:100%;display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:space-between}` +
        `.foto-tira img{max-width:100%;max-height:23%;object-fit:contain;display:block}` +
        `</style></head><body>${paginasHtml}</body></html>`,
    );
    ventana.document.close();
    ventana.focus();

    // Hay que esperar a que la imagen termine de entrar. Sin esto sale una hoja
    // en blanco y el invitado se va sin nada.
    const mandarAImprimir = () => {
      ventana.print();
      setTimeout(() => ventana.close(), 500);
    };

    const img = ventana.document.querySelector('img');
    if (img && !img.complete) {
      img.onload = mandarAImprimir;
      img.onerror = mandarAImprimir;
    } else {
      mandarAImprimir();
    }

    return { ok: true };
  } catch {
    return { ok: false, aviso: 'No se pudo mandar a imprimir. Avisá al operador.' };
  }
}
