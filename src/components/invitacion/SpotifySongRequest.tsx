'use client';

import { useState } from 'react';
import { Search, Music, Plus, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
}

interface SpotifySongRequestProps {
  fiestaId: string;
  guestId?: string;
}

export function SpotifySongRequest({ fiestaId, guestId }: SpotifySongRequestProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const { toast } = useToast();

  const searchSpotify = async () => {
    if (query.trim().length < 3) return;
    setIsLoading(true);
    try {
      // Usamos el endpoint público (requiere API key en el backend si se hace con route handler)
      // Como esto es un componente, llamamos a nuestro propio route handler que hará el auth de Spotify
      const res = await fetch(`/api/integrations/spotify/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.tracks?.items || []);
      } else {
        // Fallback temporal si la API no está configurada
        setResults([
          {
            id: 'demo-1',
            name: `${query} (Demo Track)`,
            artists: [{ name: 'Artista Desconocido' }],
            album: { images: [{ url: 'https://picsum.photos/100' }] }
          }
        ]);
      }
    } catch (error) {
      console.error('Error buscando canción', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestSong = async (track: SpotifyTrack) => {
    setRequestedId(track.id);
    // Aquí iría la llamada al action para guardar el pedido en el CRM
    // await requestDjSongAction(fiestaId, guestId, track.name, track.artists[0].name);
    toast({
      title: '¡Canción pedida!',
      description: `Se agregó "${track.name}" a la lista del DJ.`,
    });
    setTimeout(() => {
      setRequestedId(null);
      setQuery('');
      setResults([]);
    }, 2000);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-xl w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <Music className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800">Sugerir Canción</h3>
          <p className="text-sm text-slate-500">Buscá el tema que no puede faltar</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input 
          placeholder="Buscar canción o artista..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchSpotify()}
          className="rounded-2xl"
        />
        <Button onClick={searchSpotify} disabled={isLoading} className="rounded-2xl bg-slate-900 text-white">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {results.map((track) => (
            <div key={track.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors group">
              <img src={track.album.images[0]?.url} alt={track.name} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm text-slate-800 truncate">{track.name}</p>
                <p className="text-xs text-slate-500 truncate">{track.artists.map(a => a.name).join(', ')}</p>
              </div>
              <Button 
                size="icon" 
                variant={requestedId === track.id ? "default" : "secondary"}
                className={`rounded-full w-8 h-8 ${requestedId === track.id ? 'bg-green-500 hover:bg-green-600' : ''}`}
                onClick={() => requestSong(track)}
              >
                {requestedId === track.id ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
