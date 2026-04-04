'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Trash2,
  Check,
  Star,
  StarOff,
  Plus,
  Minus,
  Monitor,
  Users,
  Music,
  MessageSquare,
  Camera,
  Vote,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import {
  getEventoEnVivoData,
  marcarCancionReproducida,
  toggleMensajeDestacado,
  deleteContenidoEnVivo,
  createVotacion,
  toggleVotacionActiva,
} from '@/app/actions/evento-en-vivo';
import type { EventoEnVivoData, VotacionOpcion } from '@/types/fiesta';

const REFRESH_INTERVAL = 10_000;

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function OrganizadorPage() {
  const { fiestaId } = useParams<{ fiestaId: string }>();
  const { toast } = useToast();

  const [fiestaName, setFiestaName] = useState('');
  const [data, setData] = useState<EventoEnVivoData>({
    fotos: [],
    solicitudesCanciones: [],
    mensajes: [],
    votaciones: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'fotos' | 'canciones' | 'mensajes' | 'votaciones'>('fotos');

  // New votación form
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [nuevasOpciones, setNuevasOpciones] = useState<string[]>(['', '']);
  const [creandoVotacion, setCreandoVotacion] = useState(false);

  const fetchData = useCallback(async () => {
    const [fiesta, eventoData] = await Promise.all([
      getFiestaById(fiestaId),
      getEventoEnVivoData(fiestaId),
    ]);
    if (fiesta) setFiestaName(fiesta.configuracion?.nombreEvento || fiesta.configuracion?.nombreAgasajado || 'Evento');
    setData(eventoData);
    setLoading(false);
  }, [fiestaId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDelete = async (tipo: 'foto' | 'cancion' | 'mensaje' | 'votacion', id: string) => {
    const result = await deleteContenidoEnVivo(fiestaId, tipo, id);
    if (result.success) {
      toast({ title: 'Eliminado' });
      fetchData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleToggleCancion = async (id: string) => {
    const result = await marcarCancionReproducida(fiestaId, id);
    if (result.success) fetchData();
    else toast({ title: 'Error', description: result.error, variant: 'destructive' });
  };

  const handleToggleDestacado = async (id: string) => {
    const result = await toggleMensajeDestacado(fiestaId, id);
    if (result.success) fetchData();
    else toast({ title: 'Error', description: result.error, variant: 'destructive' });
  };

  const handleToggleVotacion = async (id: string) => {
    const result = await toggleVotacionActiva(fiestaId, id);
    if (result.success) fetchData();
    else toast({ title: 'Error', description: result.error, variant: 'destructive' });
  };

  const handleCrearVotacion = async (e: FormEvent) => {
    e.preventDefault();
    const opcionesValidas = nuevasOpciones.filter(o => o.trim());
    if (!nuevaPregunta.trim() || opcionesValidas.length < 2) {
      toast({ title: 'Completá los campos', description: 'Necesitás una pregunta y al menos 2 opciones.', variant: 'destructive' });
      return;
    }
    setCreandoVotacion(true);
    const opciones: VotacionOpcion[] = opcionesValidas.map(o => ({
      id: randomId(),
      texto: o.trim(),
      votos: 0,
    }));
    const result = await createVotacion(fiestaId, { pregunta: nuevaPregunta.trim(), opciones });
    setCreandoVotacion(false);
    if (result.success) {
      toast({ title: '¡Votación creada!' });
      setNuevaPregunta('');
      setNuevasOpciones(['', '']);
      fetchData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const addOpcion = () => setNuevasOpciones(prev => [...prev, '']);
  const removeOpcion = (i: number) => setNuevasOpciones(prev => prev.filter((_, idx) => idx !== i));
  const updateOpcion = (i: number, val: string) =>
    setNuevasOpciones(prev => prev.map((o, idx) => (idx === i ? val : o)));

  const sectionButtons = [
    { key: 'fotos', label: 'Fotos', icon: Camera, count: data.fotos.length },
    { key: 'canciones', label: 'Canciones', icon: Music, count: data.solicitudesCanciones.length },
    { key: 'mensajes', label: 'Mensajes', icon: MessageSquare, count: data.mensajes.length },
    { key: 'votaciones', label: 'Votaciones', icon: Vote, count: data.votaciones.length },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold truncate max-w-[50vw]">{fiestaName}</h1>
            <p className="text-xs text-slate-400">Panel del Organizador</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={fetchData}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <a
              href={`/evento/en-vivo/${fiestaId}/invitados`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs bg-purple-700 hover:bg-purple-600 px-3 py-1.5 rounded-md transition-colors"
            >
              <Users className="w-3 h-3" />
              <span className="hidden sm:inline">Vista invitados</span>
            </a>
            <a
              href={`/evento/en-vivo/${fiestaId}/pantalla`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded-md transition-colors"
            >
              <Monitor className="w-3 h-3" />
              <span className="hidden sm:inline">Pantalla</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Section nav */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {sectionButtons.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border transition-colors ${
                activeSection === key
                  ? 'bg-purple-700 border-purple-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
              <Badge className="bg-slate-600 text-white text-xs px-1.5 py-0">{count}</Badge>
            </button>
          ))}
        </div>

        {/* FOTOS */}
        {activeSection === 'fotos' && (
          <div>
            <h2 className="text-base font-semibold mb-3">📸 Fotos ({data.fotos.length})</h2>
            {data.fotos.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No hay fotos aún.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...data.fotos].reverse().map(foto => (
                  <div key={foto.id} className="relative group rounded-lg overflow-hidden bg-slate-800 aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={foto.url} alt={foto.autor} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div>
                        <p className="text-xs font-semibold">{foto.autor}</p>
                        {foto.mensaje && <p className="text-xs text-slate-300 line-clamp-2">{foto.mensaje}</p>}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full h-7 text-xs"
                        onClick={() => handleDelete('foto', foto.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CANCIONES */}
        {activeSection === 'canciones' && (
          <div>
            <h2 className="text-base font-semibold mb-3">🎵 Solicitudes de canciones ({data.solicitudesCanciones.length})</h2>
            {data.solicitudesCanciones.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No hay solicitudes aún.</p>
            ) : (
              <div className="space-y-2">
                {[...data.solicitudesCanciones]
                  .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                  .map(s => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                        s.reproducida
                          ? 'bg-slate-800/50 border-slate-700 opacity-60'
                          : 'bg-slate-800 border-slate-600'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.cancion}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {s.artista ? `${s.artista} · ` : ''}{s.invitadoNombre}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={s.reproducida ? 'outline' : 'default'}
                        className={`shrink-0 h-8 text-xs ${s.reproducida ? 'border-green-600 text-green-400' : 'bg-green-700 hover:bg-green-600'}`}
                        onClick={() => handleToggleCancion(s.id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {s.reproducida ? 'Reproducida' : 'Marcar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 h-8 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                        onClick={() => handleDelete('cancion', s.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* MENSAJES */}
        {activeSection === 'mensajes' && (
          <div>
            <h2 className="text-base font-semibold mb-3">💬 Mensajes ({data.mensajes.length})</h2>
            {data.mensajes.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No hay mensajes aún.</p>
            ) : (
              <div className="space-y-2">
                {[...data.mensajes]
                  .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                  .map(m => (
                    <div
                      key={m.id}
                      className={`rounded-lg border px-4 py-3 ${
                        m.destacado
                          ? 'bg-yellow-900/30 border-yellow-700'
                          : 'bg-slate-800 border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{m.autor}</span>
                            {m.destacado && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                          </div>
                          <p className="text-sm text-slate-200">{m.mensaje}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-8 w-8 p-0 ${m.destacado ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-400 hover:text-yellow-400'}`}
                            onClick={() => handleToggleDestacado(m.id)}
                            title={m.destacado ? 'Quitar destacado' : 'Destacar'}
                          >
                            {m.destacado ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                            onClick={() => handleDelete('mensaje', m.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* VOTACIONES */}
        {activeSection === 'votaciones' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-3">🗳️ Votaciones ({data.votaciones.length})</h2>
              {data.votaciones.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No hay votaciones. Creá una abajo.</p>
              ) : (
                <div className="space-y-3">
                  {data.votaciones.map(v => {
                    const totalVotos = v.opciones.reduce((sum, o) => sum + o.votos, 0);
                    return (
                      <Card key={v.id} className="bg-slate-800 border-slate-600 text-white">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-sm font-medium flex-1">{v.pregunta}</CardTitle>
                            <div className="flex gap-1 shrink-0">
                              <Badge className={v.activa ? 'bg-green-700' : 'bg-slate-600'}>
                                {v.activa ? 'Activa' : 'Inactiva'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2"
                                onClick={() => handleToggleVotacion(v.id)}
                              >
                                {v.activa ? 'Desactivar' : 'Activar'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                onClick={() => handleDelete('votacion', v.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                          {v.opciones.map(o => {
                            const pct = totalVotos > 0 ? Math.round((o.votos / totalVotos) * 100) : 0;
                            return (
                              <div key={o.id} className="space-y-0.5">
                                <div className="flex justify-between text-xs">
                                  <span>{o.texto}</span>
                                  <span className="text-slate-400">{o.votos} ({pct}%)</span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-purple-500 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          <p className="text-xs text-slate-400 pt-1">Total: {totalVotos} votos</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create new votación */}
            <Card className="bg-slate-800 border-slate-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">+ Nueva votación</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCrearVotacion} className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-xs">Pregunta *</Label>
                    <Input
                      value={nuevaPregunta}
                      onChange={e => setNuevaPregunta(e.target.value)}
                      placeholder="¿Qué quieren que pongamos?"
                      className="bg-slate-700 border-slate-500 text-white placeholder:text-slate-400 mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs">Opciones (mínimo 2) *</Label>
                    {nuevasOpciones.map((op, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={op}
                          onChange={e => updateOpcion(i, e.target.value)}
                          placeholder={`Opción ${i + 1}`}
                          className="bg-slate-700 border-slate-500 text-white placeholder:text-slate-400"
                        />
                        {nuevasOpciones.length > 2 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="shrink-0 text-red-400 hover:text-red-300"
                            onClick={() => removeOpcion(i)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      onClick={addOpcion}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar opción
                    </Button>
                  </div>
                  <Button type="submit" disabled={creandoVotacion} className="w-full bg-purple-700 hover:bg-purple-600">
                    {creandoVotacion ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Crear votación
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
