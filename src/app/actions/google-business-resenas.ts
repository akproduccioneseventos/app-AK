'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { readData } from '@/lib/data-service';
import type { SocialConnection } from '@/types/settings';
import type { GoogleWorkspaceAccount } from '@/types/google-workspace';
import {
  getGoogleBusinessReviews,
  replyToGoogleBusinessReview,
  type GoogleReviewsResult,
  type PublishReplyResult,
} from '@/lib/social-media/google-business-resenas';

async function obtenerCredencialesGoogleBusiness(): Promise<{
  accessToken?: string;
  accountLocationId?: string;
}> {
  // 1. Revisar conexiones sociales guardadas
  const connections = await readData<SocialConnection[]>('social-connections.json', []);
  const googleConn = connections.find((c) => c.platform === 'Google' && c.isConnected);
  if (googleConn?.accessToken && googleConn?.locationId) {
    return {
      accessToken: googleConn.accessToken,
      accountLocationId: googleConn.locationId,
    };
  }

  // 2. Revisar cuentas de Google Workspace de la empresa
  const accounts = await readData<GoogleWorkspaceAccount[]>('_google-workspace-accounts.json', []);
  const company = accounts.find((a) => a.kind === 'company' && a.status === 'connected');
  if (company?.accessToken) {
    const locId = process.env.GOOGLE_BUSINESS_LOCATION_ID || 'accounts/me/locations/primary';
    return {
      accessToken: company.accessToken,
      accountLocationId: locId,
    };
  }

  return {};
}

export async function cargarResenasGoogleAction(): Promise<GoogleReviewsResult> {
  await requireAppSession();

  const { accessToken, accountLocationId } = await obtenerCredencialesGoogleBusiness();
  if (!accessToken || !accountLocationId) {
    return {
      success: false,
      reviews: [],
      errorCriollo: 'Google no tiene habilitado el acceso a las reseñas con esta cuenta conectada. Verificá los permisos de Google Business en Ajustes.',
      error: 'Sin credenciales de Google Business configuradas.',
    };
  }

  return getGoogleBusinessReviews({ accessToken, accountLocationId });
}

export async function publicarRespuestaResenaAction(
  reviewId: string,
  comment: string,
): Promise<PublishReplyResult> {
  await requireAppSession();

  const { accessToken, accountLocationId } = await obtenerCredencialesGoogleBusiness();
  if (!accessToken || !accountLocationId) {
    return {
      success: false,
      errorCriollo: 'No se encontraron las credenciales de Google conectadas para publicar.',
      error: 'Sin credenciales de Google.',
    };
  }

  return replyToGoogleBusinessReview({
    accessToken,
    accountLocationId,
    reviewId,
    comment,
  });
}
