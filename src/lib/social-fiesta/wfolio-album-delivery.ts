export type AlbumDeliveryStatus = 'pendiente' | 'muro_descargable' | 'descargado_por_ak' | 'subiendo_wfolio' | 'entregado_cliente' | 'vence_pronto' | 'vencido' | 'temporales_borrados';

export type TemporaryMediaStatus = 'activo' | 'listo_para_descargar' | 'descargado' | 'borrado';

export type WfolioAlbumDelivery = {
  fiestaId: string;
  clientName?: string;
  eventName: string;
  status: AlbumDeliveryStatus;
  wfolioUrl?: string;
  password?: string;
  coverImageUrl?: string;
  expiresAt?: string;
  deliveredAt?: string;
  estimatedPhotoCount?: number;
  folders?: string[];
  notes?: string;
};

export type TemporarySocialMediaBatch = {
  fiestaId: string;
  status: TemporaryMediaStatus;
  mediaCount: number;
  totalSizeMb?: number;
  createdAt: string;
  downloadedAt?: string;
  deleteAfter?: string;
  deletedAt?: string;
};

export type AlbumDeliveryChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  warning?: string;
};

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export function isValidWfolioUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('wfolio.com') || parsed.hostname.includes('wfolio.pro');
  } catch {
    return false;
  }
}

export function buildWfolioDelivery(input: {
  fiestaId: string;
  eventName: string;
  clientName?: string;
  wfolioUrl?: string;
  password?: string;
  coverImageUrl?: string;
  expiresAt?: string;
  estimatedPhotoCount?: number;
  folders?: string[];
  notes?: string;
}): WfolioAlbumDelivery {
  const hasAlbum = isValidWfolioUrl(input.wfolioUrl);
  return {
    fiestaId: input.fiestaId,
    eventName: input.eventName,
    clientName: input.clientName,
    status: hasAlbum ? 'entregado_cliente' : 'pendiente',
    wfolioUrl: input.wfolioUrl,
    password: input.password,
    coverImageUrl: input.coverImageUrl,
    expiresAt: input.expiresAt,
    deliveredAt: hasAlbum ? new Date().toISOString() : undefined,
    estimatedPhotoCount: input.estimatedPhotoCount,
    folders: input.folders ?? [],
    notes: input.notes,
  };
}

export function getAlbumDeliveryStatus(input: { delivery: WfolioAlbumDelivery; now?: string }): AlbumDeliveryStatus {
  const now = parseDate(input.now) ?? new Date();
  const expiry = parseDate(input.delivery.expiresAt);

  if (!input.delivery.wfolioUrl) return input.delivery.status;
  if (!isValidWfolioUrl(input.delivery.wfolioUrl)) return 'pendiente';
  if (!expiry) return input.delivery.status;

  const daysLeft = daysBetween(now, expiry);
  if (daysLeft < 0) return 'vencido';
  if (daysLeft <= 15) return 'vence_pronto';
  return input.delivery.status;
}

export function buildTemporaryMediaBatch(input: {
  fiestaId: string;
  mediaCount: number;
  totalSizeMb?: number;
  createdAt?: string;
  retentionDays?: number;
}): TemporarySocialMediaBatch {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const created = parseDate(createdAt) ?? new Date();
  const deleteAfter = new Date(created.getTime());
  deleteAfter.setDate(deleteAfter.getDate() + (input.retentionDays ?? 30));

  return {
    fiestaId: input.fiestaId,
    status: input.mediaCount > 0 ? 'listo_para_descargar' : 'activo',
    mediaCount: input.mediaCount,
    totalSizeMb: input.totalSizeMb,
    createdAt,
    deleteAfter: deleteAfter.toISOString(),
  };
}

export function markTemporaryMediaDownloaded(batch: TemporarySocialMediaBatch, now = new Date().toISOString()): TemporarySocialMediaBatch {
  return { ...batch, status: 'descargado', downloadedAt: now };
}

export function markTemporaryMediaDeleted(batch: TemporarySocialMediaBatch, now = new Date().toISOString()): TemporarySocialMediaBatch {
  return { ...batch, status: 'borrado', deletedAt: now };
}

export function buildAlbumDeliveryChecklist(input: {
  delivery: WfolioAlbumDelivery;
  temporaryBatch?: TemporarySocialMediaBatch;
}): AlbumDeliveryChecklistItem[] {
  const batch = input.temporaryBatch;
  return [
    {
      id: 'download_social_wall',
      label: 'Descargar fotos/videos del muro social antes de borrar temporales',
      done: batch?.status === 'descargado' || batch?.status === 'borrado',
      warning: batch && batch.status !== 'descargado' && batch.status !== 'borrado' ? 'Todavía hay archivos temporales pendientes de descarga.' : undefined,
    },
    {
      id: 'upload_wfolio',
      label: 'Subir fotos profesionales y seleccionadas a Wfolio',
      done: isValidWfolioUrl(input.delivery.wfolioUrl),
    },
    {
      id: 'add_password_expiry',
      label: 'Cargar contraseña y vencimiento si aplica',
      done: Boolean(input.delivery.password || input.delivery.expiresAt),
    },
    {
      id: 'deliver_to_client',
      label: 'Mostrar álbum final en el Portal Cliente VIP',
      done: input.delivery.status === 'entregado_cliente' || Boolean(input.delivery.deliveredAt),
    },
    {
      id: 'delete_temporaries',
      label: 'Borrar temporales de Firebase/Storage después de descargar',
      done: batch?.status === 'borrado',
      warning: batch?.status === 'descargado' ? 'Ya fue descargado. Falta borrar temporales para ahorrar costos.' : undefined,
    },
  ];
}

export function buildClientAlbumDeliveryMessage(input: {
  delivery: WfolioAlbumDelivery;
  includeDownloadWarning?: boolean;
}): string {
  const lines = [
    `Hola${input.delivery.clientName ? ` ${input.delivery.clientName}` : ''}, ya está disponible el álbum digital de ${input.delivery.eventName}.`,
    input.delivery.wfolioUrl ? `Link: ${input.delivery.wfolioUrl}` : undefined,
    input.delivery.password ? `Contraseña: ${input.delivery.password}` : undefined,
    input.delivery.expiresAt ? `Disponible hasta: ${new Date(input.delivery.expiresAt).toLocaleDateString('es-UY')}` : undefined,
    input.includeDownloadWarning !== false ? 'Te recomendamos descargar las fotos y guardarlas para conservarlas.' : undefined,
    'Gracias por confiar en AK Producciones.',
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildPortalAlbumCard(input: { delivery: WfolioAlbumDelivery; now?: string }) {
  const status = getAlbumDeliveryStatus(input);
  return {
    title: status === 'pendiente' ? 'Tus fotos estarán disponibles pronto' : 'Tus recuerdos ya están listos',
    subtitle: status === 'vence_pronto'
      ? 'El álbum vence pronto. Recomendamos descargarlo cuanto antes.'
      : status === 'vencido'
        ? 'El álbum figura como vencido. Consultá con AK Producciones.'
        : 'Entrá al álbum digital, mirá tus fotos y descargalas para conservarlas.',
    buttonLabel: input.delivery.wfolioUrl ? 'Abrir álbum digital' : 'Álbum pendiente',
    href: input.delivery.wfolioUrl ?? '#',
    status,
    showPassword: Boolean(input.delivery.password),
    password: input.delivery.password,
    coverImageUrl: input.delivery.coverImageUrl,
  };
}
