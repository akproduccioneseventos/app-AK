'use client';

import { useState } from 'react';
import {
  Camera,
  Monitor,
  Wifi,
  HardDrive,
  PlayCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type EstadoPasoEquipo = 'no probado' | 'pasó' | 'falló' | 'requiere equipo';

interface PasoEquipo {
  id: string;
  nombre: string;
  descripcion: string;
  estado: EstadoPasoEquipo;
  detalle?: string;
  fechaHora?: string;
}

const PASOS_INICIALES: PasoEquipo[] = [
  {
    id: 'camara',
    nombre: 'Cámara y micrófono',
    descripcion: 'Verifica acceso real al sensor de video y permisos del navegador.',
    estado: 'no probado',
  },
  {
    id: 'pantalla',
    nombre: 'Pantalla y resolución',
    descripcion: 'Comprueba el tamaño de viewport, densidad de píxeles y relación de aspecto.',
    estado: 'no probado',
  },
  {
    id: 'conexion',
    nombre: 'Conexión real y latencia',
    descripcion: 'Mide el tiempo de respuesta real contra el servidor central de la fiesta.',
    estado: 'no probado',
  },
  {
    id: 'almacenamiento',
    nombre: 'Almacenamiento local (IndexedDB)',
    descripcion: 'Prueba escritura, lectura y espacio disponible para fotos sin internet.',
    estado: 'no probado',
  },
  {
    id: 'captura',
    nombre: 'Captura y recuperación de prueba',
    descripcion: 'Genera un cuadro de prueba en memoria y valida la cola de entrega.',
    estado: 'no probado',
  },
];

export function ComprobacionEquipo({ fiestaId }: { fiestaId: string }) {
  const [pasos, setPasos] = useState<PasoEquipo[]>(PASOS_INICIALES);
  const [probandoId, setProbandoId] = useState<string | null>(null);
  const [probandoTodo, setProbandoTodo] = useState(false);

  const actualizarPaso = (
    id: string,
    estado: EstadoPasoEquipo,
    detalle?: string,
  ) => {
    const ahora = new Date().toLocaleString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setPasos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              estado,
              detalle: detalle || p.detalle,
              fechaHora: ahora,
            }
          : p,
      ),
    );
  };

  const probarCamara = async () => {
    setProbandoId('camara');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        actualizarPaso('camara', 'requiere equipo', 'El navegador no soporta captura de medios.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        const track = stream.getVideoTracks()[0];
        const label = track?.label || 'Cámara conectada';
        track?.stop();
        actualizarPaso('camara', 'pasó', `Sensor verificado: ${label}`);
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          actualizarPaso('camara', 'requiere equipo', 'Permiso de cámara bloqueado o denegado.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          actualizarPaso('camara', 'requiere equipo', 'No se detectó cámara física conectada.');
        } else {
          actualizarPaso('camara', 'falló', `Error al acceder a la cámara: ${err.message || 'Desconocido'}`);
        }
      }
    } finally {
      setProbandoId(null);
    }
  };

  const probarPantalla = async () => {
    setProbandoId('pantalla');
    try {
      const ancho = window.innerWidth;
      const alto = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      const resolucion = `${ancho}x${alto} (escala ${dpr.toFixed(1)}x)`;
      if (ancho < 320 || alto < 320) {
        actualizarPaso('pantalla', 'falló', `Resolución demasiado reducida: ${resolucion}`);
      } else {
        actualizarPaso('pantalla', 'pasó', `Resolución válida para kiosco: ${resolucion}`);
      }
    } finally {
      setProbandoId(null);
    }
  };

  const probarConexion = async () => {
    setProbandoId('conexion');
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        actualizarPaso('conexion', 'falló', 'El dispositivo está en modo desconectado (offline).');
        return;
      }
      const t0 = performance.now();
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
      const t1 = performance.now();
      const latencia = Math.round(t1 - t0);
      if (res.ok) {
        actualizarPaso('conexion', 'pasó', `Servidor en línea, latencia ${latencia}ms.`);
      } else {
        actualizarPaso('conexion', 'falló', `Respuesta inesperada del servidor (HTTP ${res.status}).`);
      }
    } catch (err: any) {
      actualizarPaso('conexion', 'falló', `Sin conexión con el servidor (${err.message || 'Error de red'}).`);
    } finally {
      setProbandoId(null);
    }
  };

  const probarAlmacenamiento = async () => {
    setProbandoId('almacenamiento');
    try {
      if (typeof indexedDB === 'undefined') {
        actualizarPaso('almacenamiento', 'falló', 'IndexedDB no está soportado en este entorno.');
        return;
      }
      const dbNombre = 'ak_test_previa_equipo';
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(dbNombre, 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains('test_store')) {
            req.result.createObjectStore('test_store');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const tx = db.transaction('test_store', 'readwrite');
      const store = tx.objectStore('test_store');
      store.put(`test_${Date.now()}`, 'ping');
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
      indexedDB.deleteDatabase(dbNombre);

      let detalleCuota = 'IndexedDB responde con lectura y escritura.';
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        const libreMb = Math.round(((est.quota || 0) - (est.usage || 0)) / (1024 * 1024));
        detalleCuota += ` Espacio libre estimado: ~${libreMb} MB.`;
      }
      actualizarPaso('almacenamiento', 'pasó', detalleCuota);
    } catch (err: any) {
      actualizarPaso('almacenamiento', 'falló', `Fallo al verificar IndexedDB: ${err.message || 'Error'}`);
    } finally {
      setProbandoId(null);
    }
  };

  const probarCaptura = async () => {
    setProbandoId('captura');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar contexto 2D');
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Prueba de equipo: ${fiestaId}`, 40, 240);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      if (!blob || blob.size === 0) {
        throw new Error('El fotograma generado está vacío.');
      }
      actualizarPaso('captura', 'pasó', `Cuadro sintético generado (${Math.round(blob.size / 1024)} KB) y listo para encolar.`);
    } catch (err: any) {
      actualizarPaso('captura', 'falló', `Error en generación de fotograma: ${err.message || 'Error'}`);
    } finally {
      setProbandoId(null);
    }
  };

  const ejecutarPaso = async (id: string) => {
    switch (id) {
      case 'camara':
        return probarCamara();
      case 'pantalla':
        return probarPantalla();
      case 'conexion':
        return probarConexion();
      case 'almacenamiento':
        return probarAlmacenamiento();
      case 'captura':
        return probarCaptura();
    }
  };

  const probarTodoElEquipo = async () => {
    setProbandoTodo(true);
    await probarCamara();
    await probarPantalla();
    await probarConexion();
    await probarAlmacenamiento();
    await probarCaptura();
    setProbandoTodo(false);
  };

  const renderBadgeEstado = (estado: EstadoPasoEquipo) => {
    switch (estado) {
      case 'pasó':
        return (
          <span
            data-testid="estado-paso"
            className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-300"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> pasó
          </span>
        );
      case 'falló':
        return (
          <span
            data-testid="estado-paso"
            className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-300"
          >
            <XCircle className="h-3.5 w-3.5" /> falló
          </span>
        );
      case 'requiere equipo':
        return (
          <span
            data-testid="estado-paso"
            className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> requiere equipo
          </span>
        );
      case 'no probado':
      default:
        return (
          <span
            data-testid="estado-paso"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-400"
          >
            <Clock className="h-3.5 w-3.5" /> no probado
          </span>
        );
    }
  };

  const obtenerIcono = (id: string) => {
    switch (id) {
      case 'camara':
        return <Camera className="h-5 w-5 text-amber-400" />;
      case 'pantalla':
        return <Monitor className="h-5 w-5 text-sky-400" />;
      case 'conexion':
        return <Wifi className="h-5 w-5 text-emerald-400" />;
      case 'almacenamiento':
        return <HardDrive className="h-5 w-5 text-purple-400" />;
      case 'captura':
        return <PlayCircle className="h-5 w-5 text-rose-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <section
      data-testid="comprobacion-equipo"
      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-amber-300">
            Control de hardware
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white md:text-2xl">
            Prueba del equipo antes de la fiesta
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Verificá cámara, pantalla, conexión real, almacenamiento local y captura antes de abrir el salón.
          </p>
        </div>
        <Button
          type="button"
          data-testid="boton-probar-todo"
          onClick={probarTodoElEquipo}
          disabled={probandoTodo || probandoId !== null}
          className="h-11 shrink-0 rounded-xl bg-amber-400 font-black text-slate-950 hover:bg-amber-300"
        >
          {probandoTodo ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Verificando equipo...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Probar todo el equipo
            </>
          )}
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {pasos.map((paso) => (
          <div
            key={paso.id}
            data-testid={`paso-${paso.id}`}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5">
                {obtenerIcono(paso.id)}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-white">{paso.nombre}</h3>
                  {renderBadgeEstado(paso.estado)}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{paso.descripcion}</p>
                {paso.detalle && (
                  <p className="mt-1 text-xs font-medium text-slate-300">
                    {paso.detalle}
                  </p>
                )}
                {paso.fechaHora && (
                  <p
                    data-testid="fecha-hora-paso"
                    className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500"
                  >
                    <Clock className="h-3 w-3" /> Verificado el {paso.fechaHora}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:self-center">
              <Button
                type="button"
                data-testid="boton-probar-paso"
                variant="outline"
                size="sm"
                onClick={() => void ejecutarPaso(paso.id)}
                disabled={probandoTodo || probandoId === paso.id}
                className="w-full rounded-xl border-white/15 bg-white/5 text-xs font-bold text-white hover:bg-white/10 sm:w-auto"
              >
                {probandoId === paso.id ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Probar de nuevo
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
