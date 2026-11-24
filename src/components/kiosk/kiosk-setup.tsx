'use client';

import { useCallback, useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Settings,
  Wine,
  Tv,
  Video,
  Smartphone,
  AlertCircle,
  Loader2,
  Check,
  Camera,
  Sparkles,
  Wand2,
  Mic,
  Film,
  Printer,
  Headphones,
  Download,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstalarEstaEstacion } from './instalar-esta-estacion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getFiestaActivaDeHoy, getFiestasParaKiosco, type KioscoFiestaOption } from '@/app/actions/fiesta-actual';
import { getKioskStationGuestToken } from '@/app/actions/fiesta/entretenimiento.actions';
import type { EntertainmentModuleId } from '@/lib/entertainment/station-config';

export type KioskRole =
  | 'barra'
  | 'muro-en-vivo'
  | 'plataforma-360'
  | 'totem'
  | 'fotocabina'
  | 'espejo-magico'
  | 'touchpix'
  | 'buzon'
  | 'video-vida'
  | 'impresion'
  | 'dj'
  | 'bogue';

interface KioskSetupProps {
  defaultRole: KioskRole;
}

/** Como se llama cada estacion cuando hay que ponerle nombre a un archivo. */
const ETIQUETAS_DE_ESTACION: Record<string, string> = {
  barra: 'Barra de tragos',
  'muro-en-vivo': 'Muro social',
  'plataforma-360': 'Plataforma 360',
  totem: 'Totem',
  fotocabina: 'Fotocabina',
  'espejo-magico': 'Espejo magico',
  touchpix: 'Touchpix',
  buzon: 'Buzon de saludos',
  'video-vida': 'Video de vida',
  impresion: 'Estacion de impresion',
  dj: 'Pedidos al DJ',
  bogue: 'Vogue Booth',
};

const ROLE_TO_ENTERTAINMENT_MODULE: Partial<Record<KioskRole, EntertainmentModuleId>> = {
  fotocabina: 'fotocabina',
  'plataforma-360': 'plataforma360',
  bogue: 'bogue',
  'espejo-magico': 'espejoMagicoFirma',
  touchpix: 'espejoMagicoIA',
  totem: 'totems',
  buzon: 'capsulaTiempo',
};

function buildStationPath(role: string, fiestaId: string, totem: string, accessToken?: string): string {
  const basePath = role === 'totem'
    ? `/evento/totem/${fiestaId}/${totem.trim() || 'totem-principal'}`
    : `/evento/${role}/${fiestaId}`;
  if (!accessToken) return basePath;
  return `${basePath}?access=${encodeURIComponent(accessToken)}`;
}

export function KioskSetup({ defaultRole }: KioskSetupProps) {
  const router = useRouter();
  const fiestaSelectId = useId();
  const rolesGroupId = useId();
  const totemInputId = useId();
  const codigoInputId = useId();
  const resolvedDefaultRole = (defaultRole in ETIQUETAS_DE_ESTACION ? defaultRole : 'fotocabina') as KioskRole;

  // Loading and State
  const [status, setStatus] = useState<'checking' | 'setup' | 'redirecting'>('checking');
  const [fiestas, setFiestas] = useState<KioscoFiestaOption[]>([]);
  const [selectedFiestaId, setSelectedFiestaId] = useState('');
  const [selectedRole, setSelectedRole] = useState<KioskRole>(resolvedDefaultRole);
  const [requiereCodigo, setRequiereCodigo] = useState(false);
  const [codigoFiestaInput, setCodigoFiestaInput] = useState('');
  const [codigoFiestaActivo, setCodigoFiestaActivo] = useState('');

  useEffect(() => {
    setSelectedRole(resolvedDefaultRole);
  }, [resolvedDefaultRole]);
  /**
   * SIN PIN, y lo pidio el dueño: *"o mejor sacale el PIN y ta. Asi no complica."*
   *
   * El PIN no cuidaba plata ni datos: lo unico que hacia era que el empleado no
   * se saliera de la pantalla sin querer. Para eso alcanza con que salirse pida
   * una confirmacion, y **una clave mas para acordarse el dia de la fiesta es
   * justamente lo que hace que no se use**.
   */
  const [errorMessage, setErrorMessage] = useState('');

  // Totem custom identifier
  const [totemId, setTotemId] = useState('');
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

  const loadFiestaOptions = useCallback(async (preferredFiestaId?: string, codigoBusqueda?: string) => {
    try {
      const res = await getFiestasParaKiosco(codigoBusqueda);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
      setRequiereCodigo(Boolean(res.requiereCodigo));
      const sorted = [...(res.fiestas || [])].sort((a, b) =>
        new Date(b.configuracion?.fechaEvento || 0).getTime() -
        new Date(a.configuracion?.fechaEvento || 0).getTime()
      );
      setFiestas(sorted);
      if (sorted.length > 0) {
        setSelectedFiestaId(
          sorted.some((fiesta) => fiesta.id === preferredFiestaId)
            ? preferredFiestaId || sorted[0].id
            : sorted[0].id
        );
      } else {
        setSelectedFiestaId('');
      }
      if (codigoBusqueda?.trim()) {
        setCodigoFiestaActivo(codigoBusqueda.trim().toUpperCase());
      }
      setStatus('setup');
    } catch {
      setErrorMessage('No se pudieron cargar los eventos del servidor.');
      setStatus('setup');
    }
  }, []);

  const resolveStationPath = useCallback(async (
    role: string,
    fiestaId: string,
    totem: string,
    codigo?: string,
  ): Promise<{ path: string | null; token?: string; error?: string }> => {
    const moduleId = ROLE_TO_ENTERTAINMENT_MODULE[role as KioskRole];
    if (!moduleId) {
      return { path: buildStationPath(role, fiestaId, totem) };
    }
    try {
      const tokenRes = await getKioskStationGuestToken(fiestaId, moduleId, codigo);
      if (tokenRes.success && tokenRes.guestToken) {
        return {
          path: buildStationPath(role, fiestaId, totem, tokenRes.guestToken),
          token: tokenRes.guestToken,
        };
      }
      return {
        path: null,
        error: tokenRes.error || 'No se pudo habilitar el acceso para esta estación.',
      };
    } catch {
      return {
        path: null,
        error: 'No se pudo obtener el pase de la estación. Revisá la conexión.',
      };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // 1. Check if device is already locked in localStorage
    const savedFiestaId = localStorage.getItem('kiosk_locked_fiesta_id');
    const savedRole = localStorage.getItem('kiosk_role');
    const savedTotemId = localStorage.getItem('kiosk_totem_id') || '';
    const savedCodigo = localStorage.getItem('kiosk_fiesta_codigo') || undefined;
    const savedToken = localStorage.getItem('kiosk_access_token') || undefined;

    if (savedFiestaId && savedRole && (savedRole !== 'totem' || savedTotemId.trim())) {
      setStatus('redirecting');
      void (async () => {
        const resolved = await resolveStationPath(savedRole, savedFiestaId, savedTotemId, savedCodigo);
        if (cancelled) return;
        if (resolved.path) {
          if (resolved.token) {
            localStorage.setItem('kiosk_access_token', resolved.token);
          }
          router.push(resolved.path);
          return;
        }
        if (savedToken && ROLE_TO_ENTERTAINMENT_MODULE[savedRole as KioskRole]) {
          router.push(buildStationPath(savedRole, savedFiestaId, savedTotemId, savedToken));
          return;
        }
        setErrorMessage(resolved.error || 'No se pudo abrir la estación guardada.');
        void loadFiestaOptions(savedFiestaId, savedCodigo);
      })();
      return () => {
        cancelled = true;
      };
    }

    // 2. Otherwise, check if today has an active event scheduled
    async function checkTodayEvent() {
      try {
        const result = await getFiestaActivaDeHoy();
        if (!cancelled) {
          await loadFiestaOptions(result.success ? result.fiestaId : undefined);
        }
      } catch (err) {
        console.error('Error auto-detecting today\'s event:', err);
        if (!cancelled) {
          void loadFiestaOptions();
        }
      }
    }

    void checkTodayEvent();
    return () => {
      cancelled = true;
    };
  }, [defaultRole, loadFiestaOptions, resolveStationPath, router]);

  /**
   * Un acceso directo para dejarle al empleado, sin explicarle nada.
   *
   * Pedido del dueño: *"archivos descargables o algo así"*. En vez de una lista
   * de pasos, se baja un archivo, se copia a la maquina del empleado y **con dos
   * clicks queda abierta la estacion de esa fiesta**. Es el formato de acceso
   * directo de Windows, que es lo que el usa.
   */
  const direccionDeLaEstacion = async (): Promise<string | null> => {
    setErrorMessage('');
    const resolved = await resolveStationPath(
      selectedRole,
      selectedFiestaId,
      totemId.trim() || 'totem-principal',
      codigoFiestaActivo || codigoFiestaInput.trim() || undefined,
    );
    if (!resolved.path) {
      setErrorMessage(resolved.error || 'No se pudo armar el enlace de la estación.');
      return null;
    }
    return `${window.location.origin}${resolved.path}`;
  };

  /**
   * El enlace, para mandarselo al empleado por WhatsApp.
   *
   * Pedido del dueño: *"quiero poder instalar aparte, descargar un instalador; si
   * no se puede, un link, algo."* Instalador de programa no hay, porque esto es
   * una pagina web. **El enlace hace lo mismo**: lo abre en su maquina y ya esta
   * en la estacion, sin saber ninguna direccion ni tocar nada mas.
   */
  const copiarEnlace = async () => {
    if (!selectedFiestaId) {
      setErrorMessage('Elegí primero de qué fiesta es.');
      return;
    }
    const direccion = await direccionDeLaEstacion();
    if (!direccion) return;
    try {
      await navigator.clipboard.writeText(direccion);
      setEnlaceCopiado(true);
      setTimeout(() => setEnlaceCopiado(false), 2500);
    } catch {
      setErrorMessage('No se pudo copiar. Bajá el acceso directo, que hace lo mismo.');
    }
  };

  const bajarAccesoDirecto = async () => {
    if (!selectedFiestaId) {
      setErrorMessage('Elegí primero de qué fiesta es.');
      return;
    }
    const direccion = await direccionDeLaEstacion();
    if (!direccion) return;
    const fiesta = fiestas.find((f) => f.id === selectedFiestaId);
    const nombreFiesta = (fiesta?.configuracion?.nombreEvento || 'Fiesta').replace(/[\\/:*?"<>|]/g, ' ').trim();

    const contenido = `[InternetShortcut]\r\nURL=${direccion}\r\nIconIndex=0\r\n`;
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'application/internet-shortcut' }));
    enlace.download = `${ETIQUETAS_DE_ESTACION[selectedRole] || 'Estacion'} - ${nombreFiesta}.url`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(enlace.href);
  };

  const handleLockDevice = async () => {
    if (!selectedFiestaId) {
      setErrorMessage('Por favor selecciona un evento.');
      return;
    }

    if (selectedRole === 'totem' && !totemId.trim()) {
      setErrorMessage('Indica el identificador real del tótem antes de lanzarlo.');
      return;
    }

    setErrorMessage('');
    const codigoUsado = codigoFiestaActivo || codigoFiestaInput.trim() || undefined;
    const resolved = await resolveStationPath(selectedRole, selectedFiestaId, totemId.trim(), codigoUsado);
    if (!resolved.path) {
      setErrorMessage(resolved.error || 'No se pudo habilitar esta estación.');
      return;
    }

    // Lock the configuration
    localStorage.setItem('kiosk_locked_fiesta_id', selectedFiestaId);
    localStorage.setItem('kiosk_role', selectedRole);
    if (selectedRole === 'totem') {
      localStorage.setItem('kiosk_totem_id', totemId.trim());
    }
    if (codigoUsado) {
      localStorage.setItem('kiosk_fiesta_codigo', codigoUsado);
    } else {
      localStorage.removeItem('kiosk_fiesta_codigo');
    }
    if (resolved.token) {
      localStorage.setItem('kiosk_access_token', resolved.token);
    } else {
      localStorage.removeItem('kiosk_access_token');
    }

    setStatus('redirecting');
    router.push(resolved.path);
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 motion-reduce:transition-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 shadow-2xl">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-widest uppercase text-purple-400">Modo Kiosco AK</h2>
            <p className="text-slate-400 max-w-sm">Detectando fiesta activa programada para hoy...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === 'redirecting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
          <p className="text-emerald-400 font-bold uppercase tracking-widest">Abriendo pantalla operativa...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 md:p-8">
      {/*
        Desde acá se instala la estación como programa aparte.
        Vale para TODAS: cada entretenimiento entra por esta misma pantalla, así
        que con ponerlo una vez, el navegador ofrece instalar la estación que se
        haya elegido, no la app entera.
      */}
      <InstalarEstaEstacion estacion={selectedRole} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <Card className="bg-slate-900/80 border-slate-800 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
            <h1 data-slot="card-title" className="text-3xl font-black leading-tight tracking-tight text-white">Configuración de Kiosco</h1>
            <CardDescription className="text-slate-400 text-sm">
              Vincula esta tablet o pantalla a un rol específico del salón y bloquéala de forma segura.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Step 1: Select Fiesta */}
            <div className="space-y-2">
              <label htmlFor={fiestaSelectId} className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Seleccionar Evento / Fiesta</label>
              {fiestas.length > 0 ? (
                <select
                  id={fiestaSelectId}
                  value={selectedFiestaId}
                  onChange={(e) => setSelectedFiestaId(e.target.value)}
                  className="w-full h-12 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-medium"
                >
                  {fiestas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.configuracion?.nombreEvento || 'Fiesta sin nombre'} ({f.configuracion?.fechaEvento || 'Sin fecha'})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-slate-500 text-xs py-2">No se encontraron eventos activos en el sistema.</p>
              )}
              {requiereCodigo && (
                <div className="pt-1 flex gap-2">
                  <Input
                    id={codigoInputId}
                    aria-label="Código de la fiesta"
                    value={codigoFiestaInput}
                    onChange={(e) => setCodigoFiestaInput(e.target.value.toUpperCase())}
                    placeholder="Código de la fiesta (si es otro día)"
                    className="bg-slate-950 border-slate-800 text-xs h-10 text-slate-100 placeholder:text-slate-400 uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setErrorMessage('');
                      void loadFiestaOptions(undefined, codigoFiestaInput.trim());
                    }}
                    className="h-10 border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900 text-xs font-bold shrink-0"
                  >
                    Buscar
                  </Button>
                </div>
              )}
            </div>

            {/* Step 2: Choose Kiosk Role */}
            <div className="space-y-2">
              <div role="group" aria-labelledby={rolesGroupId} className="space-y-2">
                <label id={rolesGroupId} className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Rol del Dispositivo</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {[
                  { id: 'barra', label: 'Barra de Tragos', icon: Wine, color: 'hover:border-rose-500/50 hover:bg-rose-500/5' },
                  { id: 'muro-en-vivo', label: 'Muro Social', icon: Tv, color: 'hover:border-blue-500/50 hover:bg-blue-500/5' },
                  { id: 'plataforma-360', label: 'Plataforma 360', icon: Video, color: 'hover:border-purple-500/50 hover:bg-purple-500/5' },
                  { id: 'totem', label: 'Tótem LED', icon: Smartphone, color: 'hover:border-emerald-500/50 hover:bg-emerald-500/5' },
                  { id: 'fotocabina', label: 'Fotocabina', icon: Camera, color: 'hover:border-amber-500/50 hover:bg-amber-500/5' },
                  { id: 'espejo-magico', label: 'Espejo Mágico', icon: Sparkles, color: 'hover:border-pink-500/50 hover:bg-pink-500/5' },
                  { id: 'touchpix', label: 'Touchpix AI', icon: Wand2, color: 'hover:border-cyan-500/50 hover:bg-cyan-500/5' },
                  { id: 'buzon', label: 'Buzón Saludos', icon: Mic, color: 'hover:border-violet-500/50 hover:bg-violet-500/5' },
                  { id: 'video-vida', label: 'Video de Vida', icon: Film, color: 'hover:border-orange-500/50 hover:bg-orange-500/5' },
                  { id: 'impresion', label: 'Estación Impresión', icon: Printer, color: 'hover:border-indigo-500/50 hover:bg-indigo-500/5' },
                  { id: 'dj', label: 'Pedidos al DJ', icon: Headphones, color: 'hover:border-emerald-500/50 hover:bg-emerald-500/5' },
                  { id: 'bogue', label: 'Vogue Booth', icon: Sparkles, color: 'hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5' },
                ].map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedRole(role.id as KioskRole);
                        setErrorMessage('');
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-all motion-reduce:transition-none ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5 text-purple-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 ' + role.color
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span className="text-[11px] font-bold leading-tight">{role.label}</span>
                    </button>
                  );
                })}
                </div>
              </div>
            </div>

            {/* Totem customization */}
            {selectedRole === 'totem' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label htmlFor={totemInputId} className="text-xs font-bold uppercase tracking-wider text-slate-400">Identificador del Tótem</label>
                <Input
                  id={totemInputId}
                  value={totemId}
                  onChange={(e) => setTotemId(e.target.value)}
                  placeholder="ej. totem-principal o totem-entrada"
                  className="bg-slate-950 border-slate-800 text-sm h-12 text-slate-100 placeholder:text-slate-400"
                />
              </motion.div>
            )}

          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button
              onClick={handleLockDevice}
              className="w-full h-14 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-base shadow-xl shadow-purple-600/10 flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Dejar el aparato listo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={copiarEnlace}
              className="w-full h-12 rounded-lg border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900 font-bold flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              {enlaceCopiado ? '¡Enlace copiado!' : 'Copiar enlace para mandar por WhatsApp'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={bajarAccesoDirecto}
              className="w-full h-12 rounded-lg border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900 font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Bajar acceso directo para otra máquina
            </Button>
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Se baja un archivo. Copialo a la máquina del empleado y que le haga doble click:
              abre directo esta estación, de esta fiesta.
            </p>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              El aparato queda en esta estación y en esta fiesta. Aunque se cierre y se vuelva
              a abrir, arranca acá. <strong className="text-slate-300">No hace falta ninguna clave</strong>:
              para sacarlo, el botón de arriba a la derecha.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
