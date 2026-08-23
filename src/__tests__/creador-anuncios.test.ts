import { generarAnuncioCompleto } from '@/lib/marketing/creador-anuncios-ia';
import { auditarAnuncioConIA } from '@/lib/marketing/auditor-anuncios-ia';

describe('Creador de Anuncios con IA (Estilo Zeely Mejorado)', () => {
  it('genera un anuncio completo para fiesta de 15 años con neuroventas, guión y segmentación', () => {
    const anuncio = generarAnuncioCompleto({
      tipoEvento: '15_anos',
      objetivo: 'simulador',
      tono: 'emocional_familiar',
      beneficioDestacado: 'Pista LED y pista de baile completa',
    });

    expect(anuncio.id).toBeDefined();
    expect(anuncio.tipoEvento).toBe('15_anos');
    expect(anuncio.tituloGancho.length).toBeGreaterThan(10);
    expect(anuncio.textoPrincipal).toContain('AK Producciones');
    expect(anuncio.textoPrincipal).toContain('Pista LED');
    expect(anuncio.enlaceDestino).toContain('https://akproducciones.uy/simulador');

    // Guión de Reels/TikTok
    expect(anuncio.guionReelsTikTok.escenas.length).toBeGreaterThan(0);
    expect(anuncio.guionReelsTikTok.duracionSegundos).toBe(15);
    expect(anuncio.guionReelsTikTok.escenas[0].textoPantalla).toBeDefined();

    // Segmentación
    expect(anuncio.publicoObjetivoSugerido.edad).toContain('Madres');
    expect(anuncio.publicoObjetivoSugerido.ubicacion).toContain('Salto');
  });

  it('genera un enlace con mensaje prellenado de WhatsApp cuando el objetivo es WhatsApp', () => {
    const anuncio = generarAnuncioCompleto({
      tipoEvento: 'bodas',
      objetivo: 'whatsapp',
      tono: 'elegante_premium',
      contactoWhatsApp: '59898765432',
    });

    expect(anuncio.enlaceDestino).toContain('https://wa.me/59898765432');
    expect(anuncio.enlaceDestino).toContain(encodeURIComponent('bodas'));
  });

  it('genera anuncio de promo temporada con bonificación y urgencia', () => {
    const anuncio = generarAnuncioCompleto({
      tipoEvento: 'promocion_temporada',
      objetivo: 'simulador',
      tono: 'urgencia_oferta',
      descuentoTexto: 'Barra de tragos bonificada al 100%',
    });

    expect(anuncio.textoPrincipal).toContain('Barra de tragos bonificada');
    expect(anuncio.tituloGancho).toMatch(/promo|precios? congelados?|reservar/i);
  });
});

describe('Auditor Inteligente de Anuncios (Anti-Meta "Invertí Más")', () => {
  it('detecta fallas críticas en un anuncio frío/técnico y le da baja puntuación sin pedir más plata', () => {
    const copyMalo = `Ofrecemos servicio de audio y luces para eventos en Salto.
Tenemos sonido 2000 watts, consolas dmx y parlantes de 15 pulgadas.
El mejor precio garantizado.
Consultas por privado al inbox.`;

    const resultado = auditarAnuncioConIA({
      textoAnuncio: copyMalo,
      plataforma: 'instagram',
    });

    expect(resultado.puntajeGlobal).toBeLessThan(6);
    expect(resultado.evaluacionGancho.puntaje).toBeLessThan(6);
    expect(resultado.evaluacionNeuroventas.puntaje).toBeLessThan(6);
    expect(resultado.evaluacionOfertaFriccion.puntaje).toBeLessThan(6);

    // Verifica que detectó los problemas reales
    expect(resultado.fallasCriticas.some((f) => f.includes('scroll') || f.includes('producto'))).toBe(true);
    expect(resultado.fallasCriticas.some((f) => f.includes('tecnicismos') || f.includes('cables'))).toBe(true);
    expect(resultado.fallasCriticas.some((f) => f.includes('privado'))).toBe(true);

    // Verifica que entrega una versión reescrita optimizada
    expect(resultado.anuncioReescritoOptimizado.copyCompleto).toBeDefined();
    expect(resultado.anuncioReescritoOptimizado.porQueEstaVersionConvierteMejor).toBeDefined();

    // Comprobación clave: Nunca debe decirle que invierta más plata
    const textoCompletoAuditoria = JSON.stringify(resultado).toLowerCase();
    expect(textoCompletoAuditoria).not.toContain('aumentá tu presupuesto diario');
    expect(textoCompletoAuditoria).not.toContain('duplicá tu inversión');
  });

  it('califica positivamente un anuncio con neuroventas, gancho emocional y baja fricción', () => {
    const copyBueno = `¿Tu hija cumple 15 en 2026 y no sabés por dónde arrancar a organizar? ✨👑

Sabemos que planear los 15 es una mezcla de emoción y mil detalles. En AK Producciones nos encargamos de que sea una fiesta soñada e inolvidable con salón, música y recuerdos para toda la vida.

👉 Entrá al simulador online y armá su propuesta personalizada en 2 minutos sin compromiso.`;

    const resultado = auditarAnuncioConIA({
      textoAnuncio: copyBueno,
      plataforma: 'instagram',
    });

    expect(resultado.puntajeGlobal).toBeGreaterThanOrEqual(8);
    expect(resultado.evaluacionGancho.puntaje).toBeGreaterThanOrEqual(7);
    expect(resultado.evaluacionNeuroventas.palabrasClaveEmocionales.length).toBeGreaterThan(0);
    expect(resultado.diagnosticoResumen).toContain('optimizado para convertir');
  });
});

