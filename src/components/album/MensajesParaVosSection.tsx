'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Video, Play, Square, SkipForward, Lock, KeyRound } from 'lucide-react';
import { getClientGuestbookMessages } from '@/app/actions/social-interactive';
import type { GuestbookMessage } from '@/lib/social-fiesta/libro-de-firmas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MensajesParaVosSectionProps {
  fiestaId: string;
  initialAccessKey?: string;
  variant?: 'dark' | 'light';
}

export function MensajesParaVosSection({
  fiestaId,
  initialAccessKey,
  variant = 'dark',
}: MensajesParaVosSectionProps) {
  const [accessKey, setAccessKey] = useState(initialAccessKey || '');
  const [keyInput, setKeyInput] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const mediaRefs = useRef<Array<HTMLMediaElement | null>>([]);

  const loadMessages = useCallback(async (keyToUse?: string) => {
    setLoading(true);
    try {
      const res = await getClientGuestbookMessages(fiestaId, keyToUse || undefined);
      setAuthorized(res.authorized);
      setMessages(res.messages || []);
    } catch {
      setAuthorized(false);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    let key = initialAccessKey || '';
    if (!key && typeof window !== 'undefined') {
      const qs = new URLSearchParams(window.location.search);
      key = qs.get('accessKey') || qs.get('key') || sessionStorage.getItem(`portal_auth_${fiestaId}`) || '';
    }
    setAccessKey(key);
    void loadMessages(key);
  }, [fiestaId, initialAccessKey, loadMessages]);

  const playIndex = (idx: number) => {
    if (idx < 0 || idx >= messages.length) {
      setPlayingIdx(null);
      return;
    }
    mediaRefs.current.forEach((el, i) => {
      if (el && i !== idx) {
        el.pause();
        el.currentTime = 0;
      }
    });
    setPlayingIdx(idx);
    const target = mediaRefs.current[idx];
    if (target) {
      void target.play().catch(() => undefined);
    }
  };

  const stopSequential = () => {
    mediaRefs.current.forEach((el) => {
      if (el) el.pause();
    });
    setPlayingIdx(null);
  };

  const isLight = variant === 'light';

  if (loading) return null;

  if (!authorized) {
    return (
      <section
        className={`rounded-3xl border p-6 space-y-3 ${
          isLight
            ? 'border-purple-100 bg-white text-slate-900 shadow-sm'
            : 'border-white/10 bg-zinc-900/70 text-white'
        }`}
        data-testid="mensajes-para-vos-section"
      >
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-black">Mensajes para vos</h3>
        </div>
        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
          Los mensajes privados del libro de firmas solo se abren con la clave del cliente.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!keyInput.trim()) return;
            setAccessKey(keyInput.trim());
            void loadMessages(keyInput.trim());
          }}
          className="flex gap-2 max-w-sm"
        >
          <Input
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Clave de acceso del cliente"
            className={isLight ? 'bg-slate-50 text-slate-900' : 'bg-zinc-950 border-white/15 text-white'}
          />
          <Button type="submit" size="sm" className="font-bold">
            <KeyRound className="w-4 h-4 mr-1" /> Abrir
          </Button>
        </form>
      </section>
    );
  }

  if (messages.length === 0) return null;

  return (
    <section
      className={`rounded-3xl border p-6 space-y-4 ${
        isLight
          ? 'border-purple-200 bg-white text-slate-900 shadow-sm'
          : 'border-amber-500/25 bg-zinc-900/75 text-white'
      }`}
      data-testid="mensajes-para-vos-section"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
            Libro de firmas privado
          </span>
          <h3 className="text-xl font-black">Mensajes para vos ({messages.length})</h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
            Saludos en audio y video dejados solo para ustedes, en orden de llegada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {playingIdx !== null ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => playIndex(playingIdx + 1)}
                disabled={playingIdx >= messages.length - 1}
                className="rounded-full font-bold text-xs"
              >
                <SkipForward className="w-3.5 h-3.5 mr-1" /> Siguiente
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={stopSequential}
                className="rounded-full font-bold text-xs"
              >
                <Square className="w-3.5 h-3.5 mr-1 fill-current" /> Detener
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => playIndex(0)}
              className="rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Reproducir todos en orden
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {messages.map((msg, idx) => {
          const active = playingIdx === idx;
          return (
            <article
              key={msg.id}
              className={`rounded-2xl border p-4 space-y-3 transition ${
                active
                  ? 'border-amber-400 ring-2 ring-amber-400/30'
                  : isLight
                  ? 'border-slate-200 bg-slate-50/70'
                  : 'border-white/10 bg-zinc-950/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-400/20 text-amber-400 text-xs font-black">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-bold truncate">{msg.authorName}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-400">
                  {msg.mediaType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {msg.mediaType === 'video' ? 'Video' : 'Audio'}
                </span>
              </div>

              {msg.message && (
                <p className={`text-xs italic ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>
                  &quot;{msg.message}&quot;
                </p>
              )}

              {msg.mediaType === 'video' ? (
                <video
                  ref={(el) => {
                    mediaRefs.current[idx] = el;
                  }}
                  src={msg.mediaUrl}
                  controls
                  playsInline
                  onEnded={() => {
                    if (playingIdx === idx && idx + 1 < messages.length) {
                      playIndex(idx + 1);
                    } else if (playingIdx === idx) {
                      setPlayingIdx(null);
                    }
                  }}
                  className="w-full rounded-xl bg-black aspect-video object-cover"
                />
              ) : (
                <audio
                  ref={(el) => {
                    mediaRefs.current[idx] = el;
                  }}
                  src={msg.mediaUrl}
                  controls
                  onEnded={() => {
                    if (playingIdx === idx && idx + 1 < messages.length) {
                      playIndex(idx + 1);
                    } else if (playingIdx === idx) {
                      setPlayingIdx(null);
                    }
                  }}
                  className="w-full h-10"
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
