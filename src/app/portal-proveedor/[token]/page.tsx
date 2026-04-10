'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, Clock, LogIn, LogOut, Send } from 'lucide-react';
import {
  getProveedorByToken,
  confirmarLlegada,
  confirmarPartida,
  toggleTareaProveedor,
  addNotaProveedor,
} from '@/app/actions/provider-portal';
import type { ProveedorPortalAccess, EstadoProveedorPortal } from '@/types/provider-portal';

function estadoBadgeClass(estado: EstadoProveedorPortal) {
  switch (estado) {
    case 'Llegó': return 'bg-green-100 text-green-700 border border-green-300';
    case 'En Camino': return 'bg-blue-100 text-blue-700 border border-blue-300';
    case 'Confirmado': return 'bg-teal-100 text-teal-700 border border-teal-300';
    case 'Completó': return 'bg-gray-100 text-gray-600 border border-gray-300';
    case 'No Llegó': return 'bg-red-100 text-red-700 border border-red-300';
    default: return 'bg-gray-100 text-gray-500 border border-gray-300';
  }
}

export default function PortalProveedorPage({ params }: { params: { token: string } }) {
  const token = params.token;

  const [data, setData] = useState<ProveedorPortalAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [notaSent, setNotaSent] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const res = await getProveedorByToken(token);
    if (res.success && res.data) {
      setData(res.data);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
    if (!silent) setIsLoading(false);
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleConfirmarLlegada = async () => {
    setActionLoading('llegada');
    const res = await confirmarLlegada(token);
    if (res.success) {
      showFeedback('¡Llegada confirmada! ✅');
      await loadData(true);
    } else {
      showFeedback('Error al confirmar llegada');
    }
    setActionLoading(null);
  };

  const handleConfirmarPartida = async () => {
    setActionLoading('partida');
    const res = await confirmarPartida(token);
    if (res.success) {
      showFeedback('¡Partida confirmada! 👋');
      await loadData(true);
    } else {
      showFeedback('Error al confirmar partida');
    }
    setActionLoading(null);
  };

  const handleToggleTarea = async (tareaId: string) => {
    setActionLoading(`tarea-${tareaId}`);
    const res = await toggleTareaProveedor(token, tareaId);
    if (res.success) {
      await loadData(true);
    } else {
      showFeedback('Error al actualizar tarea');
    }
    setActionLoading(null);
  };

  const handleEnviarNota = async () => {
    if (!nota.trim()) return;
    setActionLoading('nota');
    const res = await addNotaProveedor(token, nota.trim());
    if (res.success) {
      setNota('');
      setNotaSent(true);
      showFeedback('Nota enviada ✅');
      await loadData(true);
      setTimeout(() => setNotaSent(false), 3000);
    } else {
      showFeedback('Error al enviar nota');
    }
    setActionLoading(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-pink-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando portal...</p>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Acceso no válido</h1>
          <p className="text-gray-500 text-sm">
            Este link de acceso no existe o ha sido desactivado.
            Por favor, contacta al equipo de AK Producciones.
          </p>
        </div>
      </div>
    );
  }

  const hasArrived = data.estadoActual === 'Llegó' || data.estadoActual === 'Completó';
  const hasCompleted = data.estadoActual === 'Completó';
  const completedTareas = data.tareas.filter(t => t.completada).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Feedback toast */}
      {feedbackMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg">
          {feedbackMsg}
        </div>
      )}

      {/* Header gradient */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white px-4 pt-8 pb-10">
        <div className="max-w-lg mx-auto">
          <p className="text-pink-100 text-xs font-medium uppercase tracking-widest mb-1">AK Producciones</p>
          <h1 className="text-2xl font-bold">{data.nombreProveedor}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
              {data.tipoProveedor}
            </span>
            <span className="flex items-center gap-1 text-pink-100 text-xs">
              <Clock className="h-3.5 w-3.5" />
              Llegada estimada: {data.horaLlegadaEstimada}
              {data.horaPartidaEstimada && ` · Partida: ${data.horaPartidaEstimada}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 -mt-4 pb-10 space-y-4">
        {/* Status card */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Estado actual</h2>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${estadoBadgeClass(data.estadoActual)}`}>
              {data.estadoActual}
            </span>
          </div>

          {!hasArrived && (
            <button
              onClick={handleConfirmarLlegada}
              disabled={!!actionLoading}
              className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {actionLoading === 'llegada' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              Confirmar Llegada
            </button>
          )}

          {hasArrived && !hasCompleted && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-3 mb-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Llegada confirmada
                {data.llegadaConfirmadaEn && (
                  <span className="text-green-500 font-normal ml-1">
                    a las {new Date(data.llegadaConfirmadaEn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          )}

          {hasCompleted && (
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-xl p-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">Servicio completado. ¡Gracias!</p>
            </div>
          )}
        </div>

        {/* Tasks card */}
        {data.tareas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Mis Tareas</h2>
              <span className="text-sm text-gray-500">{completedTareas}/{data.tareas.length}</span>
            </div>
            <div className="space-y-2">
              {data.tareas.map(tarea => {
                const isLoading = actionLoading === `tarea-${tarea.id}`;
                return (
                  <button
                    key={tarea.id}
                    onClick={() => handleToggleTarea(tarea.id)}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      tarea.completada
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      tarea.completada ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {tarea.completada && <CheckCircle2 className="h-4 w-4 text-white" />}
                      {isLoading && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                    </div>
                    <span className={`text-sm font-medium ${tarea.completada ? 'line-through text-green-600' : ''}`}>
                      {tarea.texto}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes card */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Notas</h2>
          {data.notas && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
              <p className="text-sm text-gray-700">{data.notas}</p>
            </div>
          )}
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Escribe una nota para el equipo..."
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 min-h-[80px]"
            rows={3}
          />
          <button
            onClick={handleEnviarNota}
            disabled={!nota.trim() || !!actionLoading}
            className="mt-2 w-full bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {actionLoading === 'nota' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : notaSent ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {notaSent ? 'Nota enviada' : 'Enviar Nota'}
          </button>
        </div>

        {/* Departure card */}
        {hasArrived && !hasCompleted && (
          <div className="bg-white rounded-2xl shadow-md p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Finalizar servicio</h2>
            <button
              onClick={handleConfirmarPartida}
              disabled={!!actionLoading}
              className="w-full bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white font-semibold py-4 px-6 rounded-xl text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {actionLoading === 'partida' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              Confirmar Partida
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pt-2">
          Portal exclusivo para {data.nombreProveedor} · AK Producciones
        </p>
      </div>
    </div>
  );
}
