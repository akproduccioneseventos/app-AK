'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Check,
  Edit3,
  X,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { getMisPermisos } from '@/app/actions/sesion';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  getCentroDeControlDatos,
  aprobarItemOK,
  rechazarItemOK,
  actualizarReglaIA,
  darOrdenPorVozOTexto,
  type ItemOK,
  type AccionSolaItem,
} from '@/app/actions/centro-de-control';
import type { ReglaIA, ReglaModo } from '@/lib/ia/reglas-de-la-ia';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CentroDeControlPage() {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(true);

  // Datos del centro de control
  const [itemsOK, setItemsOK] = useState<ItemOK[]>([]);
  const [reglas, setReglas] = useState<ReglaIA[]>([]);
  const [accionesSolas, setAccionesSolas] = useState<AccionSolaItem[]>([]);
  const [resumenMensual, setResumenMensual] = useState<string>('');

  // Estado para la orden directa
  const [ordenTexto, setOrdenTexto] = useState('');
  const [enviandoOrden, setEnviandoOrden] = useState(false);
  const [respuestaOrden, setRespuestaOrden] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);
  const [escuchando, setEscuchando] = useState(false);
  const [soportaVoz, setSoportaVoz] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Estado para edición en "Para tu OK"
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState<string>('');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [avisoRegla, setAvisoRegla] = useState<string | null>(null);
  const [errorOk, setErrorOk] = useState<string | null>(null);

  // Pestaña activa
  const [pestanaActiva, setPestanaActiva] = useState('para-tu-ok');

  useEffect(() => {
    let montado = true;

    // Verificar si el navegador soporta voz
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSoportaVoz(true);
    }

    async function cargarInicial() {
      try {
        const misPerms = await getMisPermisos();
        const tieneAdmin = misPerms.permisos.includes(PERMISOS.ADMINISTRACION);
        if (!montado) return;
        setAutorizado(tieneAdmin);

        if (tieneAdmin) {
          const datos = await getCentroDeControlDatos();
          if (!montado) return;
          setItemsOK(datos.paraTuOk || []);
          setReglas(datos.reglas || []);
          setAccionesSolas(datos.loQueHizoSola || []);
          setResumenMensual(datos.resumenMensual || '');
        }
      } catch (err) {
        console.error('[Centro de Control] Error cargando datos:', err);
      } finally {
        if (montado) setCargando(false);
      }
    }

    cargarInicial();
    return () => {
      montado = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Manejo de dictado por voz
  const toggleEscucha = () => {
    if (!soportaVoz) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (escuchando) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setEscuchando(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-UY';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setOrdenTexto((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setEscuchando(false);
      };

      recognition.onerror = () => {
        setEscuchando(false);
      };

      recognition.onend = () => {
        setEscuchando(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setEscuchando(true);
    } catch {
      setEscuchando(false);
    }
  };

  // Enviar orden a la IA
  const handlePedirAIA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ordenTexto.trim() || enviandoOrden) return;

    setEnviandoOrden(true);
    setRespuestaOrden(null);

    try {
      const res = await darOrdenPorVozOTexto(ordenTexto.trim());
      setRespuestaOrden({
        tipo: res.success ? 'exito' : 'error',
        mensaje: res.mensaje,
      });

      // Si fue exitoso, refrescar datos de fondo
      if (res.success) {
        setOrdenTexto('');
        getCentroDeControlDatos().then((nuevos) => {
          setItemsOK(nuevos.paraTuOk || []);
          setAccionesSolas(nuevos.loQueHizoSola || []);
        });
      }
    } catch (err: any) {
      setRespuestaOrden({
        tipo: 'error',
        mensaje: err.message || 'Hubo un error al procesar tu pedido.',
      });
    } finally {
      setEnviandoOrden(false);
    }
  };

  // Acciones en "Para tu OK"
  const handleAprobar = async (item: ItemOK, nuevoTexto?: string) => {
    setProcesandoId(item.id);
    setErrorOk(null);

    // Si es WhatsApp y tiene enlace, abrirlo en nueva pestaña
    if (item.enlaceWhatsapp) {
      // El enlace lleva el texto aprobado (el corregido, si lo cambió), no el original.
      const textoAprobado = nuevoTexto && nuevoTexto.trim() !== '' ? nuevoTexto : item.texto;
      const enlace = item.telefono
        ? `https://api.whatsapp.com/send?phone=${String(item.telefono).replace(/\D/g, '')}&text=${encodeURIComponent(textoAprobado)}`
        : item.enlaceWhatsapp;
      window.open(enlace, '_blank');
    }

    // Feedback optimista: quitar de la lista inmediatamente
    setItemsOK((prev) => prev.filter((i) => i.id !== item.id));
    setEditandoId(null);

    try {
      const res = await aprobarItemOK(item.id, item.origen, item.tipoTarea, item.texto, nuevoTexto);
      if (!res.success) {
        // No salió: la tarjeta vuelve a la lista y se dice por qué.
        setItemsOK((prev) => (prev.some((i) => i.id === item.id) ? prev : [item, ...prev]));
        if (nuevoTexto !== undefined) setEditandoId(item.id); // la edición no se pierde
        setErrorOk(res.error || 'No se pudo aprobar. Probá de nuevo.');
      }
    } catch (err) {
      console.error('[Centro de Control] Error al aprobar:', err);
      setItemsOK((prev) => (prev.some((i) => i.id === item.id) ? prev : [item, ...prev]));
      if (nuevoTexto !== undefined) setEditandoId(item.id);
      setErrorOk('No se pudo aprobar. Probá de nuevo.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (item: ItemOK) => {
    setProcesandoId(item.id);
    setErrorOk(null);

    // Feedback optimista: quitar de la lista inmediatamente
    setItemsOK((prev) => prev.filter((i) => i.id !== item.id));
    if (editandoId === item.id) setEditandoId(null);

    try {
      const res = await rechazarItemOK(item.id, item.origen, item.tipoTarea, item.texto);
      if (!res.success) {
        setItemsOK((prev) => (prev.some((i) => i.id === item.id) ? prev : [item, ...prev]));
        setErrorOk(res.error || 'No se pudo descartar. Probá de nuevo.');
      }
    } catch (err) {
      console.error('[Centro de Control] Error al rechazar:', err);
      setItemsOK((prev) => (prev.some((i) => i.id === item.id) ? prev : [item, ...prev]));
      setErrorOk('No se pudo descartar. Probá de nuevo.');
    } finally {
      setProcesandoId(null);
    }
  };

  // Cambiar regla de la IA
  const handleCambiarRegla = async (tareaId: string, nuevoModo: ReglaModo) => {
    // Actualización optimista en estado local
    setReglas((prev) =>
      prev.map((r) => (r.id === tareaId ? { ...r, modo: nuevoModo } : r))
    );

    setAvisoRegla(null);
    try {
      const res = await actualizarReglaIA(tareaId, nuevoModo);
      if (!res.success) {
        setAvisoRegla(`Error: ${res.error || 'No se pudo actualizar la regla'}`);
        getCentroDeControlDatos().then((d) => setReglas(d.reglas || []));
        return;
      }
      setAvisoRegla('¡Regla actualizada con éxito!');
      setTimeout(() => setAvisoRegla(null), 3500);
    } catch (err: any) {
      setAvisoRegla(`Error: ${err.message || 'No se pudo actualizar la regla'}`);
      // Revertir
      getCentroDeControlDatos().then((d) => setReglas(d.reglas || []));
    }
  };

  // Pantalla de carga
  if (cargando) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">Cargando el Centro de Control...</h2>
        <p className="text-sm text-slate-500">Preparando tus reglas y tareas pendientes.</p>
      </div>
    );
  }

  // Pantalla si no tiene permisos
  if (autorizado === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-slate-600 text-sm">
          El Centro de Control está reservado para el dueño y administradores generales de AK Producciones.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Encabezado Principal */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <Bot className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Centro de Control
          </h1>
          <p className="text-sm md:text-base text-slate-500">
            Mandale a la IA, dale el visto bueno a lo que preparó y mirá cómo aprende de vos.
          </p>
        </div>
      </div>

      {/* Caja Superior Grande: ¿Qué querés que haga? */}
      <Card className="border-2 border-indigo-100 shadow-lg shadow-indigo-50/50 bg-gradient-to-b from-white to-indigo-50/20 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-5 md:px-7">
          <CardTitle className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            ¿Qué querés que haga?
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 md:px-7 pb-6 space-y-4">
          <form onSubmit={handlePedirAIA} className="space-y-3">
            <div className="relative">
              <textarea
                value={ordenTexto}
                onChange={(e) => setOrdenTexto(e.target.value)}
                placeholder='Por ejemplo: "armale la web a la fiesta de Sofía" o "prepará los seguimientos de la semana"...'
                rows={3}
                className="w-full p-4 pr-14 text-base md:text-lg rounded-xl border border-slate-200 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400 resize-none"
              />
              <button
                type="button"
                onClick={toggleEscucha}
                title={soportaVoz ? (escuchando ? 'Detener micrófono' : 'Hablar por micrófono') : 'Micrófono no soportado en este navegador'}
                disabled={!soportaVoz}
                className={`absolute right-3 bottom-3 p-3 rounded-xl transition-all ${
                  escuchando
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200'
                    : soportaVoz
                    ? 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                {escuchando ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {escuchando ? '🎙️ Escuchando... hablá con tranquilidad.' : 'Podés escribir o tocar el micrófono para hablar.'}
              </span>
              <Button
                type="submit"
                disabled={enviandoOrden || !ordenTexto.trim()}
                className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-xl shadow-md shadow-indigo-200 gap-2 transition-all active:scale-95"
              >
                {enviandoOrden ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Pensando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Pedir a la IA
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Aviso o tarjeta de respuesta */}
          {respuestaOrden && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                respuestaOrden.tipo === 'exito'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {respuestaOrden.tipo === 'exito' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm md:text-base font-medium leading-relaxed">
                  {respuestaOrden.mensaje}
                </p>
              </div>
              <button
                onClick={() => setRespuestaOrden(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selector de Pestañas con nombres EXACTOS */}
      <Tabs value={pestanaActiva} onValueChange={setPestanaActiva} className="w-full space-y-6">
        <TabsList className="w-full grid grid-cols-3 h-14 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
          <TabsTrigger
            value="para-tu-ok"
            className="rounded-xl text-sm md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            Para tu OK
            {itemsOK.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-600 text-white font-bold ml-1">
                {itemsOK.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="tus-reglas"
            className="rounded-xl text-sm md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
          >
            Tus reglas
          </TabsTrigger>
          <TabsTrigger
            value="lo-que-hizo-sola"
            className="rounded-xl text-sm md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
          >
            Lo que hizo sola
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* PESTAÑA 1: PARA TU OK */}
        {/* ============================================================== */}
        <TabsContent value="para-tu-ok" className="space-y-4 focus-visible:outline-none">
          {/* Contador superior exacto */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <h2 className="text-base md:text-lg font-bold text-slate-800">
              Tenés {itemsOK.length} cosas para mirar
            </h2>
            <Badge variant="outline" className="font-semibold text-xs border-indigo-200 text-indigo-700 bg-indigo-50">
              Revisión rápida
            </Badge>
          </div>

          {errorOk && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {errorOk}
            </div>
          )}

          {itemsOK.length === 0 ? (
            <Card className="border border-dashed border-slate-300 p-8 text-center rounded-2xl bg-white space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">¡Todo al día, bo!</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No tenés propuestas ni mensajes esperando tu visto bueno en este momento.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {itemsOK.map((item) => {
                const enEdicion = editandoId === item.id;
                const procesando = procesandoId === item.id;

                return (
                  <Card
                    key={item.id}
                    className="border border-slate-200 shadow-md rounded-2xl bg-white overflow-hidden transition-all hover:border-indigo-200"
                  >
                    <div className="p-5 md:p-6 space-y-4">
                      {/* Cabecera de la tarjeta */}
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                            {item.tipo}
                          </span>
                          <h3 className="text-base md:text-lg font-bold text-slate-900 mt-1.5">
                            {item.titulo}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-medium">Destinatario</span>
                          <span className="text-sm font-semibold text-slate-800">{item.destinatario}</span>
                        </div>
                      </div>

                      {/* Texto propuesto o editor */}
                      {enEdicion ? (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            Editar texto a tu gusto:
                          </label>
                          <textarea
                            value={textoEditado}
                            onChange={(e) => setTextoEditado(e.target.value)}
                            rows={4}
                            className="w-full p-3 text-sm md:text-base border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditandoId(null)}
                              className="text-slate-600 font-semibold"
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAprobar(item, textoEditado)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                            >
                              Confirmar cambio y aprobar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-800 text-sm md:text-base whitespace-pre-wrap leading-relaxed font-normal">
                          {item.texto}
                        </div>
                      )}

                      {/* Tres botones grandes requeridos */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                        {/* Botón 1: Sí, hacelo */}
                        <Button
                          disabled={procesando}
                          onClick={() => handleAprobar(item)}
                          className="h-12 text-sm md:text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm gap-2"
                        >
                          <Check className="w-5 h-5" />
                          Sí, hacelo
                        </Button>

                        {/* Botón 2: Cambiar */}
                        <Button
                          disabled={procesando}
                          variant="outline"
                          onClick={() => {
                            setEditandoId(item.id);
                            setTextoEditado(item.texto);
                          }}
                          className="h-12 text-sm md:text-base font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl gap-2"
                        >
                          <Edit3 className="w-5 h-5 text-indigo-600" />
                          Cambiar
                        </Button>

                        {/* Botón 3: No */}
                        <Button
                          disabled={procesando}
                          variant="outline"
                          onClick={() => handleRechazar(item)}
                          className="h-12 text-sm md:text-base font-bold border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl gap-2"
                        >
                          <X className="w-5 h-5 text-rose-600" />
                          No
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ============================================================== */}
        {/* PESTAÑA 2: TUS REGLAS */}
        {/* ============================================================== */}
        <TabsContent value="tus-reglas" className="space-y-4 focus-visible:outline-none">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                Reglas de autonomía de la IA
              </h2>
              <p className="text-xs md:text-sm text-slate-500">
                Elegí con total libertad qué hace sola, qué te consulta y qué queda apagado.
              </p>
            </div>
          </div>

          {avisoRegla && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              {avisoRegla}
            </div>
          )}

          <div className="space-y-3">
            {reglas.map((regla) => {
              const estaProhibidaSola = Boolean(regla.prohibidaSola);

              return (
                <Card
                  key={regla.id}
                  className="p-5 border border-slate-200 shadow-sm rounded-2xl bg-white space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{regla.nombre}</h3>
                        {regla.categoria && (
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {regla.categoria}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-slate-500">{regla.descripcion}</p>
                    </div>

                    {/* Selector con las 3 opciones exactas */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
                      {/* Opción Sola */}
                      <button
                        type="button"
                        disabled={estaProhibidaSola}
                        onClick={() => handleCambiarRegla(regla.id, 'sola')}
                        className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                          regla.modo === 'sola'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : estaProhibidaSola
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                        title={estaProhibidaSola ? 'Por seguridad, esta tarea no puede ir sola' : 'La IA actúa automáticamente'}
                      >
                        Sola
                      </button>

                      {/* Opción Preguntame antes */}
                      <button
                        type="button"
                        onClick={() => handleCambiarRegla(regla.id, 'preguntar')}
                        className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                          regla.modo === 'preguntar'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                        title="Te deja una tarjeta en 'Para tu OK' antes de ejecutar"
                      >
                        Preguntame antes
                      </button>

                      {/* Opción Apagada */}
                      <button
                        type="button"
                        onClick={() => handleCambiarRegla(regla.id, 'apagada')}
                        className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                          regla.modo === 'apagada'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                        title="La tarea queda inactiva"
                      >
                        Apagada
                      </button>
                    </div>
                  </div>

                  {/* Aviso de seguridad si está prohibida sola */}
                  {estaProhibidaSola && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50/70 p-2 rounded-lg">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Por seguridad, esta tarea no puede ir sola</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* PESTAÑA 3: LO QUE HIZO SOLA */}
        {/* ============================================================== */}
        <TabsContent value="lo-que-hizo-sola" className="space-y-4 focus-visible:outline-none">
          {/* Caja con el resumen mensual del aprendizaje */}
          <Card className="border-2 border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white p-5 md:p-6 rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm md:text-base">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Resumen mensual de aprendizaje</span>
            </div>
            <p className="text-base md:text-lg font-semibold text-slate-800 leading-relaxed">
              {resumenMensual || 'Este mes aprendí: a respetar tus decisiones y afinar las propuestas automáticas.'}
            </p>
          </Card>

          {/* Lista de acciones tomadas sola */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-1">
              Registro de acciones autónomas recientes
            </h3>

            {accionesSolas.length === 0 ? (
              <Card className="p-8 text-center rounded-2xl border border-slate-200 bg-white">
                <p className="text-sm text-slate-500">
                  Aún no hay acciones registradas en modo autónomo.
                </p>
              </Card>
            ) : (
              accionesSolas.map((accion) => (
                <Card
                  key={accion.id}
                  className="p-4 md:p-5 border border-slate-200 shadow-sm rounded-2xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {accion.tipo}
                      </span>
                      <span className="text-xs text-slate-400">
                        {accion.fecha ? new Date(accion.fecha).toLocaleString('es-UY') : ''}
                      </span>
                    </div>
                    <p className="text-sm md:text-base font-semibold text-slate-800">
                      {accion.descripcion}
                    </p>
                  </div>

                  {accion.enlace && (
                    <a
                      href={accion.enlace}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all shrink-0 self-start sm:self-center"
                    >
                      Ver
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
