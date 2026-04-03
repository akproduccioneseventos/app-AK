'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Image from 'next/image';
import { Search, Loader2, AlertTriangle, PartyPopper, ChevronRight, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';

// Normalize string: lowercase, remove accents
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

interface Params {
  fiestaId: string;
}

export default function MiMesaPage({ params }: { params: Promise<Params> }) {
  const { fiestaId } = use(params);

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Invitado[] | null>(null);
  const [selected, setSelected] = useState<Invitado | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const loadFiesta = useCallback(async () => {
    try {
      const data = await getFiestaById(fiestaId);
      setFiesta(data ?? null);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => { loadFiesta(); }, [loadFiesta]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiesta || !query.trim()) return;

    setIsSearching(true);
    setResults(null);
    setSelected(null);
    setNotFound(false);

    const q = normalize(query.trim());
    const invitados = fiesta.invitados ?? [];

    // Exact match first
    const exact = invitados.filter(inv =>
      normalize(inv.nombre) === q
    );
    if (exact.length === 1) {
      setSelected(exact[0]);
      setIsSearching(false);
      return;
    }

    // Partial match (includes)
    const partial = invitados.filter(inv =>
      normalize(inv.nombre).includes(q) || q.split(' ').some(word => word.length > 2 && normalize(inv.nombre).includes(word))
    );

    if (partial.length === 0) {
      setNotFound(true);
    } else if (partial.length === 1) {
      setSelected(partial[0]);
    } else {
      setResults(partial);
    }
    setIsSearching(false);
  };

  const handleSelect = (inv: Invitado) => {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-purple-300" />
      </div>
    );
  }

  if (!fiesta) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-slate-900 p-4">
        <Card className="max-w-sm text-center border-red-800 bg-red-950/50 text-white">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 mx-auto text-red-400" />
            <CardTitle className="text-red-300">Evento no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">Este enlace no corresponde a ningún evento activo.</p>
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
            <Image src="/logo_ak_producciones.png" alt="AK Producciones" fill className="object-contain" sizes="64px" />
          </div>
          <div className="p-8 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 space-y-4 text-white">
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
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
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
    const whatsappUrl = `https://wa.me/59898355530?text=${encodeURIComponent(`Hola! No encuentro mi nombre en el buscador de mesas del evento "${config.nombreEvento}". Mi nombre es: ${query}`)}`;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${primaryColor}22, #0f172a)` }}>
        <div className="w-full max-w-sm text-center space-y-6 animate-in fade-in duration-300">
          <div className="p-8 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 space-y-4 text-white">
            <AlertTriangle className="w-10 h-10 mx-auto text-amber-400" />
            <p className="font-black text-lg">No encontramos tu nombre</p>
            <p className="text-sm opacity-70">Buscamos &quot;<strong>{query}</strong>&quot; y no hay coincidencias.</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-green-600 hover:bg-green-700 rounded-2xl h-12 font-bold gap-2">
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
            <Image src="/logo_ak_producciones.png" alt="AK Producciones" fill className="object-contain" sizes="64px" />
          </div>
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-50 mb-1">{config.tipoCelebracion}</p>
            <h1 className="text-2xl font-black">{config.nombreEvento}</h1>
          </div>
        </div>

        {/* Search card */}
        <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
          <p className="text-white font-bold text-center mb-5">¿En qué mesa estoy?</p>
          <form onSubmit={handleSearch} className="space-y-4">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Escribí tu nombre y apellido"
              className="h-14 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/40 text-base"
              autoFocus
            />
            <Button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="w-full h-14 rounded-2xl font-black text-base gap-2"
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
