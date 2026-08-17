'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { CompanyLogo } from '@/components/company-logo';
import { Search, Loader2, AlertTriangle, PartyPopper, ChevronRight, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getPublicGuestEvent,
  searchPublicGuestTable,
  type PublicGuestTableMatch,
} from '@/app/actions/public-guest-portal';
import type { PublicGuestEvent } from '@/lib/guest-portal-public-data';
import { QuinceLeadPrompt } from '@/components/leads/QuinceLeadPrompt';

// Contact phone for WhatsApp fallback (WhatsApp format: country code + number)
const CONTACT_WHATSAPP = '59898355530';

export default function MiMesaPage() {
  const { fiestaId } = useParams<{ fiestaId: string }>();

  const [fiesta, setFiesta] = useState<PublicGuestEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicGuestTableMatch[] | null>(null);
  const [selected, setSelected] = useState<PublicGuestTableMatch | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const loadFiesta = useCallback(async () => {
    try {
      const data = await getPublicGuestEvent(fiestaId);
      setFiesta(data ?? null);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => { loadFiesta(); }, [loadFiesta]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiesta || query.trim().length < 3) return;

    setIsSearching(true);
    setResults(null);
    setSelected(null);
    setNotFound(false);

    try {
      const matches = await searchPublicGuestTable(fiestaId, query);
      if (matches.length === 0) {
        setNotFound(true);
      } else if (matches.length === 1) {
        setSelected(matches[0]);
      } else {
        setResults(matches);
      }
    } catch {
      setNotFound(true);
    }
    setIsSearching(false);
  };

  const handleSelect = (inv: PublicGuestTableMatch) => {
    setSelected(inv);
    setResults(null);
  };

  const handleReset = () => {
    setQuery('');
    setResults(null);
    setSelected(null);
    setNotFound(false);
  };

  // ── Loading ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="ak-live-stage flex min-h-screen items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-300" />
      </div>
    );
  }

  if (!fiesta) {
    return (
      <div className="ak-live-stage flex min-h-screen items-center justify-center p-4">
        {/* Fondo explicito: .ak-live-panel pierde contra el blanco propio de Card. */}
        <Card className="max-w-sm border border-white/15 bg-slate-900 text-center text-white shadow-2xl">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 mx-auto text-red-400" />
            <CardTitle className="text-red-300">Este enlace no está disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">Pedile el enlace nuevo a quien te invitó.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = fiesta.configuracion;
  const primaryColor = config.primaryColor || '#7c3aed';

  // ── Result: Found ──────────────────────────────────────────
  if (selected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${primaryColor}22, #0f172a)` }}>
        <div className="w-full max-w-sm text-center space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="relative w-16 h-16 mx-auto">
            <CompanyLogo size="md" className="mx-auto" />
          </div>
          <div className="ak-live-panel space-y-4 p-8 text-white">
            <PartyPopper className="w-12 h-12 mx-auto text-yellow-400" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-70">¡Hola, {selected.nombre.split(' ')[0]}!</p>
            <p className="text-lg font-semibold opacity-80">Tu mesa es</p>
            {selected.tableNumber ? (
              <div className="text-7xl font-black" style={{ color: primaryColor === '#7c3aed' ? '#a78bfa' : primaryColor }}>
                {selected.tableNumber}
              </div>
            ) : (
              <p className="text-xl font-bold text-amber-300">Mesa no asignada aún</p>
            )}
            <p className="text-sm opacity-60">¡Que disfrutes el evento! 🎉</p>
          </div>
          <button onClick={handleReset} className="text-sm text-white/50 hover:text-white/80 underline transition-colors">
            Buscar otro nombre
          </button>
        </div>
        <QuinceLeadPrompt fiestaId={fiestaId} guestId={selected.id} guestAccessToken={selected.guestAccessToken} />
      </div>
    );
  }

  // ── Result: Multiple options ───────────────────────────────
  if (results && results.length > 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${primaryColor}22, #0f172a)` }}>
        <div className="w-full max-w-sm space-y-4 animate-in fade-in duration-300">
          <div className="text-center text-white">
            <p className="font-black text-lg">¿Sos alguno de estos?</p>
            <p className="text-sm opacity-60 mt-1">Tocá tu nombre para ver tu mesa</p>
          </div>
          <div className="space-y-2">
            {results.map(inv => (
              <button
                key={inv.id}
                onClick={() => handleSelect(inv)}
                className="ak-live-panel flex w-full items-center justify-between p-4 text-white transition-all hover:bg-white/20"
              >
                <span className="font-bold">{inv.nombre}</span>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </button>
            ))}
          </div>
          <button onClick={handleReset} className="w-full text-sm text-white/50 hover:text-white/80 underline transition-colors text-center">
            Buscar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // ── Result: Not found ──────────────────────────────────────
  if (notFound) {
    const whatsappUrl = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(`Hola! No encuentro mi nombre en el buscador de mesas del evento "${config.nombreEvento}". Mi nombre es: ${query}`)}`;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${primaryColor}22, #0f172a)` }}>
        <div className="w-full max-w-sm text-center space-y-6 animate-in fade-in duration-300">
          <div className="ak-live-panel space-y-4 p-8 text-white">
            <AlertTriangle className="w-10 h-10 mx-auto text-amber-400" />
            <p className="font-black text-lg">No encontramos tu nombre</p>
            <p className="text-sm opacity-70">Buscamos &quot;<strong>{query}</strong>&quot; y no hay coincidencias.</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button className="h-12 w-full gap-2 rounded-lg bg-green-600 font-bold hover:bg-green-700">
                <MessageCircle className="w-5 h-5" />
                Contactar organizador
              </Button>
            </a>
          </div>
          <button onClick={handleReset} className="text-sm text-white/50 hover:text-white/80 underline transition-colors">
            Buscar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // ── Default: Search form ───────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${primaryColor}22, #0f172a)` }}
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <CompanyLogo size="md" className="mx-auto" />
          </div>
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-50 mb-1">{config.tipoCelebracion}</p>
            <h1 className="text-2xl font-black">{config.nombreEvento}</h1>
          </div>
        </div>

        {/* Search card */}
        <div className="ak-live-panel p-6">
          <p className="text-white font-bold text-center mb-5">¿En qué mesa estoy?</p>
          <form onSubmit={handleSearch} className="space-y-4">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Escribí tu nombre y apellido"
              className="h-14 rounded-lg border-white/20 bg-white/10 text-base text-white placeholder:text-white/40"
              autoFocus
            />
            <Button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="h-14 w-full gap-2 rounded-lg text-base font-black"
              style={{ backgroundColor: primaryColor }}
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Buscar mi mesa
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30">AK Producciones Eventos · Salto, Uruguay</p>
      </div>
    </div>
  );
}
