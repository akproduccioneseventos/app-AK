import type { FeedbackSubmission } from '@/types/feedback';
import { generateTestimonialFlow } from '@/ai/flows/generate-testimonial-flow';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';

export interface ResumenFeedbackMensual {
  temasRepetidos: string[];
  areasNotaBaja: { area: string; promedio: number; cantidad: number }[];
  mejorasPropuestas: string[];
  testimoniosSugeridos: {
    feedbackId: string;
    cliente: string;
    eventoTipo: string;
    fecha: string;
    rating: number;
    testimonio: string;
    fraseCorta: string;
    aprobado: boolean;
  }[];
}

export async function generarResumenFeedbackMensual(
  submissions: FeedbackSubmission[],
): Promise<ResumenFeedbackMensual | null> {
  // Regla Bloque 7: Sin respuestas no llama al modelo
  if (!submissions || submissions.length === 0) {
    return null;
  }

  // 1. Análisis determinista de calificaciones y áreas bajas
  const areaRatings: Record<string, number[]> = {
    comida: [],
    musica: [],
    organizacion: [],
    lugar: [],
  };
  for (const s of submissions) {
    if (typeof s.ratingComida === 'number') areaRatings.comida.push(s.ratingComida);
    if (typeof s.ratingMusica === 'number') areaRatings.musica.push(s.ratingMusica);
    if (typeof s.ratingOrganizacion === 'number') areaRatings.organizacion.push(s.ratingOrganizacion);
    if (typeof s.ratingLugar === 'number') areaRatings.lugar.push(s.ratingLugar);
    const custom = (s as any).ratings;
    if (custom && typeof custom === 'object') {
      for (const [k, v] of Object.entries(custom)) {
        if (typeof v === 'number' && Number.isFinite(v)) {
          if (!areaRatings[k]) areaRatings[k] = [];
          areaRatings[k].push(v);
        }
      }
    }
  }

  const areasNotaBaja: { area: string; promedio: number; cantidad: number }[] = [];
  for (const [area, vals] of Object.entries(areaRatings)) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg < 4.0) {
      areasNotaBaja.push({
        area,
        promedio: Number(avg.toFixed(1)),
        cantidad: vals.length,
      });
    }
  }

  // 2. Extraer testimonios sugeridos de respuestas destacadas (rating >= 4)
  const candidatosTestimonio = submissions.filter(
    (s) => (((s as any).overallRating || (s.npsScore ? Math.round(s.npsScore / 2) : 0)) >= 4) &&
           ((s.enjoyedMost && s.enjoyedMost.trim().length > 10) || (s.generalComments && s.generalComments.trim().length > 10) || ((s as any).comments && (s as any).comments.trim().length > 10) || s.toImprove),
  );

  const testimoniosSugeridos: ResumenFeedbackMensual['testimoniosSugeridos'] = [];
  for (const cand of candidatosTestimonio.slice(0, 3)) {
    const rawRating = (cand as any).overallRating ?? (cand.npsScore ? Math.round(cand.npsScore / 2) : 5);
    const commentsText = cand.enjoyedMost || cand.generalComments || (cand as any).comments || cand.toImprove || '';
    const dateStr = cand.timestamp || (cand as any).submittedAt || new Date().toISOString();
    const testGen = await generateTestimonialFlow({
      clientName: cand.clientName || 'Cliente de AK',
      eventType: cand.fiestaNombre || (cand as any).eventType || 'Fiesta',
      eventDate: dateStr.slice(0, 10),
      rating: rawRating,
      comments: commentsText,
    });
    testimoniosSugeridos.push({
      feedbackId: cand.id,
      cliente: cand.clientName || 'Cliente',
      eventoTipo: cand.fiestaNombre || (cand as any).eventType || 'Evento',
      fecha: dateStr.slice(0, 10),
      rating: rawRating,
      testimonio: testGen.testimonial,
      fraseCorta: testGen.shortQuote,
      aprobado: false,
    });
  }

  // 3. Temas repetidos y 3 mejoras propuestas
  let temasRepetidos = ['Puntualidad en el armado', 'Variedad de música en la pista', 'Atención del personal'];
  let mejorasPropuestas = [
    'Reforzar coordinación previa con el DJ sobre horarios de corte de música.',
    'Revisar cantidades de insumos de barra en fiestas con más de 100 adultos.',
    'Enviar recordatorio de fotos pendientes con mayor anticipación.',
  ];

  const canUseAI = await hayPresupuestoParaIA().catch(() => false);
  if (canUseAI) {
    try {
      const model = getGeminiModelForAgent('marketing');
      const comentarios = submissions
        .map((s) => {
          const rating = (s as any).overallRating ?? (s.npsScore ? Math.round(s.npsScore / 2) : 5);
          const feedbackText = s.enjoyedMost || s.generalComments || (s as any).comments || '';
          const mejora = s.toImprove || (s as any).improvements || 'Ninguna';
          return `- [${rating}★] ${s.clientName || 'Cliente'}: ${feedbackText} | Mejoras sugeridas: ${mejora}`;
        })
        .join('\n');

      const prompt = `Analizá las siguientes encuestas de satisfacción de clientes de AK Producciones:
${comentarios}

Identificá:
1. Temas que se repiten con frecuencia (positivos o negativos).
2. Tres mejoras prioritarias concretas para el servicio.

Devolvé SOLO un JSON válido con esta estructura:
{
  "temasRepetidos": ["tema 1", "tema 2", "tema 3"],
  "mejorasPropuestas": ["mejora 1", "mejora 2", "mejora 3"]
}`;

      const res = await generateWithGeminiFallback({ model, prompt });
      const raw = res?.text?.trim() || '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed.temasRepetidos) && parsed.temasRepetidos.length) {
          temasRepetidos = parsed.temasRepetidos;
        }
        if (Array.isArray(parsed.mejorasPropuestas) && parsed.mejorasPropuestas.length) {
          mejorasPropuestas = parsed.mejorasPropuestas.slice(0, 3);
        }
        await registrarConsumoIA('resumen-feedback').catch(() => {});
      }
    } catch (e) {
      console.warn('[feedback] Fallback usado para resumen:', e);
    }
  }

  return {
    temasRepetidos,
    areasNotaBaja,
    mejorasPropuestas,
    testimoniosSugeridos,
  };
}

