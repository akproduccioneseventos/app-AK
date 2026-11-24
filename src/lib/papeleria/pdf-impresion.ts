import { jsPDF } from 'jspdf';

type FormatoImagenPdf = 'PNG' | 'JPEG' | 'WEBP';

const A4_ANCHO_MM = 210;
const A4_ALTO_MM = 297;

const CUADRITO_ANCHO_MM = 100;
const CUADRITO_ALTO_MM = 150;
const CUADRITO_Y_MM = 10;
const CUADRITO_IZQ_X_MM = 4;
const CUADRITO_DER_X_MM = 106;

const TORRE_ANCHO_MM = 105;
const TORRE_SOLAPA_FIN_MM = 30;
const TORRE_BLANCO_FIN_MM = 117;
const TORRE_CARA_SUP_FIN_MM = 207;
const TORRE_CARA_ALTO_MM = 90;

function detectarFormatoImagen(imagenDataUrl: string): FormatoImagenPdf {
  const encabezado = imagenDataUrl.slice(0, 64).toLowerCase();
  if (encabezado.startsWith('data:image/jpeg') || encabezado.startsWith('data:image/jpg')) {
    return 'JPEG';
  }
  if (encabezado.startsWith('data:image/webp')) {
    return 'WEBP';
  }
  return 'PNG';
}

function dibujarMarcasCorteCuadrito(pdf: jsPDF, x: number, y: number, ancho: number, alto: number): void {
  const largoMarca = 4;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);

  // Esquina superior izquierda
  pdf.line(x - largoMarca, y, x, y);
  pdf.line(x, y - largoMarca, x, y);
  // Esquina superior derecha
  pdf.line(x + ancho, y, x + ancho + largoMarca, y);
  pdf.line(x + ancho, y - largoMarca, x + ancho, y);
  // Esquina inferior izquierda
  pdf.line(x - largoMarca, y + alto, x, y + alto);
  pdf.line(x, y + alto, x, y + alto + largoMarca);
  // Esquina inferior derecha
  pdf.line(x + ancho, y + alto, x + ancho + largoMarca, y + alto);
  pdf.line(x + ancho, y + alto, x + ancho, y + alto + largoMarca);
}

/**
 * Arma una hoja A4 vertical con dos piezas verticales de 100 x 150 mm arriba
 * (x=4 y x=106, y=10) con borde negro para recortar.
 */
export function generarPdfCuadritos10x15(
  imagenDataUrl: string,
  opciones?: { imagenSegundaDataUrl?: string; bordeNegroMm?: number }
): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const bordeNegroMm = opciones?.bordeNegroMm ?? 3;
  const primeraImg = imagenDataUrl;
  const segundaImg = opciones?.imagenSegundaDataUrl || imagenDataUrl;

  const piezas: Array<{ x: number; img: string }> = [
    { x: CUADRITO_IZQ_X_MM, img: primeraImg },
    { x: CUADRITO_DER_X_MM, img: segundaImg },
  ];

  for (const pieza of piezas) {
    const formato = detectarFormatoImagen(pieza.img);
    pdf.addImage(
      pieza.img,
      formato,
      pieza.x,
      CUADRITO_Y_MM,
      CUADRITO_ANCHO_MM,
      CUADRITO_ALTO_MM
    );

    if (bordeNegroMm > 0) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(bordeNegroMm);
      pdf.rect(pieza.x, CUADRITO_Y_MM, CUADRITO_ANCHO_MM, CUADRITO_ALTO_MM, 'S');
    }

    dibujarMarcasCorteCuadrito(
      pdf,
      pieza.x,
      CUADRITO_Y_MM,
      CUADRITO_ANCHO_MM,
      CUADRITO_ALTO_MM
    );
  }

  return pdf;
}

/**
 * Arma una hoja A4 vertical completa (210 x 297 mm) para cronograma o afiche.
 */
export function generarPdfA4Entero(imagenDataUrl: string): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const formato = detectarFormatoImagen(imagenDataUrl);
  pdf.addImage(imagenDataUrl, formato, 0, 0, A4_ANCHO_MM, A4_ALTO_MM);

  return pdf;
}

function dibujarTextosCaraMesa(
  pdf: jsPDF,
  params: {
    xCentro: number;
    mesaNumero: number | string;
    subtitulo?: string;
    nombreAgasajado?: string;
    fechaCorta?: string;
    invertido: boolean;
  }
): void {
  const { xCentro, mesaNumero, subtitulo, nombreAgasajado, fechaCorta, invertido } = params;
  const tituloMesa = `Mesa ${mesaNumero}`;
  const angle = invertido ? 180 : 0;

  // Coordenadas dentro de [117..207] si es invertido, o [207..297] si es normal.
  const yMesa = invertido ? 168 : 246;
  const yNombre = invertido ? 152 : 260;
  const yFecha = invertido ? 142 : 269;
  const ySubtitulo = invertido ? 133 : 278;

  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text(tituloMesa, xCentro, yMesa, { align: 'center', angle });

  if (nombreAgasajado) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(nombreAgasajado.toUpperCase(), xCentro, yNombre, { align: 'center', angle });
  }

  if (fechaCorta) {
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(11);
    pdf.text(fechaCorta, xCentro, yFecha, { align: 'center', angle });
  }

  if (subtitulo) {
    pdf.setTextColor(51, 65, 85);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(subtitulo.toUpperCase(), xCentro, ySubtitulo, { align: 'center', angle });
  }
}

/**
 * Arma un PDF A4 multipagina con todas las torres de mesa (2 torres por hoja).
 * Cada columna de 105 mm replica las proporciones exactas de numeros-mesa.tsx:
 * 0..30 mm solapa blanca, 30..117 mm cara blanca, 117..207 mm cara superior 180°,
 * 207..297 mm cara inferior normal.
 */
export function generarPdfTorresMesasA4(params: {
  mesas: Array<{ numero: number | string; subtitulo?: string }>;
  nombreAgasajado?: string;
  fechaCorta?: string;
  fondoDataUrl?: string;
}): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { mesas, nombreAgasajado, fechaCorta, fondoDataUrl } = params;
  const formatoFondo = fondoDataUrl ? detectarFormatoImagen(fondoDataUrl) : null;
  const totalPaginas = Math.max(1, Math.ceil(mesas.length / 2));

  for (let pagina = 0; pagina < totalPaginas; pagina++) {
    if (pagina > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const parMesas = [mesas[pagina * 2], mesas[pagina * 2 + 1]].filter(
      (mesa): mesa is { numero: number | string; subtitulo?: string } => Boolean(mesa)
    );

    parMesas.forEach((mesa, indiceEnHoja) => {
      const xColumna = indiceEnHoja * TORRE_ANCHO_MM;
      const xCentro = xColumna + TORRE_ANCHO_MM / 2;

      // 0..30 mm (solapa) y 30..117 mm (cara base): blanco limpio sin dibujo.
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xColumna, 0, TORRE_ANCHO_MM, TORRE_BLANCO_FIN_MM, 'F');

      // 117..207 mm: cara numerada superior (90 mm)
      if (fondoDataUrl && formatoFondo) {
        pdf.addImage(
          fondoDataUrl,
          formatoFondo,
          xColumna,
          TORRE_BLANCO_FIN_MM,
          TORRE_ANCHO_MM,
          TORRE_CARA_ALTO_MM
        );
      }

      // 207..297 mm: cara numerada inferior (90 mm)
      if (fondoDataUrl && formatoFondo) {
        pdf.addImage(
          fondoDataUrl,
          formatoFondo,
          xColumna,
          TORRE_CARA_SUP_FIN_MM,
          TORRE_ANCHO_MM,
          TORRE_CARA_ALTO_MM
        );
      }

      dibujarTextosCaraMesa(pdf, {
        xCentro,
        mesaNumero: mesa.numero,
        subtitulo: mesa.subtitulo,
        nombreAgasajado,
        fechaCorta,
        invertido: true,
      });

      dibujarTextosCaraMesa(pdf, {
        xCentro,
        mesaNumero: mesa.numero,
        subtitulo: mesa.subtitulo,
        nombreAgasajado,
        fechaCorta,
        invertido: false,
      });
    });

    // Lineas punteadas suaves para pliegues y corte entre columnas
    pdf.setDrawColor(160, 174, 192);
    pdf.setLineWidth(0.25);
    pdf.setLineDashPattern([2, 2], 0);

    pdf.line(0, TORRE_SOLAPA_FIN_MM, A4_ANCHO_MM, TORRE_SOLAPA_FIN_MM);
    pdf.line(0, TORRE_BLANCO_FIN_MM, A4_ANCHO_MM, TORRE_BLANCO_FIN_MM);
    pdf.line(0, TORRE_CARA_SUP_FIN_MM, A4_ANCHO_MM, TORRE_CARA_SUP_FIN_MM);
    pdf.line(TORRE_ANCHO_MM, 0, TORRE_ANCHO_MM, A4_ALTO_MM);

    pdf.setLineDashPattern([], 0);
  }

  return pdf;
}

export function pdfAUint8Array(pdf: jsPDF): Uint8Array {
  return new Uint8Array(pdf.output('arraybuffer'));
}

export function descargarPdfArchivo(pdf: jsPDF, nombreArchivo: string): void {
  pdf.save(nombreArchivo);
}

export function imprimirPdfEnNavegador(pdf: jsPDF): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    pdf.save('papeleria-ak.pdf');
    return;
  }

  try {
    const blobUrl = String(pdf.output('bloburl'));
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;

    const limpiar = () => {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        limpiar();
      } catch {
        const ventana = window.open(blobUrl, '_blank');
        if (ventana) {
          ventana.focus();
          ventana.print();
          limpiar();
        } else {
          pdf.save('papeleria-ak.pdf');
        }
      }
    };

    document.body.appendChild(iframe);
  } catch {
    pdf.save('papeleria-ak.pdf');
  }
}
