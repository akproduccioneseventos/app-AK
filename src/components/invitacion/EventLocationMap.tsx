'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventLocationMapProps {
  address?: string;
  venueName?: string;
  mapsUrl?: string;
  primaryColor?: string;
  showEmbed?: boolean;
}

function safeExternalUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function getEventMapLinks(input: Pick<EventLocationMapProps, 'address' | 'venueName' | 'mapsUrl'>) {
  const query = input.address?.trim() || input.venueName?.trim() || '';
  const configuredUrl = safeExternalUrl(input.mapsUrl);
  return {
    embedUrl: query ? `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : undefined,
    directionsUrl: configuredUrl || (query
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      : undefined),
  };
}

export function EventLocationMap({
  address,
  venueName,
  mapsUrl,
  primaryColor = '#c81e2a',
  showEmbed = true,
}: EventLocationMapProps) {
  const [mapVisible, setMapVisible] = useState(false);
  const { embedUrl, directionsUrl } = getEventMapLinks({ address, venueName, mapsUrl });
  if (!directionsUrl) return null;

  return (
    <div className="space-y-3">
      {showEmbed && embedUrl && !mapVisible && (
        <Button type="button" variant="outline" className="h-12 w-full rounded-xl" onClick={() => setMapVisible(true)}>
          <MapPin className="mr-2 h-4 w-4" />
          Ver mapa
        </Button>
      )}
      {showEmbed && embedUrl && mapVisible && (
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
            <iframe
              src={embedUrl}
              title={`Mapa de ${venueName || address || 'la ubicacion del evento'}`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}
      <Button asChild className="h-12 w-full rounded-xl font-bold text-white" style={{ backgroundColor: primaryColor }}>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
          <MapPin className="mr-2 h-4 w-4" />
          Como llegar
        </a>
      </Button>
    </div>
  );
}
