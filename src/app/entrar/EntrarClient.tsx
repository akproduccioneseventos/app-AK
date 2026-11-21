'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Ticket,
  Shield,
  Truck,
  PartyPopper,
  Eye,
  EyeOff,
  Loader2,
  QrCode,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompanyLogo } from '@/components/company-logo';
import { buildAkWhatsAppUrl } from '@/lib/public-contact';
import { entrarAlPortalPorTelefono } from '@/app/actions/fiesta/portal.actions';
import { entrarComoInvitado, type OpcionFiestaInvitado } from '@/app/actions/entrar-como-invitado';
import { AvisoDeDatos } from '@/components/privacidad/AvisoDeDatos';
import { BajaLaApp } from '@/components/BajaLaApp';

function guardarCredencialInvitado(fiestaId: string, guestId: string, token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ak_invitado_fiesta', fiestaId);
    localStorage.setItem(
      'ak_invitado_credencial',
      JSON.stringify({ fiestaId, guestId, token }),
    );
  } catch (err) {
    console.warn('[EntrarClient] No se pudo guardar ak_invitado_fiesta en localStorage:', err);
  }
}

export function EntrarClient() {
  const router = useRouter();

  // Redirección si ya hay fiesta guardada para un invitado
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const fiestaInvitado = localStorage.getItem('ak_invitado_fiesta');
        if (fiestaInvitado) {
          const credencialRaw = localStorage.getItem('ak_invitado_credencial');
          if (credencialRaw) {
            try {
              const cred = JSON.parse(credencialRaw) as {
                fiestaId?: string;
                guestId?: string;
                token?: string;
              };
              if (cred?.fiestaId === fiestaInvitado && cred.guestId && cred.token) {
                router.replace(
                  `/evento/hub/${encodeURIComponent(fiestaInvitado)}?guestId=${encodeURIComponent(cred.guestId)}&token=${encodeURIComponent(cred.token)}`,
                );
                return;
              }
            } catch (err) {
              console.warn('[EntrarClient] Credencial guardada inválida:', err);
            }
          }
          router.replace(`/evento/hub/${encodeURIComponent(fiestaInvitado)}`);
        }
      } catch (err) {
        console.warn('[EntrarClient] Error leyendo localStorage:', err);
      }
    }
  }, [router]);

  // Secciones desplegables
  const [seccionAbierta, setSeccionAbierta] = useState<'cliente' | 'invitado' | 'proveedor' | null>(null);

  // Formulario cliente
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [claveCliente, setClaveCliente] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargandoCliente, setCargandoCliente] = useState(false);
  const [errorCliente, setErrorCliente] = useState<string | null>(null);
  const [fiestasMultiples, setFiestasMultiples] = useState<Array<{ id: string; nombreEvento: string }> | null>(null);

  // Formulario invitado (celular primero, luego código + nombre)
  const [telefonoInvitado, setTelefonoInvitado] = useState('');
  const [cargandoInvitado, setCargandoInvitado] = useState(false);
  const [errorInvitado, setErrorInvitado] = useState<string | null>(null);
  const [opcionesInvitado, setOpcionesInvitado] = useState<OpcionFiestaInvitado[] | null>(null);
  const [mostrarIngresoPorCodigo, setMostrarIngresoPorCodigo] = useState(false);
  const [codigoFiestaInput, setCodigoFiestaInput] = useState('');
  const [nombreInvitadoInput, setNombreInvitadoInput] = useState('');

  // Modal QR Invitado
  const [mostrarScanner, setMostrarScanner] = useState(false);

  const toggleSeccion = (seccion: 'cliente' | 'invitado' | 'proveedor') => {
    setSeccionAbierta((actual) => (actual === seccion ? null : seccion));
    setErrorCliente(null);
    setFiestasMultiples(null);
    setErrorInvitado(null);
    setOpcionesInvitado(null);
  };

  const abrirHubInvitado = (fiestaId: string, guestId: string, token: string) => {
    guardarCredencialInvitado(fiestaId, guestId, token);
    router.push(
      `/evento/hub/${encodeURIComponent(fiestaId)}?guestId=${encodeURIComponent(guestId)}&token=${encodeURIComponent(token)}`,
    );
  };

  const handleIngresoInvitadoTelefono = async (
    e?: React.FormEvent,
    fiestaIdElegida?: string,
  ) => {
    if (e) e.preventDefault();
    setErrorInvitado(null);
    if (!fiestaIdElegida) setOpcionesInvitado(null);

    if (!telefonoInvitado.trim()) {
      setErrorInvitado('Escribí tu celular para entrar.');
      return;
    }

    setCargandoInvitado(true);
    try {
      const res = await entrarComoInvitado({
        telefono: telefonoInvitado,
        ...(fiestaIdElegida ? { fiestaIdElegida } : {}),
      });
      if (res.status === 'ok') {
        abrirHubInvitado(res.fiestaId, res.guestId, res.token);
        return;
      }
      if (res.status === 'multiple') {
        setOpcionesInvitado(res.opciones);
        return;
      }
      if (res.status === 'ir_a_invitacion') {
        router.push(res.url);
        return;
      }
      setErrorInvitado(res.error);
    } catch (err) {
      console.warn('[EntrarClient] Error al ingresar como invitado por teléfono:', err);
      setErrorInvitado('Ocurrió un error al buscar tu entrada. Probá de nuevo.');
    } finally {
      setCargandoInvitado(false);
    }
  };

  const handleIngresoInvitadoCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInvitado(null);
    setOpcionesInvitado(null);

    if (!codigoFiestaInput.trim() || !nombreInvitadoInput.trim()) {
      setErrorInvitado('Escribí el código de la fiesta y tu nombre completo.');
      return;
    }

    setCargandoInvitado(true);
    try {
      const res = await entrarComoInvitado({
        codigoFiesta: codigoFiestaInput,
        nombre: nombreInvitadoInput,
      });
      if (res.status === 'ok') {
        abrirHubInvitado(res.fiestaId, res.guestId, res.token);
        return;
      }
      if (res.status === 'ir_a_invitacion') {
        router.push(res.url);
        return;
      }
      if (res.status === 'multiple') {
        setOpcionesInvitado(res.opciones);
        return;
      }
      setErrorInvitado(res.error);
    } catch (err) {
      console.warn('[EntrarClient] Error al ingresar como invitado por código:', err);
      setErrorInvitado('Ocurrió un error al verificar el código. Probá de nuevo.');
    } finally {
      setCargandoInvitado(false);
    }
  };

  const handleIngresoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCliente(null);
    setFiestasMultiples(null);

    if (!telefonoCliente.trim() || !claveCliente.trim()) {
      setErrorCliente('Completá tu celular y la clave del portal.');
      return;
    }

    setCargandoCliente(true);
    try {
      const res = await entrarAlPortalPorTelefono(telefonoCliente, claveCliente);
      if (!res.success) {
        setErrorCliente(res.error || 'No encontramos una fiesta con esos datos.');
        return;
      }

      if (res.fiestaId) {
        router.push(`/portal-cliente/${encodeURIComponent(res.fiestaId)}`);
        return;
      }

      if (res.fiestas && res.fiestas.length > 0) {
        setFiestasMultiples(res.fiestas);
      }
    } catch (err) {
      console.warn('[EntrarClient] Error al verificar datos de cliente:', err);
      setErrorCliente('Ocurrió un error al verificar tus datos. Probá nuevamente.');
    } finally {
      setCargandoCliente(false);
    }
  };

  // Inicialización del escáner QR
  useEffect(() => {
    if (!mostrarScanner) return;
    let scanner: any = null;
    let activo = true;

    async function iniciarScanner() {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        if (!activo) return;
        scanner = new Html5QrcodeScanner(
          'qr-reader-entrar',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1,
          },
          false,
        );

        scanner.render(
          (texto: string) => {
            if (!activo) return;
            try {
              scanner.clear();
            } catch (err) {
              console.warn('[EntrarClient] Error cerrando scanner:', err);
            }
            setMostrarScanner(false);

            let targetUrl = '';
            let scannedFiestaId = '';

            if (texto.startsWith('http://') || texto.startsWith('https://')) {
              try {
                const url = new URL(texto);
                targetUrl = url.pathname + url.search;
                scannedFiestaId = url.searchParams.get('fiestaId') || '';
                if (!scannedFiestaId) {
                  const m = url.pathname.match(/\/evento\/hub\/([^/?]+)/) || url.pathname.match(/\/invitacion\/([^/?]+)/);
                  if (m) scannedFiestaId = decodeURIComponent(m[1]);
                }
              } catch (err) {
                console.warn('[EntrarClient] URL de QR inválida:', err);
              }
            } else {
              const matchFiesta = texto.match(/fiestaId=([^&]+)/);
              if (matchFiesta) scannedFiestaId = decodeURIComponent(matchFiesta[1]);
            }

            if (scannedFiestaId) {
              try {
                localStorage.setItem('ak_invitado_fiesta', scannedFiestaId);
              } catch (err) {
                console.warn('[EntrarClient] No se pudo guardar fiestaId del QR:', err);
              }
            }

            if (targetUrl) {
              window.location.href = targetUrl;
            } else if (scannedFiestaId) {
              window.location.href = `/evento/hub/${encodeURIComponent(scannedFiestaId)}`;
            } else if (texto.startsWith('/')) {
              window.location.href = texto;
            } else {
              alert('No reconocimos este código QR de invitación. Probá con el enlace que te mandaron.');
            }
          },
          () => {},
        );
      } catch (e) {
        console.warn('No se pudo inicializar la cámara para el QR:', e);
      }
    }

    void iniciarScanner();

    return () => {
      activo = false;
      if (scanner) {
        try {
          scanner.clear();
        } catch (err) {
          console.warn('[EntrarClient] Error limpiando scanner al desmontar:', err);
        }
      }
    };
  }, [mostrarScanner]);

  const whatsappOlvideClave = buildAkWhatsAppUrl(
    'Hola! Soy cliente de AK Producciones y olvidé la clave de mi portal.',
  );
  const whatsappProveedor = buildAkWhatsAppUrl(
    'Hola AK! Soy proveedor y necesito mi enlace de acceso a la fiesta.',
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Encabezado */}
      <header className="w-full max-w-md mx-auto pt-4 pb-6 text-center">
        <div className="flex justify-center mb-4">
          <CompanyLogo size="lg" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ¿Quién sos?
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Elegí cómo querés entrar a tu experiencia
        </p>
      </header>

      {/* Contenido principal */}
      <main className="w-full max-w-md mx-auto space-y-3.5 flex-1 flex flex-col justify-center">
        {/* 1. Quiero organizar mi fiesta (primero y el más grande, directo al simulador) */}
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-600/20 via-slate-900/90 to-slate-900/80 backdrop-blur-sm p-4 sm:p-5 shadow-xl">
          <Link
            href="/simulador-de-presupuesto?utm_source=app&utm_medium=entrar"
            className="flex items-center justify-between text-left font-bold text-white transition hover:opacity-95 group py-1"
            data-testid="btn-quiero-organizar"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/50">
                <PartyPopper className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white leading-tight">Quiero organizar mi fiesta</p>
                <p className="text-xs text-emerald-200 font-normal mt-1">Armá tu presupuesto al instante, sin registros</p>
              </div>
            </div>
            <span className="text-sm text-emerald-300 font-bold group-hover:translate-x-0.5 transition shrink-0 ml-2">Ir →</span>
          </Link>

          <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-center gap-5 text-xs text-slate-300">
            <Link href="/?utm_source=app" className="hover:text-white underline underline-offset-4 transition">
              Ver la web
            </Link>
            <span className="text-slate-600">·</span>
            <Link href="/#landing-faq" className="hover:text-white underline underline-offset-4 transition">
              Preguntas frecuentes
            </Link>
          </div>
        </div>

        {/* 2. Soy invitado a una fiesta */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm overflow-hidden transition-all duration-200 shadow-lg hover:border-slate-700">
          <button
            type="button"
            onClick={() => toggleSeccion('invitado')}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-white transition hover:bg-slate-800/40"
            data-testid="btn-soy-invitado"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight">Soy invitado a una fiesta</p>
                <p className="text-xs text-slate-400 font-normal mt-0.5">Fotos, música y sorpresas en vivo</p>
              </div>
            </div>
            {seccionAbierta === 'invitado' ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {seccionAbierta === 'invitado' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-5 pt-2 border-t border-slate-800/60 space-y-3"
              >
                {opcionesInvitado ? (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-sm font-semibold text-slate-200">
                      Estás en más de una fiesta. ¿A cuál entrás?
                    </p>
                    <div className="space-y-2">
                      {opcionesInvitado.map((op) => (
                        <button
                          key={op.fiestaId}
                          type="button"
                          disabled={cargandoInvitado}
                          onClick={() => void handleIngresoInvitadoTelefono(undefined, op.fiestaId)}
                          className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-between transition disabled:opacity-60"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-bold">{op.nombreEvento}</p>
                            {op.fechaEvento ? (
                              <p className="text-xs text-slate-400 mt-0.5">{op.fechaEvento.slice(0, 10)}</p>
                            ) : null}
                          </div>
                          <span className="text-xs text-purple-300 font-bold shrink-0 ml-2">Entrar →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => void handleIngresoInvitadoTelefono(e)} className="space-y-3 pt-1">
                    <div>
                      <label htmlFor="telefono-invitado" className="block text-xs font-semibold text-slate-300 mb-1">
                        Tu celular
                      </label>
                      <input
                        id="telefono-invitado"
                        type="tel"
                        value={telefonoInvitado}
                        onChange={(e) => setTelefonoInvitado(e.target.value)}
                        placeholder="Ej: 099 123 456"
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={cargandoInvitado}
                      className="w-full min-h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-lg shadow-purple-950/30"
                    >
                      {cargandoInvitado ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </button>
                  </form>
                )}

                {errorInvitado && (
                  <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg p-2.5">
                    {errorInvitado}
                  </p>
                )}

                <AvisoDeDatos para="invitado" />

                <div className="pt-1 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarIngresoPorCodigo((p) => !p);
                      setErrorInvitado(null);
                    }}
                    className="w-full text-center text-xs text-slate-300 hover:text-white transition flex items-center justify-center gap-1 py-1.5 font-medium"
                  >
                    <span>¿No te encuentra? Entrá con el código de la fiesta</span>
                    {mostrarIngresoPorCodigo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <AnimatePresence>
                    {mostrarIngresoPorCodigo && (
                      <motion.form
                        onSubmit={(e) => void handleIngresoInvitadoCodigo(e)}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-2.5 overflow-hidden"
                      >
                        <div>
                          <label htmlFor="codigo-fiesta-invitado" className="block text-xs font-semibold text-slate-300 mb-1">
                            Código de la fiesta
                          </label>
                          <input
                            id="codigo-fiesta-invitado"
                            type="text"
                            value={codigoFiestaInput}
                            onChange={(e) => setCodigoFiestaInput(e.target.value.toUpperCase())}
                            placeholder="Ej: K7P4QX"
                            maxLength={8}
                            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm font-mono uppercase text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                          />
                        </div>
                        <div>
                          <label htmlFor="nombre-invitado-codigo" className="block text-xs font-semibold text-slate-300 mb-1">
                            Tu nombre
                          </label>
                          <input
                            id="nombre-invitado-codigo"
                            type="text"
                            value={nombreInvitadoInput}
                            onChange={(e) => setNombreInvitadoInput(e.target.value)}
                            placeholder="Nombre y apellido"
                            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={cargandoInvitado}
                          className="w-full min-h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-60"
                        >
                          {cargandoInvitado ? 'Verificando...' : 'Entrar con código'}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setMostrarScanner(true)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition py-1"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Tengo el QR de la invitación</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Soy cliente de AK */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm overflow-hidden transition-all duration-200 shadow-lg hover:border-slate-700">
          <button
            type="button"
            onClick={() => toggleSeccion('cliente')}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-white transition hover:bg-slate-800/40"
            data-testid="btn-soy-cliente"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight">Soy cliente de AK</p>
                <p className="text-xs text-slate-400 font-normal mt-0.5">Accedé al portal privado de tu fiesta</p>
              </div>
            </div>
            {seccionAbierta === 'cliente' ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {seccionAbierta === 'cliente' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-5 pt-1 border-t border-slate-800/60"
              >
                {fiestasMultiples ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-sm font-semibold text-slate-200">
                      Encontramos estas fiestas con tus datos. ¿Cuál querés abrir?
                    </p>
                    <div className="space-y-2">
                      {fiestasMultiples.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => router.push(`/portal-cliente/${encodeURIComponent(f.id)}`)}
                          className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-between transition"
                        >
                          <span className="truncate">{f.nombreEvento}</span>
                          <span className="text-xs text-red-400 font-bold shrink-0 ml-2">Abrir →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleIngresoCliente} className="space-y-3.5 pt-2">
                    <div>
                      <label htmlFor="telefono-cliente" className="block text-xs font-semibold text-slate-300 mb-1">
                        Tu celular
                      </label>
                      <input
                        id="telefono-cliente"
                        type="tel"
                        value={telefonoCliente}
                        onChange={(e) => setTelefonoCliente(e.target.value)}
                        placeholder="Ej: 099 123 456"
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="clave-cliente" className="block text-xs font-semibold text-slate-300 mb-1">
                        Clave del portal
                      </label>
                      <div className="relative">
                        <input
                          id="clave-cliente"
                          type={mostrarClave ? 'text' : 'password'}
                          value={claveCliente}
                          onChange={(e) => setClaveCliente(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarClave((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          aria-label={mostrarClave ? 'Ocultar clave' : 'Mostrar clave'}
                        >
                          {mostrarClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {errorCliente && (
                      <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg p-2.5">
                        {errorCliente}
                      </p>
                    )}

                    <AvisoDeDatos para="cliente" />

                    <button
                      type="submit"
                      disabled={cargandoCliente}
                      className="w-full min-h-11 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-lg shadow-red-950/30"
                    >
                      {cargandoCliente ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                        </>
                      ) : (
                        'Entrar a mi fiesta'
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <a
                        href={whatsappOlvideClave}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1 underline underline-offset-4"
                      >
                        Olvidé mi clave
                      </a>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Soy del equipo */}
        <Link
          href="/login?con=google"
          className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-4 sm:p-5 flex items-center justify-between text-left font-bold text-white transition-all duration-200 shadow-lg hover:border-slate-700 hover:bg-slate-800/40 group block"
          data-testid="btn-soy-del-equipo"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-white leading-tight">Soy del equipo</p>
              <p className="text-xs text-slate-400 font-normal mt-0.5">Panel de administración y operaciones</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 group-hover:text-white transition">Entrar →</span>
        </Link>

        {/* 5. Soy proveedor */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm overflow-hidden transition-all duration-200 shadow-lg hover:border-slate-700">
          <button
            type="button"
            onClick={() => toggleSeccion('proveedor')}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-white transition hover:bg-slate-800/40"
            data-testid="btn-soy-proveedor"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight">Soy proveedor</p>
                <p className="text-xs text-slate-400 font-normal mt-0.5">Salones, sonido, catering y servicios</p>
              </div>
            </div>
            {seccionAbierta === 'proveedor' ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {seccionAbierta === 'proveedor' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-5 pt-2 border-t border-slate-800/60 space-y-3"
              >
                <p className="text-xs text-slate-300 leading-relaxed">
                  Entrá con el enlace que te mandó AK por WhatsApp.
                </p>
                <a
                  href={whatsappProveedor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-11 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/30"
                >
                  <ExternalLink className="h-4 w-4" />
                  Pedir mi enlace
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Pie con texto para el personal y botón de instalar / Google Play */}
      <footer className="w-full max-w-md mx-auto pt-6 pb-4 text-center space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          ¿Sos del personal y te mandaron un enlace? Abrilo desde WhatsApp y se abre acá.
        </p>
        <div className="pt-1">
          <BajaLaApp compact label="Bajá la app de AK" />
        </div>
      </footer>

      {/* Modal Lector QR */}
      <AnimatePresence>
        {mostrarScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-purple-400" />
                  Escanear invitación
                </h3>
                <button
                  type="button"
                  onClick={() => setMostrarScanner(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
                  aria-label="Cerrar lector"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl bg-black min-h-[260px] flex items-center justify-center">
                <div id="qr-reader-entrar" className="w-full text-slate-900" />
              </div>

              <p className="text-xs text-slate-400 text-center">
                Apuntá la cámara al código QR que te compartieron en tu invitación.
              </p>

              <button
                type="button"
                onClick={() => setMostrarScanner(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
