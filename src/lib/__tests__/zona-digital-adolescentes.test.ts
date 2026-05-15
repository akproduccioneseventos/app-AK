import {
  buildZonaDigitalPublicUrl,
  buildZonaDigitalScore,
  getVisibleZonaDigitalFeatures,
  withZonaDigitalDefaults,
} from '@/lib/zona-digital-adolescentes';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('zona digital adolescentes', () => {
  it('crea defaults con retos, juegos, emojis y redes activas', () => {
    const settings = withZonaDigitalDefaults();

    expect(settings.enabled).toBe(true);
    expect(settings.features.length).toBeGreaterThanOrEqual(10);
    expect(settings.challenges.filter(item => item.enabled).length).toBeGreaterThanOrEqual(6);
    expect(settings.games.filter(item => item.enabled).length).toBeGreaterThanOrEqual(4);
    expect(settings.socialNetworks.some(item => item.id === 'instagram' && item.enabled)).toBe(true);
    expect(settings.emojiReactions.some(item => item.emoji === '🔥' && item.enabled)).toBe(true);
  });

  it('oculta experiencias con modulos apagados', () => {
    const settings = withZonaDigitalDefaults();
    const visible = getVisibleZonaDigitalFeatures(settings, {
      tareas: true,
      invitados: true,
      paginaWeb: true,
      decoracion: true,
      catering: true,
      musica: true,
      personal: true,
      itinerario: true,
      documentos: true,
      costos: true,
      cargaOperativa: true,
      fotografia: true,
      videoVida: true,
      reuniones: true,
      muroSocial: true,
      regalos: false,
      feedback: false,
      menuMesa: false,
      checkin: false,
      resumenImprimible: false,
      configuracion: true,
      disenoSalon: true,
      listaCompras: true,
      portalCliente: true,
      numerosMesa: true,
      mesasCliente: true,
      resumenPlanificacion: true,
      enVivo: true,
      entretenimiento: false,
      barraTecnologica: false,
      pantallasTotem: false,
      zonaDigital: true,
      carteleria: true,
    });

    expect(visible.some(item => item.id === 'fotocabina')).toBe(false);
    expect(visible.some(item => item.id === 'barra')).toBe(false);
    expect(visible.some(item => item.id === 'muro_social')).toBe(true);
    expect(visible.some(item => item.id === 'retos')).toBe(true);
  });

  it('calcula estado listo cuando la fiesta tiene zona digital completa', () => {
    const fiesta: FiestaEnPlanificacion = {
      id: 'fiesta-test',
      configuracion: {
        nombreEvento: 'XV Demo',
        tipoCelebracion: 'XV',
        horaInicio: '21:00',
        horaFin: '05:00',
        nombreLugar: 'Club Uruguay',
        invitadosEstimados: 100,
        presupuestoEstimado: 0,
        notesAdicionales: '',
      },
      personalAsignado: [],
      modulosContratados: {
        tareas: true,
        invitados: true,
        paginaWeb: true,
        decoracion: true,
        catering: true,
        musica: true,
        personal: true,
        itinerario: true,
        documentos: true,
        costos: true,
        cargaOperativa: true,
        fotografia: true,
        videoVida: true,
        reuniones: true,
        muroSocial: true,
        regalos: false,
        feedback: false,
        menuMesa: false,
        checkin: true,
        resumenImprimible: false,
        configuracion: true,
        disenoSalon: true,
        listaCompras: true,
        portalCliente: true,
        numerosMesa: true,
        mesasCliente: true,
        resumenPlanificacion: true,
        enVivo: true,
        entretenimiento: true,
        barraTecnologica: true,
        pantallasTotem: true,
        zonaDigital: true,
        carteleria: true,
      },
      zonaDigitalAdolescentes: withZonaDigitalDefaults(),
    };

    expect(buildZonaDigitalPublicUrl(fiesta.id)).toBe('/evento/zona-digital/fiesta-test');
    expect(buildZonaDigitalScore(fiesta).score).toBe(100);
  });
});
