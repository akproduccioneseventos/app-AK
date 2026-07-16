"use server";

import { getFiestaById } from "@/app/actions/fiesta/fiesta.actions";
import {
  buildPublicGuestEvent,
  buildPublicGuestPortalData,
  type PublicGuestEvent,
  type PublicGuestPortalData,
} from "@/lib/guest-portal-public-data";

export async function getPublicGuestEvent(
  fiestaId: string,
): Promise<PublicGuestEvent | null> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta ? buildPublicGuestEvent(fiesta) : null;
}

export async function getPublicGuestPortalData(
  fiestaId: string,
  guestId: string,
): Promise<PublicGuestPortalData | null> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta ? buildPublicGuestPortalData(fiesta, guestId) : null;
}
