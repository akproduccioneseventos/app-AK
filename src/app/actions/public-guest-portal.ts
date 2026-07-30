"use server";

import { getFiestaById } from "@/app/actions/fiesta/fiesta.actions";
import {
  buildPublicGuestEvent,
  buildPublicGuestPortalData,
  type PublicGuestEvent,
  type PublicGuestPortalData,
} from "@/lib/guest-portal-public-data";
import { createEntertainmentAccessToken } from '@/lib/auth/entertainment-token';
import {
  getEntertainmentGuestPath,
  getEntertainmentStationConfig,
  type EntertainmentModuleId,
} from '@/lib/entertainment/station-config';
import { isGuestEntertainmentAvailable } from '@/lib/guest-portal/guest-entertainment';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export interface PublicGuestEntertainmentLink {
  id: EntertainmentModuleId;
  label: string;
  href: string;
}

export interface PublicGuestTableMatch {
  id: string;
  nombre: string;
  tableNumber?: string;
}

export interface PublicLiveDisplayEvent {
  configuracion: Pick<FiestaEnPlanificacion['configuracion'], 'nombreEvento' | 'nombreAgasajado'>;
  screenPlaylist?: FiestaEnPlanificacion['screenPlaylist'];
  socialScreenConfig?: FiestaEnPlanificacion['socialScreenConfig'];
}

const GUEST_ENTERTAINMENT_MODULES: Array<{ id: EntertainmentModuleId; label: string }> = [
  { id: 'fotocabina', label: 'Fotocabina' },
  { id: 'plataforma360', label: 'Plataforma 360' },
  { id: 'espejoMagicoFoto', label: 'Espejo mágico' },
  { id: 'espejoMagicoFirma', label: 'Espejo con firma' },
  { id: 'espejoMagicoIA', label: 'Espejo IA' },
  { id: 'bogue', label: 'Bogue' },
  { id: 'capsulaTiempo', label: 'Buzón de recuerdos' },
];

function buildGuestEntertainmentLinks(
  fiesta: FiestaEnPlanificacion,
): PublicGuestEntertainmentLink[] {
  return GUEST_ENTERTAINMENT_MODULES.flatMap(({ id, label }) => {
    if (!isGuestEntertainmentAvailable(fiesta, id)) return [];

    const station = getEntertainmentStationConfig(fiesta, id);
    if (!station.enabled) return [];

    const token = createEntertainmentAccessToken(fiesta.id, id, 'guest');
    const href = getEntertainmentGuestPath(fiesta.id, id, token);
    return href ? [{ id, label, href }] : [];
  });
}

export async function getPublicGuestEvent(
  fiestaId: string,
): Promise<PublicGuestEvent | null> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta ? buildPublicGuestEvent(fiesta) : null;
}

export async function getPublicGuestPortalData(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string,
): Promise<(PublicGuestPortalData & { entertainmentLinks: PublicGuestEntertainmentLink[] }) | null> {
  if (!guestAccessToken) return null;
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;

  const portalData = buildPublicGuestPortalData(fiesta, guestId, guestAccessToken);
  return portalData
    ? { ...portalData, entertainmentLinks: buildGuestEntertainmentLinks(fiesta) }
    : null;
}

export async function getPublicLiveDisplayEvent(
  fiestaId: string,
): Promise<PublicLiveDisplayEvent | null> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;
  return {
    configuracion: {
      nombreEvento: fiesta.configuracion.nombreEvento,
      nombreAgasajado: fiesta.configuracion.nombreAgasajado,
    },
    screenPlaylist: fiesta.screenPlaylist,
    socialScreenConfig: fiesta.socialScreenConfig,
  };
}

export async function getPublicGuestEntertainmentLinks(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string,
): Promise<PublicGuestEntertainmentLink[]> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta || !buildPublicGuestPortalData(fiesta, guestId, guestAccessToken)) return [];
  return buildGuestEntertainmentLinks(fiesta);
}

function normalizeGuestLookup(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function searchPublicGuestTable(
  fiestaId: string,
  query: string,
): Promise<PublicGuestTableMatch[]> {
  const normalizedQuery = normalizeGuestLookup(query);
  if (normalizedQuery.length < 3) return [];

  await enforcePublicRateLimit({
    scope: 'public-guest-table-search',
    identity: fiestaId,
    limit: 18,
    windowMs: 60_000,
  });

  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return [];

  return (fiesta.invitados || [])
    .filter((guest) => normalizeGuestLookup(guest.nombre).includes(normalizedQuery))
    .slice(0, 6)
    .map((guest) => ({
      id: guest.id,
      nombre: guest.nombre,
      tableNumber: guest.tableNumber,
    }));
}
