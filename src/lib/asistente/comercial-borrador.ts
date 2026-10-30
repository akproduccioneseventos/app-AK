import 'server-only';

import { readData } from '@/lib/data-service';
import { persistPublicSimulatorBudget } from '@/lib/budget/public-simulator-persistence';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import type { GaleriaData, GaleriaFoto } from '@/types/galeria';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { SocialGalleryPost } from '@/types/social-gallery';
import { getPublicSocialPosts } from '@/app/actions/social-gallery';
import type { ArmadoRapidoConfig, LeadFromQuickBudget } from '@/types/armado-rapido';
import { defaultClubUruguayConfig } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu } from '@/types/catering';
import { buildAuthoritativeSimulatorServices } from '@/lib/simulator/catalog';
import { getRemovablePackageServices } from '@/lib/simulator/package-customization';
import type { TipoEvento } from '@/types/presupuesto';
import type { PromotionalPhotoConsent } from '@/types/promotional-photo-consent';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { createHash } from 'crypto';

const CONSENTS_FILE = 'promotional-photo-consents.json';

export interface DatosProspectoAnuncio {
  phone: string;
  name: string;
  fecha: string;
  invitados: number;
  salon: string;
  tipoEvento: TipoEvento | 'Otro';
  requestId?: string;
}

export interface FotoPromocionalElegible {
  id: string;
  eventId: string;
  url: string;
  tipoFiesta: string;
  invitados?: number;
  salon?: string;
}

type ConsentMap = Record<string, PromotionalPhotoConsent>;

function validDate(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function hasCurrentPhotoConsent(consent: PromotionalPhotoConsent | undefined, eventId: string): boolean {
  return Boolean(
    consent
    && consent.eventId === eventId
    && consent.authorized === true
    && consent.revokedAt === undefined
    && ['owner', 'client'].includes(consent.grantedBy)
    && ['contract', 'written', 'recorded', 'client_portal'].includes(consent.method)
    && typeof consent.evidenceReference === 'string' && consent.evidenceReference.trim()
    && typeof consent.contractVersion === 'string' && consent.contractVersion.trim()
    && typeof consent.recordedBy === 'string' && consent.recordedBy.trim()
    && validDate(consent.recordedAt)
  );
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function tiposEquivalentes(value: string): string[] {
  const normalized = normalize(value);
  const aliases: Record<string, string[]> = {
    boda: ['boda', 'bodas', 'casamiento', 'casamientos'],
    'xv anos': ['xv anos', '15 anos', 'quince anos'],
    cumpleanos: ['cumpleanos', 'cumpleanos adulto'],
    'evento corporativo': ['evento corporativo', 'corporativo', 'empresarial', 'empresariales'],
    'cumpleanos infantil': ['cumpleanos infantil', 'infantil', 'infantiles'],
  };
  return aliases[normalized] || [normalized];
}

function toPhoto(asset: GaleriaFoto): FotoPromocionalElegible | null {
  if (!asset.eventoId || typeof asset.url !== 'string' || !asset.url || String(asset.tipo) === 'video') return null;
  const gallery = asset as GaleriaFoto;
  return {
    id: asset.id,
    eventId: asset.eventoId,
    url: asset.url,
    tipoFiesta: gallery.tipoFiesta || '',
  };
}

export function rankPromotionalPhotos(
  photos: FotoPromocionalElegible[],
  tipoEvento: string,
  invitados: number,
  salon: string,
  limit = 3,
): FotoPromocionalElegible[] {
  return [...photos]
    .filter(photo => tiposEquivalentes(tipoEvento).includes(normalize(photo.tipoFiesta)))
    .sort((a, b) => {
      const venueA = normalize(a.salon || '') === normalize(salon) ? 1 : 0;
      const venueB = normalize(b.salon || '') === normalize(salon) ? 1 : 0;
      if (venueA !== venueB) return venueB - venueA;
      const distanceA = a.invitados === undefined ? Number.POSITIVE_INFINITY : Math.abs(a.invitados - invitados);
      const distanceB = b.invitados === undefined ? Number.POSITIVE_INFINITY : Math.abs(b.invitados - invitados);
      return distanceA - distanceB
        || a.id.localeCompare(b.id);
    })
    .slice(0, Math.max(0, limit));
}

async function loadConsentMap(): Promise<ConsentMap> {
  return readData<ConsentMap>(CONSENTS_FILE, {});
}

async function listPhotos(consents: ConsentMap): Promise<FotoPromocionalElegible[]> {
  const [gallery, events] = await Promise.all([
    readData<GaleriaData>('galeria-publica.json', { fotos: [], videos: [] }),
    readData<FiestaEnPlanificacion[]>('fiestas.json', []),
  ]);
  const authorizedEvents = (Array.isArray(events) ? events : []).filter(event =>
    hasCurrentPhotoConsent(consents[event.id], event.id));
  const publicAlbums = await Promise.all(authorizedEvents.map(async event => {
    const posts = await getPublicSocialPosts(event.id);
    return posts
      .filter((post: SocialGalleryPost) => post.mediaType !== 'video')
      .map((post: SocialGalleryPost) => ({
        id: post.id,
        eventId: event.id,
        url: post.imageUrl,
        tipoFiesta: event.configuracion?.tipoCelebracion || '',
        invitados: event.configuracion?.invitadosEstimados,
        salon: event.configuracion?.nombreLugar,
      }));
  }));
  const galleryPhotos = (Array.isArray(gallery?.fotos) ? gallery.fotos : [])
    .map(toPhoto)
    .filter((photo): photo is FotoPromocionalElegible => photo !== null);
  const unique = new Map<string, FotoPromocionalElegible>();
  [...galleryPhotos, ...publicAlbums.flat()].forEach(photo => unique.set(photo.id, photo));
  return Array.from(unique.values());
}

export async function fotosDeFiestasParecidas(
  tipoEvento: string,
  invitados: number,
  salon: string,
  limit = 3,
): Promise<FotoPromocionalElegible[]> {
  const consents = await loadConsentMap();
  const photos = await listPhotos(consents);
  return rankPromotionalPhotos(photos.filter(photo => {
    const consent = consents[photo.eventId];
    return hasCurrentPhotoConsent(consent, photo.eventId);
  }), tipoEvento, invitados, salon, limit);
}

export async function fotosPromocionalesDeFiesta(eventId: string): Promise<FotoPromocionalElegible[]> {
  if (!eventId) return [];
  const consents = await loadConsentMap();
  if (!hasCurrentPhotoConsent(consents[eventId], eventId)) return [];
  const photos = await listPhotos(consents);
  return photos
    .filter((photo) => photo.eventId === eventId && hasCurrentPhotoConsent(consents[photo.eventId], eventId))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function validarFotosPromocionalesAlEnviar(photoIds: string[]): Promise<{
  allowed: boolean;
  authorizedPhotoIds: string[];
}> {
  const consents = await loadConsentMap();
  const photos = await listPhotos(consents);
  const currentById = new Map(photos.map(photo => [photo.id, photo]));
  const authorizedPhotoIds = photoIds.filter(id => {
    const photo = currentById.get(id);
    return Boolean(photo && hasCurrentPhotoConsent(consents[photo.eventId], photo.eventId));
  });
  return { allowed: authorizedPhotoIds.length === photoIds.length, authorizedPhotoIds };
}

export async function prepararBorradorProspectoAnuncio(input: DatosProspectoAnuncio): Promise<{
  status: 'draft_created' | 'manual_review' | 'error';
  presupuestoId?: string;
  messageDraftId?: string;
  photoIds: string[];
  reason?: string;
}> {
  const empty = (status: 'manual_review' | 'error', reason: string) => ({ status, photoIds: [], reason });
  try {
    if (!input || typeof input !== 'object') return empty('manual_review', 'Faltan los datos del prospecto.');
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const phone = normalizeUruguayPhone(typeof input.phone === 'string' ? input.phone : '');
    if (name.length < 3 || name.length > 120 || !/^09\d{7}$/.test(phone)) {
      return empty('manual_review', 'Falta un nombre o celular uruguayo válido.');
    }
    if (!Number.isInteger(input.invitados) || input.invitados < 1 || input.invitados > 1000) {
      return empty('manual_review', 'La cantidad de invitados debe estar entre 1 y 1000.');
    }
    if (typeof input.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.fecha)
      || !Number.isFinite(new Date(`${input.fecha}T12:00:00Z`).getTime())
      || new Date(`${input.fecha}T12:00:00Z`).toISOString().slice(0, 10) !== input.fecha) {
      return empty('manual_review', 'La fecha del evento no es válida.');
    }
    if (typeof input.salon !== 'string' || !input.salon.trim() || input.salon.trim().length > 120) {
      return empty('manual_review', 'Falta un salón o zona de evento válido.');
    }
    if (typeof input.tipoEvento !== 'string' || !ALL_TIPOS_EVENTO.some(type => normalize(type) === normalize(input.tipoEvento))) {
      return empty('manual_review', 'El tipo de evento no está reconocido.');
    }
    const requestId = createHash('sha256')
      .update(typeof input.requestId === 'string' && input.requestId.trim()
        ? 'request:' + input.requestId.trim()
        : [phone, name.toLowerCase(), input.fecha, input.invitados, input.salon.trim(), input.tipoEvento].join('|'))
      .digest('hex');
    const [storedConfig, catalog, menus, photos] = await Promise.all([
      readData<ArmadoRapidoConfig>('armado-rapido-config.json', {
        paquetes: [], menus: [], platosVisibles: [], serviceDependencies: [], mostrarPrecios: true,
        clubUruguayConfig: defaultClubUruguayConfig,
      }),
      readData<ServicioEmpresa[]>('servicios-empresa.json', []),
      readData<FullMenu[]>('menus-catering.json', []),
      fotosDeFiestasParecidas(input.tipoEvento, input.invitados, input.salon, 3),
    ]);
    const config = storedConfig;
    const services = buildAuthoritativeSimulatorServices(catalog, menus);
    const applicable = (config.paquetes || []).find(pkg =>
      pkg.serviciosIncluidos?.length
      && (pkg.tiposDeEventoAplicables || []).some(type => tiposEquivalentes(input.tipoEvento).includes(normalize(type)))
      && getRemovablePackageServices(pkg, services, config).length > 0
    );
    if (!applicable) return empty('manual_review', 'No hay un paquete vigente con servicios y precios configurados para este tipo de fiesta.');
    const selectedIds = applicable.serviciosIncluidos.map(item => item.id)
      .filter(id => services.some(service => service.id === id));
    if (!selectedIds.length) return empty('manual_review', 'El paquete no tiene servicios valorables en el catálogo vigente.');

    const data: LeadFromQuickBudget = {
      submissionId: requestId,
      clienteNombre: name,
      clienteContacto: phone,
      eventoFecha: input.fecha,
      adultos: input.invitados,
      adolescentes: 0,
      ninos: 0,
      subtotal: 0,
      costoEstimado: 0,
      serviciosIncluidos: selectedIds,
      selectedServiceIds: selectedIds,
      paqueteId: applicable.id,
    };
    const budget = await persistPublicSimulatorBudget(data, {
      source: 'simulator_assistant',
      eventoTipo: input.tipoEvento,
      salonFiestas: input.salon,
      estadoInicial: 'Borrador',
      requirePositiveTotal: true,
    });

    const revalidated = await validarFotosPromocionalesAlEnviar(photos.map(photo => photo.id));
    const approvedPhotos = photos.filter(photo => revalidated.authorizedPhotoIds.includes(photo.id));
    const photoText = approvedPhotos.length
      ? '\nFotos de eventos similares autorizadas:\n' + approvedPhotos.map(photo => photo.url).join('\n')
      : '';
    const messageText = 'Hola ' + name + ', preparamos un borrador de presupuesto para '
      + input.tipoEvento + ' de ' + input.invitados + ' invitados en ' + input.salon
      + '. El equipo debe revisar el importe antes de enviarlo.' + photoText;
    const result = await saveScheduledMessage({
      channel: 'whatsapp',
      targetType: 'prospecto',
      targetId: phone,
      targetPhone: phone,
      targetName: name,
      templateType: 'personalizado',
      messageText,
      scheduledAt: new Date().toISOString(),
      status: 'pendiente',
      sendingMode: 'manual_click',
      promotionalPhotoIds: approvedPhotos.map(photo => photo.id),
      presupuestoId: budget.presupuesto.id,
    }, WHATSAPP_AUTOMATION_INTERNAL_TOKEN, {
      idEstable: 'draft_presupuesto_anuncio_' + requestId,
    });
    if (!result.success || !result.message) {
      return { status: 'error', presupuestoId: budget.presupuesto.id, photoIds: approvedPhotos.map(photo => photo.id), reason: result.error || 'No se pudo guardar el mensaje pendiente.' };
    }
    return {
      status: 'draft_created',
      presupuestoId: budget.presupuesto.id,
      messageDraftId: result.message.id,
      photoIds: approvedPhotos.map(photo => photo.id),
      ...(approvedPhotos.length < 3 ? { reason: `Solo hay ${approvedPhotos.length} fotos aprobadas con autorización vigente; faltan ${3 - approvedPhotos.length} para completar la selección.` } : {}),
    };
  } catch (error) {
    return empty('error', error instanceof Error ? error.message : 'No se pudo preparar el borrador.');
  }
}
