import type { PublicGuestEvent } from "@/lib/guest-portal-public-data";

export type PublicEventToolId = "social" | "gallery" | "songs" | "bar" | "games";

export interface PublicEventTool {
  id: PublicEventToolId;
  label: string;
  description: string;
  href: string;
}

interface BuildPublicEventToolsInput {
  fiestaId: string;
  guestId: string;
  guestAccessToken: string;
  event: PublicGuestEvent;
  photoCount: number;
}

export function buildGuestAccessQuery(guestId: string, guestAccessToken: string): string {
  const params = new URLSearchParams();
  if (guestId) params.set("guestId", guestId);
  if (guestAccessToken) params.set("token", guestAccessToken);
  return params.toString();
}

export function withGuestAccess(
  path: string,
  guestId: string,
  guestAccessToken: string,
): string {
  const query = buildGuestAccessQuery(guestId, guestAccessToken);
  if (!query) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

export function normalizePublicEventAccent(value?: string): string {
  const candidate = value?.trim();
  return candidate && /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : "#b91c1c";
}

export function buildPublicEventTools({
  fiestaId,
  guestId,
  guestAccessToken,
  event,
  photoCount,
}: BuildPublicEventToolsInput): PublicEventTool[] {
  const modules = event.modulosContratados;
  const portal = event.guestPortalSettings;
  const experience = event.guestExperienceSettings;
  const tools: PublicEventTool[] = [];
  const eventPath = (slug: string) => `/evento/${slug}/${encodeURIComponent(fiestaId)}`;
  const accessiblePath = (slug: string) =>
    withGuestAccess(eventPath(slug), guestId, guestAccessToken);

  const socialEnabled = portal?.showMural !== false
    && (!modules || (modules.redSocial ?? modules.muroSocial) !== false);
  if (socialEnabled) {
    tools.push({
      id: "social",
      label: "Red social",
      description: "Fotos, mensajes y reacciones de esta fiesta.",
      href: accessiblePath("social"),
    });
  }

  const galleryEnabled = portal?.showFotos !== false
    && (!modules || modules.fotografia !== false);
  if (galleryEnabled) {
    tools.push({
      id: "gallery",
      label: "Galería",
      description: photoCount > 0
        ? `${photoCount} recuerdos disponibles.`
        : "Los recuerdos aprobados aparecerán aquí.",
      href: accessiblePath("galeria"),
    });
  }

  const songsEnabled = portal?.showMusica !== false
    && experience?.allowSongSuggestions !== false
    && (!modules || modules.musica !== false);
  if (songsEnabled) {
    tools.push({
      id: "songs",
      label: "Pedir canción",
      description: "Enviá una sugerencia al equipo de música.",
      href: withGuestAccess(`${eventPath("social")}?section=songs`, guestId, guestAccessToken),
    });
  }

  if (modules?.barraTecnologica === true) {
    tools.push({
      id: "bar",
      label: "Carta de tragos",
      description: "Elegí tu trago y seguí el estado del pedido.",
      href: accessiblePath("barra"),
    });
  }

  if (modules?.zonaDigital === true && event.zonaDigitalAdolescentes?.enabled !== false) {
    tools.push({
      id: "games",
      label: "Juegos y retos",
      description: "Participá en las actividades habilitadas para la fiesta.",
      href: accessiblePath("zona-digital"),
    });
  }

  return tools;
}
