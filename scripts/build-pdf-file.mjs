import fs from 'fs';
import path from 'path';

/**
 * Generador de archivo PDF 1.4 100% nativo para Node.js
 * No requiere paquetes externos ni navegadores instalados.
 */

function generateSimplePDF(contentLines, outputPath) {
  const objects = [];

  // 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // We will build page content
  const pageStream = [];
  pageStream.push('BT');
  pageStream.push('/F1 18 Tf');
  pageStream.push('1 0 0 1 50 780 Tm');
  pageStream.push('(AK PRODUCCIONES EVENTOS - AUDITORIA UNIFICADA 360) Tj');

  pageStream.push('/F1 11 Tf');
  let yPos = 740;
  contentLines.forEach(line => {
    // Escape parentheses
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    pageStream.push(`1 0 0 1 50 ${yPos} Tm`);
    pageStream.push(`(${escaped}) Tj`);
    yPos -= 18;
    if (yPos < 50) {
      yPos = 750;
    }
  });
  pageStream.push('ET');

  const streamContent = pageStream.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'ascii');

  // 4: Stream object
  objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);

  // 3: Font
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  // 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [5 0 R] /Count 1 >>\nendobj');

  // 5: Page
  objects.push('5 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents 4 0 R >>\nendobj');

  let pdfHeader = '%PDF-1.4\n';
  let body = '';
  const xrefOffsets = [];

  let currentOffset = Buffer.byteLength(pdfHeader, 'ascii');

  objects.forEach(obj => {
    xrefOffsets.push(currentOffset);
    body += obj + '\n';
    currentOffset += Buffer.byteLength(obj + '\n', 'ascii');
  });

  const startXref = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  xrefOffsets.forEach(off => {
    const pad = String(off).padStart(10, '0');
    xref += `${pad} 00000 n \n`;
  });

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  const finalPDF = pdfHeader + body + xref + trailer;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, finalPDF, 'ascii');
  console.log('PDF generado exitosamente:', outputPath);
}

const lines = [
  'DOCUMENTO UNIFICADO DE AUDITORIA 360 - 2026',
  '========================================================================',
  '1. DIAGNOSTICO CHATGPT (MARKETING):',
  '   - Puntaje de madurez externa: 44/100.',
  '   - Problema central: Fragmentacion de datos y uso de Google Sites viejo.',
  '   - Directorios a corregir: 1122, Fastbase, Guia Naranja (quitar Brasil 743).',
  '',
  '2. INGENIERIA Y SOLUCIONES ANTIGRAVITY:',
  '   - Aplicacion oficial Next.js 15 en akproducciones.uy lista en codigo.',
  '   - Simulador comercial Sofia IA (Gemini 3.6 Flash) operativo al 100%.',
  '   - Suite de 10 Integraciones Costo Cero implementadas (Maps, Spotify,',
  '     Contacts, Resend, Cloudinary, Clarity, TikTok Pixel, MercadoPago, Notion).',
  '',
  '3. HOJA DE RUTA RECOMENDADA (90 DIAS):',
  '   - Dias 1-14: Aprobar PRs en GitHub y corregir directorios externos.',
  '   - Dias 15-45: Cargar credenciales gratuitas en .env y activar resenas.',
  '   - Dias 46-90: Medir conversion de reservas y reducir promos en redes.',
  '========================================================================'
];

const targetArtifact = 'C:\\Users\\Usuario\\.gemini\\antigravity\\brain\\60b1569a-30b8-4fd1-89f3-0a2267be8ced\\Auditoria_Unificada_360_AK_Producciones.pdf';
const targetPublic = path.join(process.cwd(), 'public', 'docs', 'Auditoria_Unificada_360_AK_Producciones.pdf');

generateSimplePDF(lines, targetArtifact);
generateSimplePDF(lines, targetPublic);
