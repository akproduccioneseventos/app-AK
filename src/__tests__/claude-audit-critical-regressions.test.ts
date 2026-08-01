import fs from 'node:fs';
import path from 'node:path';
import { answerConciergeQuestion, QUICK_SUGGESTIONS } from '@/lib/concierge/concierge-engine';
import { buildLookerExportRows } from '@/lib/analytics/looker-export';
import { buildMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics-core';
import { buildMorningRecap, isRecapAvailable } from '@/lib/recap/recap-engine';
import { resolveSocialUploadAccess } from '@/lib/social-fiesta/upload-access';
import type { PublicGuestEvent } from '@/lib/guest-portal-public-data';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';
import type { SocialGalleryPost } from '@/types/social-gallery';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const publicEvent = {
  configuracion: {
    nombreEvento: 'XV de Ana',
    fechaEvento: '2026-08-10',
    horaInicio: '21:00',
    nombreLugar: 'Salón AK',
    direccionLugar: 'Artigas 123',
  },
  programa: [{ id: '1', hora: '23:00', titulo: 'Mesa dulce' }],
  menuSeleccionPortal: { entrada: 'Bruschettas', principal: 'Pollo', postre: 'Torta', bebidas: 'Refrescos' },
  zonaDigitalAdolescentes: { enabled: true, recapEnabled: true },
} as PublicGuestEvent;

describe('critical corrections from the Claude PR audit', () => {
  it('keeps private organization data out of the guest concierge', () => {
    expect(QUICK_SUGGESTIONS.join(' ')).not.toMatch(/pagar|confirmaron|vegetarianos/i);
    expect(answerConciergeQuestion(publicEvent, '¿Cuánto falta pagar?').answer).toContain('privada');
    expect(answerConciergeQuestion(publicEvent, '¿Cuál es el menú?').answer).toContain('Bruschettas');
    expect(answerConciergeQuestion(publicEvent, '¿A qué hora es la mesa dulce?').answer).toContain('23:00');
  });

  it('derives upload identity from validated access instead of browser fields', () => {
    const unauthorized = resolveSocialUploadAccess({
      fiestaId: 'f1',
      submittedAuthorName: 'Administrador',
      submittedSource: 'entertainment',
      appSession: false,
      guestAuthorized: false,
      stationAuthorized: false,
    });
    expect(unauthorized).toBeNull();

    const guest = resolveSocialUploadAccess({
      fiestaId: 'f1',
      submittedAuthorName: 'Nombre falso',
      submittedSource: 'entertainment',
      appSession: false,
      guest: { id: 'g1', nombre: 'Ana Real' },
      guestAuthorized: true,
      stationAuthorized: false,
    });
    expect(guest).toMatchObject({ authorName: 'Ana Real', source: 'guest', sharedStation: false });
    expect(guest?.rateIdentity).toContain('guest:g1');

    const station = resolveSocialUploadAccess({
      fiestaId: 'f1',
      submittedAuthorName: 'Cabina',
      appSession: false,
      guestAuthorized: false,
      stationModuleId: 'fotocabina',
      stationAuthorized: true,
    });
    expect(station).toMatchObject({ source: 'entertainment', sourceModule: 'fotocabina', sharedStation: true });
  });

  it('shows the recap only from the next local day and uses approved real posts', () => {
    expect(isRecapAvailable(publicEvent, new Date(2026, 7, 10, 23, 59))).toBe(false);
    expect(isRecapAvailable(publicEvent, new Date(2026, 7, 11, 0, 0))).toBe(true);
    const posts = [
      { id: 'approved', moderationStatus: 'approved', mediaType: 'image', authorName: 'Ana' },
      { id: 'pending', moderationStatus: 'pending', mediaType: 'image', authorName: 'Luis' },
    ] as SocialGalleryPost[];
    const recap = buildMorningRecap(publicEvent, posts);
    expect(recap.photoCount).toBe(1);
    expect(recap.photos.map((post) => post.id)).toEqual(['approved']);
  });

  it('exports real daily Looker metrics from simulator budgets, WhatsApp leads and contracts', () => {
    const budgets = [
      { id: 'p1', timestamp: '2026-07-20T12:00:00Z', source: 'simulator_common', estado: 'Enviado' },
      { id: 'p2', timestamp: '2026-07-20T13:00:00Z', source: 'manual', estado: 'Aceptado', fechaFirmaContrato: '2026-07-21T10:00:00Z' },
    ] as Presupuesto[];
    const leads = [{ id: 'l1', createdAt: '2026-07-20T14:00:00Z', acquisition: { source: 'whatsapp' } }] as CrmLead[];
    expect(buildLookerExportRows(budgets, leads)).toEqual([
      { fecha: '2026-07-20', cotizaciones: 1, leads_whatsapp: 1, contratos_firmados: 0 },
      { fecha: '2026-07-21', cotizaciones: 0, leads_whatsapp: 0, contratos_firmados: 1 },
    ]);
  });

  it('counts only recent Meta-attributed commercial data without invented defaults', () => {
    const leads = [
      { id: 'l1', createdAt: '2026-07-20T12:00:00Z', presupuestoId: 'p1', acquisition: { source: 'instagram', campaign: 'Meta XV' } },
      { id: 'l2', createdAt: '2026-07-20T12:00:00Z', acquisition: { source: 'direct' } },
    ] as CrmLead[];
    const budgets = [{
      id: 'p1', estado: 'Aceptado', timestamp: '2026-07-22T12:00:00Z', totalConDescuento: 120000,
      costoTotalEstimado: 120000, eventoTipo: 'XV', acquisition: { source: 'instagram', campaign: 'Meta XV' },
    }] as Presupuesto[];
    const metrics = buildMetaCommercialMetrics(leads, budgets, { since: new Date('2026-07-01'), revenueCurrency: 'UYU' });
    expect(metrics).toMatchObject({ totalLeads: 1, totalConversions: 1, totalRevenue: 120000, topEventType: 'XV' });
    expect(metrics.campaigns['meta xv']).toMatchObject({ leadsCount: 1, conversionsCount: 1, revenue: 120000 });
  });

  it('keeps tokens out of URLs and removes fallback secrets and fake datasets', () => {
    const marketingRoute = read('src/app/api/v1/marketing/insights/route.ts');
    const lookerRoute = read('src/app/api/analytics/looker-export/route.ts');
    const crmAction = read('src/app/actions/crm.ts');
    const socialAction = read('src/app/actions/social-gallery.ts');
    const entertainmentAction = read('src/app/actions/fiesta/entretenimiento.actions.ts');

    expect(marketingRoute).not.toContain("searchParams.get('token')");
    expect(lookerRoute).not.toContain('secure-ak-token-2026');
    expect(lookerRoute).not.toContain('TODO: Connect to real CRM');
    expect(crmAction).toContain('marketingConsent: data.marketingConsent === true');
    expect(socialAction).toContain('verifyEntertainmentAccessToken');
    expect(socialAction).toContain('hasPublicGuestAccess');
    expect(socialAction).not.toContain('isSharedKioskUpload(');
    expect(entertainmentAction).toContain('createSocialMediaPostFromUrlForStation');
    expect(entertainmentAction).toContain('}, accessToken);');
  });
});
