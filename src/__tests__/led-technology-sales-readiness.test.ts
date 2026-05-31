import {
  LED_SALES_STORYLINE,
  LED_CLIENT_DECISION_SCENES,
  LED_SALES_IMPACT_STATS,
  LED_TECHNOLOGY_PACKAGES,
  SERVICE_MAP,
  TECHNOLOGY_STEPS,
} from '@/lib/portfolio-experience/portfolio-experience-data';
import {
  buildPortalLedTechnologyChecklist,
  buildPortalLedTechnologySalesScript,
  getPortalLedVisibleTechnologyItems,
} from '@/lib/commercial/portal-led-technology-showcase';
import { buildAkTechnologySuite } from '@/lib/technology-ak/fiesta-technology-products';

describe('LED technology seller readiness', () => {
  it('shows the party technology zone in the portfolio map', () => {
    const serviceIds = SERVICE_MAP.map(service => service.id);
    const stepIds = TECHNOLOGY_STEPS.map(step => step.id);

    expect(serviceIds).toEqual(expect.arrayContaining([
      'zona-digital-adolescentes',
      'entretenimiento-viral',
      'barra-tecnologica',
      'pantallas-totem',
      'modo-audioritmico',
    ]));
    expect(stepIds).toEqual(expect.arrayContaining([
      'zona-digital',
      'entretenimiento-viral',
      'barra-tecnologica',
      'totems',
    ]));
  });

  it('explains how the seller should sell technology as packages', () => {
    expect(LED_SALES_STORYLINE).toHaveLength(5);
    expect(LED_SALES_IMPACT_STATS).toHaveLength(4);
    expect(LED_CLIENT_DECISION_SCENES).toHaveLength(5);
    expect(LED_TECHNOLOGY_PACKAGES.length).toBeGreaterThanOrEqual(5);
    expect(LED_TECHNOLOGY_PACKAGES.map(pack => pack.id)).toContain('zona-digital-adolescentes');
    expect(LED_TECHNOLOGY_PACKAGES.map(pack => pack.id)).toContain('barra-tecnologica');
    expect(LED_TECHNOLOGY_PACKAGES.every(pack => pack.sellAs && pack.clientValue && pack.includes.length > 2)).toBe(true);
    expect(LED_CLIENT_DECISION_SCENES.some(scene => scene.sellerLine.includes('mostrando'))).toBe(true);
  });

  it('adds digital zone products to the LED sales script', () => {
    const visible = getPortalLedVisibleTechnologyItems();
    const script = buildPortalLedTechnologySalesScript().join(' ');
    const checklist = buildPortalLedTechnologyChecklist().join(' ');

    expect(visible.some(item => item.id === 'zona_digital_adolescente')).toBe(true);
    expect(visible.some(item => item.id === 'barra_tecnologica')).toBe(true);
    expect(visible.find(item => item.id === 'entretenimiento_viral')?.shortPitch).toContain('Plataforma 360');
    expect(visible.find(item => item.id === 'entretenimiento_viral')?.sellerScript).toContain('pantalla LED');
    expect(script).toContain('Totems sincronizados');
    expect(checklist).toContain('opcional');
  });

  it('scores a real party technology zone as its own product', () => {
    const suite = buildAkTechnologySuite({
      id: 'fiesta-led',
      configuracion: {
        nombreEvento: 'XV Demo',
        tipoCelebracion: 'XV',
        fechaEvento: '2026-11-15',
        nombreLugar: 'Club Uruguay',
        protagonistaFotoUrl: 'https://example.com/foto.jpg',
      },
      clientPortalSettings: {
        enabled: true,
        accessKey: 'vip-ak',
        paginaPublica: { visible: true },
      },
      invitacionSlug: 'xv-demo',
      invitados: [{ nombre: 'Invitada 1', mesa: '1' }],
      listaMusicaPortal: ['tema demo'],
      socialGallerySettings: {
        enabled: true,
        screenMode: { enabled: true, playlist: [{ type: 'audioritmico' }] },
        totemScreens: [{ id: 'entrada' }],
      },
      eventoEnVivo: {
        fotos: [{ id: 'foto1' }],
        mensajes: [{ id: 'mensaje1' }],
        votaciones: [{ id: 'voto1' }],
      },
      zonaDigitalAdolescentes: {
        enabled: true,
        features: [{ id: 'retos' }],
        challenges: [{ id: 'selfie' }],
        games: [{ id: 'trivia' }],
      },
      modulosContratados: {
        zonaDigital: true,
        barraTecnologica: true,
        entretenimiento: true,
        pantallasTotem: true,
      },
      others: {
        entretenimiento: { modules: { fotocabina: { enabled: true } } },
        barraTecnologica: { enabled: true },
      },
      galeriaUrl: 'https://example.com/galeria',
    });

    const digitalZone = suite.products.find(product => product.id === 'zona_digital');

    expect(digitalZone?.score).toBe(100);
    expect(digitalZone?.alreadyConnected.join(' ')).toContain('Barra tecnologica');
  });
});
