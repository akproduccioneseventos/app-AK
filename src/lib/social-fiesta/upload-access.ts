import type { EntertainmentModuleId } from '@/lib/entertainment/station-config';

export interface SocialUploadAccess {
  authorName: string;
  source: string;
  sourceModule?: EntertainmentModuleId;
  rateIdentity: string;
  sharedStation: boolean;
}

interface ResolveSocialUploadAccessInput {
  fiestaId: string;
  submittedAuthorName: string;
  submittedSource?: string;
  submittedSourceModule?: string;
  appSession: boolean;
  guest?: { id: string; nombre: string };
  guestAuthorized: boolean;
  stationModuleId?: EntertainmentModuleId;
  stationAuthorized: boolean;
}

export function resolveSocialUploadAccess(
  input: ResolveSocialUploadAccessInput,
): SocialUploadAccess | null {
  const submittedName = input.submittedAuthorName.trim() || 'Invitado';

  if (input.appSession) {
    return {
      authorName: submittedName,
      source: input.submittedSource?.trim() || 'guest',
      sourceModule: input.stationModuleId,
      rateIdentity: `${input.fiestaId}|staff`,
      sharedStation: Boolean(input.stationModuleId),
    };
  }

  if (input.guestAuthorized && input.guest) {
    return {
      authorName: input.guest.nombre.trim() || 'Invitado',
      source: 'guest',
      rateIdentity: `${input.fiestaId}|guest:${input.guest.id}`,
      sharedStation: false,
    };
  }

  if (input.stationAuthorized && input.stationModuleId) {
    return {
      authorName: submittedName,
      source: 'entertainment',
      sourceModule: input.stationModuleId,
      rateIdentity: `${input.fiestaId}|station:${input.stationModuleId}`,
      sharedStation: true,
    };
  }

  return null;
}
