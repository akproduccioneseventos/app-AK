'use client';

import { useEffect, useState } from 'react';
import { Loader2, Music2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { SpotifyTrackSuggestion } from '@/types/spotify';

interface SpotifySongSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SpotifySongSearch({ value, onChange }: SpotifySongSearchProps) {
  const [tracks, setTracks] = useState<SpotifyTrackSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [spotifyAvailable, setSpotifyAvailable] = useState(true);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || !spotifyAvailable) {
      setTracks([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/integrations/spotify/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (response.status === 503) {
          setSpotifyAvailable(false);
          setTracks([]);
          return;
        }
        const payload = await response.json() as { tracks?: SpotifyTrackSuggestion[] };
        setTracks(response.ok ? payload.tracks || [] : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setTracks([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [spotifyAvailable, value]);

  const chooseTrack = (track: SpotifyTrackSuggestion) => {
    onChange(`${track.title} - ${track.artist}`);
    setTracks([]);
  };

  return (
    <div className="relative min-w-0 flex-1">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={120}
        placeholder="Cancion y artista"
        className="h-12 bg-white pr-10 text-slate-950"
        autoComplete="off"
        aria-label="Buscar cancion para el DJ"
        aria-expanded={tracks.length > 0}
      />
      {loading && <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-slate-400" />}
      {tracks.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl">
          {tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => chooseTrack(track)}
              className="flex min-h-14 w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-slate-50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <Music2 className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">{track.title}</span>
                <span className="block truncate text-xs text-slate-500">{track.artist}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
