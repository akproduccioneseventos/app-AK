import jsPDF from 'jspdf';
import type { Dedication, SocialGalleryPost, SongRequest } from '@/types/social-gallery';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export interface LibroFiestaData {
  fiesta: FiestaEnPlanificacion;
  posts: SocialGalleryPost[];
  dedications: Dedication[];
  songs: SongRequest[];
}

export function generarLibroFiestaPdf(data: LibroFiestaData): jsPDF {
  const { fiesta, posts, dedications, songs } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const eventName = fiesta.configuracion.nombreEvento || 'Fiesta Inolvidable';
  const eventDate = fiesta.configuracion.fechaEvento || 'Fecha a confirmar';
  const venue = fiesta.configuracion.nombreLugar || 'Salón de Eventos';

  // --- PÁGINA 1: PORTADA ---
  // Fondo oscuro elegante
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Marco decorativo dorado/rojo
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(1.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.rect(17, 17, pageWidth - 34, pageHeight - 34);

  // Textos de Portada
  doc.setTextColor(217, 119, 6); // amber-600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AK PRODUCCIONES · RECUERDO OFICIAL', pageWidth / 2, 45, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text('LIBRO DE LA FIESTA', pageWidth / 2, 85, { align: 'center' });

  doc.setFontSize(20);
  doc.setTextColor(241, 245, 249);
  doc.text(eventName, pageWidth / 2, 105, { align: 'center' });

  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 35, 115, pageWidth / 2 + 35, 115);

  doc.setFontSize(12);
  doc.setTextColor(203, 213, 225);
  doc.text(`Fecha: ${eventDate}`, pageWidth / 2, 130, { align: 'center' });
  doc.text(`Lugar: ${venue}`, pageWidth / 2, 138, { align: 'center' });

  // Resumen de estadísticas en portada
  const approvedPosts = posts.filter((p) => (p.moderationStatus ?? 'approved') === 'approved');
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(30, 165, pageWidth - 60, 40, 4, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MOMENTOS COMPARTIDOS', pageWidth / 2, 175, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`📸 ${approvedPosts.length} Fotos en el Muro  ·  💌 ${dedications.length} Dedicatorias  ·  🎵 ${songs.length} Canciones`, pageWidth / 2, 190, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Salto, Uruguay · akproducciones.uy', pageWidth / 2, pageHeight - 25, { align: 'center' });

  // --- PÁGINA 2: DEDICATORIAS Y MENSAJES ---
  doc.addPage();
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Dedicatorias y Mensajes', 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Los saludos y buenos deseos que dejaron los invitados durante la fiesta.', 20, 32);

  doc.setDrawColor(226, 232, 240);
  doc.line(20, 36, pageWidth - 20, 36);

  let currentY = 45;
  const maxDedications = Math.min(dedications.length, 6);

  if (dedications.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text('No se registraron dedicatorias en este evento.', 20, 50);
  } else {
    for (let i = 0; i < maxDedications; i++) {
      const ded = dedications[i];
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 25;
      }

      // Card de dedicatoria
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, currentY, pageWidth - 40, 26, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(ded.authorName || 'Invitado', 25, currentY + 7);

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitText = doc.splitTextToSize(ded.message || '(Mensaje de voz)', pageWidth - 50);
      doc.text(splitText, 25, currentY + 14);

      currentY += 31;
    }
  }

  // --- PÁGINA 3: HITS DE LA PISTA Y CRONOGRAMA ---
  doc.addPage();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('La Música y los Momentos', 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Las canciones más votadas en la fiesta y los hitos del evento.', 20, 32);

  doc.setDrawColor(226, 232, 240);
  doc.line(20, 36, pageWidth - 20, 36);

  // Top Canciones
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('🎵 Canciones más Pedidas por los Invitados', 20, 48);

  const topSongs = [...songs].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 5);
  let songY = 56;

  if (topSongs.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('No hubo pedidos de canciones registrados.', 20, songY);
    songY += 10;
  } else {
    topSongs.forEach((song, idx) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, songY, pageWidth - 40, 12, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(217, 119, 6);
      doc.text(`#${idx + 1}`, 24, songY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(song.song, 34, songY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`${song.votes || 0} votos`, pageWidth - 40, songY + 8);

      songY += 15;
    });
  }

  // Cronograma
  const programa = fiesta.programa || [];
  if (programa.length > 0) {
    const cronoY = songY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('⏱️ Cronograma de la Noche', 20, cronoY);

    let itemY = cronoY + 8;
    programa.slice(0, 6).forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(item.hora || '--:--', 20, itemY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(item.titulo || '', 38, itemY);

      itemY += 8;
    });
  }

  // Pie de página final
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Generado con el sistema de eventos de AK Producciones · www.akproducciones.uy', pageWidth / 2, pageHeight - 15, { align: 'center' });

  return doc;
}
