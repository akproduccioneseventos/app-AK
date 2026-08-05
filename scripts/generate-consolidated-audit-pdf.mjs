import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const { jsPDF } = require('jspdf');

/**
 * Script para generar la Auditoría Unificada 360° (ChatGPT + Antigravity AI)
 * en un único archivo PDF profesional.
 */

async function generatePDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Paleta de colores oficiales AK Producciones
  const primaryColor = [215, 25, 32];   // #d71920 Rojo AK
  const darkColor = [30, 41, 59];       // Slate 800
  const purpleColor = [109, 40, 217];   // Violeta ChatGPT
  const grayColor = [100, 116, 139];    // Slate 500

  function addHeader() {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('AK PRODUCCIONES EVENTOS  |  AUDITORÍA UNIFICADA 360° (CHATGPT + ANTIGRAVITY)', margin, 10);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 15, pageWidth - margin, 15);
  }

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      addHeader();
      y = 25;
    }
  }

  // PORTADA / PAGINA 1
  addHeader();

  y = 35;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('AK', pageWidth / 2, y, { align: 'center' });

  y += 10;
  doc.setFontSize(16);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('PRODUCCIONES EVENTOS', pageWidth / 2, y, { align: 'center' });

  y += 15;
  doc.setLineWidth(1);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(margin + 20, y, pageWidth - margin - 20, y);

  y += 20;
  doc.setFontSize(22);
  doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
  doc.text('AUDITORÍA DIGITAL 360° CONSOLIDADA', pageWidth / 2, y, { align: 'center' });

  y += 10;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('Fusión de Diagnóstico de Marketing (ChatGPT) e Ingeniería de Software (Antigravity AI)', pageWidth / 2, y, { align: 'center' });

  y += 25;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');

  let boxY = y + 10;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('RESUMEN EJECUTIVO Y VEREDICTO DE INGENIERÍA', margin + 8, boxY);

  boxY += 8;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  const summaryLines = doc.splitTextToSize(
    'Esta auditoría combina el análisis externo de posicionamiento comercial (ChatGPT) con la evaluación técnica interna del sistema Next.js 15 y Firestore (Antigravity). El freno principal de AK no radica en la calidad de sus eventos ni en falta de tecnología, sino en la desincronización entre la presencia digital externa (directorios y fichas antiguas) y el motor técnico de alta conversión ya desarrollado en la aplicación.',
    contentWidth - 16
  );
  doc.text(summaryLines, margin + 8, boxY);

  y += 60;

  // CUADRO DE COMPARACIÓN RÁPIDA
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('1. CUADRO COMPARATIVO: CHATGPT VS. ANTIGRAVITY', margin, y);

  y += 8;
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Dimensión', margin + 3, y + 5.5);
  doc.text('Diagnóstico ChatGPT (Marketing)', margin + 45, y + 5.5);
  doc.text('Solución Antigravity (Ingeniería)', margin + 115, y + 5.5);

  y += 8;
  const rows = [
    [
      'Dominio y Web',
      'Puntaje 2.5/10. Uso de Google Sites viejo con información obsoleta.',
      'Desarrollada App oficial Next.js 15 en akproducciones.uy con SSR y subdominios.'
    ],
    [
      'Captación y Ventas',
      'Puntaje 5.0/10. Consultas dispersas en WhatsApp sin trazabilidad.',
      'Simulador IA Sofía (Gemini) + Formulario con guardado automático en CRM.'
    ],
    [
      'Ecosistema Integrado',
      'Directorios desactualizados (1122, Fastbase) y fichas duplicadas.',
      'Suite de 10 Integraciones Gratuitas (Maps, Contacts, Spotify, Resend, Clarity, MP).'
    ],
    [
      'Experiencia de Fiesta',
      'Falta de portafolio interactivo y prueba social estructurada.',
      'Portal Cliente + Muro Social con moderación IA + RSVP con QR en 20 segundos.'
    ]
  ];

  rows.forEach((row, i) => {
    checkPageBreak(25);
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.rect(margin, y, contentWidth, 20, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 20, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(row[0], margin + 3, y + 6);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

    const col1 = doc.splitTextToSize(row[1], 65);
    const col2 = doc.splitTextToSize(row[2], 65);

    doc.text(col1, margin + 45, y + 6);
    doc.text(col2, margin + 115, y + 6);

    y += 20;
  });

  // PAGINA 2: AUDITORÍA TÉCNICA Y DE INTEGRACIONES
  doc.addPage();
  addHeader();
  y = 25;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('2. AUDITORÍA TÉCNICA DE CÓDIGO E INTEGRACIONES (ANTIGRAVITY)', margin, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('Se auditaron los componentes desarrollados en la aplicación Next.js y su estado de preparación:', margin, y);

  y += 8;
  const techItems = [
    { name: '1. Simulador de Presupuestos & Sofía IA', status: 'OPERATIVO (100%)', desc: 'Motor Gemini 3.6 Flash integrado para cotizaciones en tiempo real sin fricción.' },
    { name: '2. Google Contacts API (CRM)', status: 'LISTO EN CÓDIGO', desc: 'Guardado silencioso de leads de la web directo a los contactos de la empresa.' },
    { name: '3. Google Maps / OpenStreetMap', status: 'IMPLEMENTADO', desc: 'Vista previa interactiva del lugar de la fiesta en plantillas Allegria y Grazia.' },
    { name: '4. Spotify API (Canciones DJ)', status: 'IMPLEMENTADO', desc: 'Buscador de temas en tiempo real para que los invitados armen la lista del DJ.' },
    { name: '5. Cloudinary Storage (Muro Social)', status: 'IMPLEMENTADO', desc: 'Optimización e inteligencia artificial para compresión de fotos sin colapsar el servidor.' },
    { name: '6. Resend Email Service', status: 'IMPLEMENTADO', desc: 'Envío de hasta 3.000 emails transaccionales gratuitos por mes (RSVP y Presupuestos).' },
    { name: '7. Microsoft Clarity (Mapas de Calor)', status: 'IMPLEMENTADO', desc: 'Grabación de navegación e interacción de usuarios en la web sin violar privacidad.' },
    { name: '8. TikTok Pixel & Meta CAPI', status: 'IMPLEMENTADO', desc: 'Rastreamiento y atribución de conversiones para campañas de 15 años y bodas.' },
    { name: '9. MercadoPago Checkout Pro', status: 'IMPLEMENTADO', desc: 'Generación de links de pago para señas y mesa de regalos de bodas.' },
    { name: '10. Notion API Sync', status: 'IMPLEMENTADO', desc: 'Sincronización de eventos confirmados con el tablero de tareas del staff.' }
  ];

  techItems.forEach((item) => {
    checkPageBreak(16);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(item.name, margin + 5, y + 5.5);

    doc.setFontSize(8);
    doc.setTextColor(0, 128, 0);
    doc.text(item.status, pageWidth - margin - 35, y + 5.5);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(item.desc, margin + 5, y + 10.5);

    y += 16;
  });

  // PAGINA 3: HOJA DE RUTA UNIFICADA DE 90 DÍAS
  doc.addPage();
  addHeader();
  y = 25;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('3. HOJA DE RUTA UNIFICADA DE EJECUCIÓN (PLAN MAESTRO 90 DÍAS)', margin, y);

  y += 10;
  const roadmap = [
    {
      phase: 'FASE 1: SANAMIENTO Y ACTIVACIÓN WEB (Días 1 a 14)',
      tasks: [
        '• Fusionar y aprobar la Pull Request en GitHub para publicar akproducciones.uy.',
        '• Configurar los registros DNS CNAME (galeria.akproducciones.uy -> dns1.wfolio.com) en Cloudflare.',
        '• Solicitar corrección de datos viejos (Brasil 743 / teléfono) en 1122, Guía Naranja y Fastbase.',
        '• Dejar una sola ficha verificada en Google Business Profile y ocultar la dirección si no hay local.'
      ]
    },
    {
      phase: 'FASE 2: CONEXIÓN DE CREDENCIALES Y REPUTACIÓN (Días 15 a 45)',
      tasks: [
        '• Pegar las claves API gratuitas en el .env (Resend, Cloudinary, Spotify, MercadoPago, Clarity).',
        '• Implementar el sistema de solicitud de reseñas de Google mediante QR al cerrar cada fiesta.',
        '• Configurar el Pixel de TikTok y Meta CAPI para el retargeting de quinceañeras y novias.',
        '• Publicar los primeros 5 casos reales de eventos en la nueva web.'
      ]
    },
    {
      phase: 'FASE 3: ESCALADO Y MEDICIÓN DE RESERVAS (Días 46 a 90)',
      tasks: [
        '• Reequilibrar el calendario de redes: máximo 10% de promos y 45% de casos reales.',
        '• Medir la tasa de conversión desde el primer contacto en WhatsApp hasta la reserva de la seña.',
        '• Sincronizar el tablero de Notion con el equipo de catering, DJ y decoración.'
      ]
    }
  ];

  roadmap.forEach(phase => {
    checkPageBreak(40);
    doc.setFillColor(243, 232, 255);
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
    doc.text(phase.phase, margin + 4, y + 5.5);

    y += 12;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

    phase.tasks.forEach(task => {
      doc.text(task, margin + 4, y);
      y += 6;
    });

    y += 6;
  });

  // Guardar archivo PDF
  const outputDir = path.join(process.cwd(), 'public', 'docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'Auditoria_Unificada_360_AK_Producciones.pdf');
  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

  console.log(`PDF generado exitosamente en: ${outputPath}`);
}

generatePDF().catch(err => {
  console.error('Error generando PDF:', err);
  process.exit(1);
});
