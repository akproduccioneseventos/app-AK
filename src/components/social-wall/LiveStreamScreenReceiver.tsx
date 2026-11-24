'use client';

import { useEffect, useRef, useState } from 'react';
import { Radio } from 'lucide-react';
import {
  LIVE_STREAM_MAX_DURATION_SECONDS,
  LIVE_STREAM_STUN_URL,
  shouldDisplayLiveStreamOnScreen,
  type LiveStreamRequest,
} from '@/lib/social-fiesta/transmision-invitado';
import { submitScreenLiveStreamAnswer } from '@/app/actions/social-live-stream';

export function LiveStreamScreenReceiver({
  fiestaId,
  streamRequest,
  screenToken,
}: {
  fiestaId: string;
  streamRequest: LiveStreamRequest;
  screenToken?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const answeredIdRef = useRef<string | null>(null);
  const seenCallerCandidates = useRef<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(LIVE_STREAM_MAX_DURATION_SECONDS);

  useEffect(() => {
    if (!shouldDisplayLiveStreamOnScreen(streamRequest)) return;

    const interval = setInterval(() => {
      if (!streamRequest.acceptedAt) return;
      const elapsed = Math.floor((Date.now() - Date.parse(streamRequest.acceptedAt)) / 1000);
      setSecondsLeft(
        Math.max(0, (streamRequest.maxDurationSeconds || LIVE_STREAM_MAX_DURATION_SECONDS) - elapsed),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [streamRequest]);

  useEffect(() => {
    if (!shouldDisplayLiveStreamOnScreen(streamRequest) || !streamRequest.offerSdp) return;
    if (answeredIdRef.current === streamRequest.id) {
      // Agregar ICE candidates nuevos del celular
      const pc = pcRef.current;
      if (pc) {
        for (const raw of streamRequest.callerCandidates ?? []) {
          if (!seenCallerCandidates.current.has(raw)) {
            seenCallerCandidates.current.add(raw);
            pc.addIceCandidate(new RTCIceCandidate(JSON.parse(raw))).catch(() => undefined);
          }
        }
      }
      return;
    }

    answeredIdRef.current = streamRequest.id;
    seenCallerCandidates.current = new Set();

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: LIVE_STREAM_STUN_URL }],
    });
    pcRef.current = pc;

    const localCandidates: string[] = [];
    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        localCandidates.push(JSON.stringify(ev.candidate.toJSON()));
      }
    };

    pc.ontrack = (ev) => {
      if (videoRef.current && ev.streams[0]) {
        videoRef.current.srcObject = ev.streams[0];
      }
    };

    async function connect() {
      try {
        const offer = JSON.parse(streamRequest.offerSdp!);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        for (const raw of streamRequest.callerCandidates ?? []) {
          seenCallerCandidates.current.add(raw);
          await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(raw))).catch(() => undefined);
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const answerRes = await submitScreenLiveStreamAnswer(
          fiestaId,
          streamRequest.id,
          JSON.stringify(answer),
          localCandidates,
          screenToken,
        );
        if (!answerRes.success) {
          console.warn('[LiveStreamScreenReceiver] No se pudo enviar respuesta WebRTC');
        }
      } catch {
        // Si falla WebRTC en la pantalla, el celular pasa automático a Plan B tras 10s
      }
    }

    void connect();

    return () => {
      pc.close();
      pcRef.current = null;
    };
  }, [fiestaId, streamRequest]);

  if (!shouldDisplayLiveStreamOnScreen(streamRequest)) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute top-6 left-6 flex items-center gap-3 rounded-full bg-red-600/95 px-5 py-2.5 text-white shadow-2xl">
        <Radio className="w-5 h-5 animate-pulse" />
        <span className="text-lg font-black uppercase tracking-wider">
          En vivo · {streamRequest.authorName}
        </span>
        <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-sm font-black">
          {secondsLeft}s
        </span>
      </div>
    </div>
  );
}
