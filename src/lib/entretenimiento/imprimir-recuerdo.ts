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

/** 10x15 cm, la hoja de foto comun. */
const HOJA = '10cm 15cm';

export function imprimirRecuerdo(imagen: string): ResultadoDeImpresion {
  if (!imagen) {
    return { ok: false, aviso: 'Todavía no hay un recuerdo para imprimir.' };
  }

  try {
    const ventana = window.open('', '_blank', 'width=800,height=1100');
    if (!ventana) {
      return {
        ok: false,
        aviso: 'El navegador bloqueó la ventana de impresión. Avisá al operador.',
      };
    }

    ventana.document.write(
      `<html><head><title>Recuerdo</title><style>` +
        `@page{size:${HOJA};margin:0}` +
        `html,body{margin:0;padding:0;background:#fff}` +
        `img{width:100%;height:100%;object-fit:contain;display:block}` +
        `</style></head><body><img src="${imagen}" alt="Recuerdo" /></body></html>`,
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
