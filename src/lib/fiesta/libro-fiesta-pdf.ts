import { jsPDF } from 'jspdf';
import type { SocialGalleryPost, Dedication, SongRequest } from '@/types/social-gallery';
import type { Invitado, ProgramaEventoItem } from '@/types/fiesta';

export interface LibroFiestaData {
  fiestaId: string;
  eventName: string;
  eventType?: string;
  eventDate?: string;
  venueName?: string;
  posts: SocialGalleryPost[];
  dedications: Dedication[];
  songs: SongRequest[];
  invitados: Invitado[];
  cronograma?: ProgramaEventoItem[];
}

export async function generateLibroFiestaPdf(data: LibroFiestaData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper colors
  const primaryColor = [225, 29, 72]; // Rose-600 #e11d48
  const darkColor = [15, 23, 42]; // Slate-900 #0f172a
  const textMuted = [100, 116, 139]; // Slate-500 #64748b

  // ── PORTADA ──
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AK PRODUCCIONES • EXPERIENCIA INTEGRAL', pageWidth / 2, 40, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('LIBRO DE LA FIESTA', pageWidth / 2, 70, { align: 'center' });

  doc.setTextColor(251, 191, 36); // Amber-400
  doc.setFontSize(22);
  doc.text(data.eventName.toUpperCase(), pageWidth / 2, 85, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const fechaStr = data.eventDate || 'Noche Inolvidable';
  const salonStr = data.venueName ? `en ${data.venueName}` : '';
  doc.text(`${fechaStr} ${salonStr}`, pageWidth / 2, 100, { align: 'center' });

  // Summary box
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.roundedRect(30, 130, pageWidth - 60, 80, 5, 5, 'F');

  const confirmados = data.invitados.filter((i) => i.checkedIn || i.asistencia === 'Confirmado').length;
  const totalFotos = data.posts.filter((p) => p.moderationStatus === 'approved').length;
  const totalDedis = data.dedications.length;
  const totalCanciones = data.songs.length;

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de la Gran Noche:', pageWidth / 2, 145, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`• ${confirmados} invitados celebrando juntos`, 40, 160);
  doc.text(`• ${totalFotos} fotos compartidas en el muro en vivo`, 40, 170);
  doc.text(`• ${totalDedis} mensajes y dedicatorias de cariño`, 40, 180);
  doc.text(`• ${totalCanciones} canciones que hicieron vibrar la pista`, 40, 190);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Recuerdo exclusivo generado automáticamente por la plataforma de AK Producciones', pageWidth / 2, pageHeight - 25, {
    align: 'center',
  });

  // ── PÁGINA 2: MENSAJES Y DEDICATORIAS ──
  if (data.dedications.length > 0) {
    doc.addPage();
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Dedicatorias y Mensajes del Corazón', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Palabras dejadas por los invitados durante la fiesta:', 20, 32);

    let y = 45;
    const topDedications = data.dedications.slice(0, 8);

    for (const d of topDedications) {
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 25;
      }
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, y, pageWidth - 40, 22, 3, 3, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(d.authorName || 'Invitado Especial', 25, y + 7);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const splitText = doc.splitTextToSize(d.message || '(Audio grabado)', pageWidth - 50);
      doc.text(splitText, 25, y + 14);

      y += 26;
    }
  }

  // ── PÁGINA 3: HITS DE LA PISTA & CRONOGRAMA ──
  doc.addPage();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('La Música y el Ritmo de la Noche', 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Los temas más votados y pedidos al DJ:', 20, 32);

  let ySongs = 45;
  const topSongs = [...data.songs].sort((a, b) => b.votes - a.votes).slice(0, 6);

  if (topSongs.length > 0) {
    for (const song of topSongs) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, ySongs, pageWidth - 40, 16, 3, 3, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`🎵 ${song.songName}`, 25, ySongs + 7);

      doc.setFontSize(8.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`${song.votes} votos del público • Pedido por ${song.suggestedBy || 'Invitado'}`, 25, ySongs + 12);

      ySongs += 20;
    }
  } else {
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Pista encendida toda la noche con la selección musical del DJ.', 20, ySongs);
    ySongs += 20;
  }

  // Momentos de la fiesta si hay cronograma
  if (data.cronograma && data.cronograma.length > 0) {
    ySongs += 10;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Momentos Inolvidables Hora por Hora', 20, ySongs);

    ySongs += 10;
    for (const item of data.cronograma.slice(0, 6)) {
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.hora} - ${item.titulo}`, 25, ySongs);

      if (item.descripcion) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text(item.descripcion, 25, ySongs + 5);
        ySongs += 12;
      } else {
        ySongs += 8;
      }
    }
  }

  return doc.output('blob');
}
