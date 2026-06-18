import { XMLParser } from 'fast-xml-parser';
import type { GaleriaVideo } from '@/types/galeria';

export const AK_YOUTUBE_CHANNEL_ID = 'UClq6YnypA9PFuBgunzk306A';
export const AK_YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@akproduccionesfiestasyeventos';

type YoutubeFeedEntry = {
  'yt:videoId'?: string;
  title?: string;
  published?: string;
};

type YoutubeFeed = {
  feed?: {
    entry?: YoutubeFeedEntry | YoutubeFeedEntry[];
  };
};

const CURATED_VIDEOS: Array<Pick<GaleriaVideo, 'youtubeId' | 'titulo' | 'categoria' | 'destacada'>> = [
  {
    youtubeId: 'f0o5FIRS_wo',
    titulo: 'Testimonios de clientes satisfechos',
    categoria: 'Testimonios reales',
    destacada: true,
  },
  {
    youtubeId: 'aTnyx6koftc',
    titulo: 'Clientes cuentan su experiencia AK',
    categoria: 'Testimonios reales',
    destacada: true,
  },
  {
    youtubeId: 'hL0Mb5dejIw',
    titulo: 'XV anos Valentino',
    categoria: 'XV Anos',
    destacada: true,
  },
  {
    youtubeId: 'mSWxtkeZffI',
    titulo: 'XV anos de Kiara',
    categoria: 'XV Anos',
    destacada: false,
  },
  {
    youtubeId: 'uF7ndZPPIz4',
    titulo: 'XV anos Belen en Club Uruguay',
    categoria: 'Club Uruguay',
    destacada: false,
  },
  {
    youtubeId: 'tDwgBk326B4',
    titulo: 'Aniversario de empresa',
    categoria: 'Empresariales',
    destacada: false,
  },
];

function inferCategory(title: string): string {
  const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('testimonio')) return 'Testimonios reales';
  if (normalized.includes('xv') || normalized.includes('15 ano')) return 'XV Anos';
  if (normalized.includes('boda')) return 'Bodas';
  if (normalized.includes('empresa') || normalized.includes('corporativo')) return 'Empresariales';
  if (normalized.includes('club uruguay')) return 'Club Uruguay';
  if (normalized.includes('cumple') || normalized.includes('1 ano')) return 'Cumpleanos';
  return 'Experiencias AK';
}

function toGaleriaVideo(
  videoId: string,
  title: string,
  published: string,
  order: number,
  featured = false,
  category?: string
): GaleriaVideo {
  return {
    id: `youtube_ak_${videoId}`,
    tipo: 'video',
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    youtubeId: videoId,
    plataforma: 'youtube',
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    titulo: title,
    descripcion: 'Video real del canal oficial de AK Producciones Eventos.',
    categoria: category || inferCategory(title),
    destacada: featured,
    orden: order,
    createdAt: published || new Date(0).toISOString(),
  };
}

export function parseAkYoutubeFeed(xml: string): GaleriaVideo[] {
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml) as YoutubeFeed;
  const rawEntries = parsed.feed?.entry;
  const entries = rawEntries ? (Array.isArray(rawEntries) ? rawEntries : [rawEntries]) : [];

  return entries
    .map((entry, index) => {
      const videoId = entry['yt:videoId']?.trim();
      const title = entry.title?.trim();
      if (!videoId || !title) return null;
      return toGaleriaVideo(videoId, title, entry.published || '', index + CURATED_VIDEOS.length);
    })
    .filter((video): video is GaleriaVideo => Boolean(video));
}

export function getCuratedAkYoutubeVideos(): GaleriaVideo[] {
  return CURATED_VIDEOS.map((video, index) =>
    toGaleriaVideo(
      video.youtubeId,
      video.titulo,
      new Date(0).toISOString(),
      index,
      video.destacada,
      video.categoria
    )
  );
}

export async function getAkYoutubeVideos(): Promise<GaleriaVideo[]> {
  const curated = getCuratedAkYoutubeVideos();
  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${AK_YOUTUBE_CHANNEL_ID}`,
      { next: { revalidate: 21600 } }
    );
    if (!response.ok) return curated;

    const feedVideos = parseAkYoutubeFeed(await response.text());
    const seen = new Set(curated.map((video) => video.youtubeId));
    return [
      ...curated,
      ...feedVideos.filter((video) => !seen.has(video.youtubeId)),
    ].slice(0, 12);
  } catch {
    return curated;
  }
}
