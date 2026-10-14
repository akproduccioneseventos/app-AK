'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Camera, GripVertical, Minus, Settings2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ASSISTANT_PERSONA_STORAGE_KEY,
  applyAssistantPersonaOverrides,
  getAssistantPersonaByPath,
  type AssistantPersonaOverrideMap,
} from '@/lib/assistant/contextual-assistants';
import { useEsVistaDelCliente } from '@/hooks/use-es-vista-del-cliente';
import { elegirPosicionAsistente, type RectanguloUI, type PosicionAsistente } from '@/lib/assistant/posicion-segura';

function readOverrides(): AssistantPersonaOverrideMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(ASSISTANT_PERSONA_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * La tarjeta del asistente se puede MINIMIZAR y MOVER (pedido del dueño, 9/10/2026: "molesta a la
 * derecha, no lo puedo mover ni minimizar"). Lo que elige queda guardado en este navegador.
 */
const CLAVE_POSICION = 'ak-asistente-tarjeta';
interface PreferenciaTarjeta { minimizada: boolean; abajo: number; derecha: number }
const PREFERENCIA_INICIAL: PreferenciaTarjeta = { minimizada: false, abajo: 160, derecha: 16 };

function leerPreferencia(): PreferenciaTarjeta {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE_POSICION) || 'null');
    if (guardada && typeof guardada === 'object') return { ...PREFERENCIA_INICIAL, ...guardada };
  } catch {
    // no pasa nada si falla: se usa la posición de siempre.
  }
  return PREFERENCIA_INICIAL;
}

function guardarPreferencia(p: PreferenciaTarjeta) {
  try {
    localStorage.setItem(CLAVE_POSICION, JSON.stringify(p));
  } catch {
    // no pasa nada si falla: la elección dura hasta recargar.
  }
}

function openAssistantWidget() {
  const button = document.querySelector<HTMLButtonElement>('[aria-label="Abrir Asistente IA AK"]');
  button?.click();
}

export function ContextualAssistantIndicator() {
  const pathname = usePathname();
  const [overrides, setOverrides] = useState<AssistantPersonaOverrideMap>({});
  const esVistaDelCliente = useEsVistaDelCliente(pathname || '/');
  const [pref, setPref] = useState<PreferenciaTarjeta>(PREFERENCIA_INICIAL);
  const [posicionVisual, setPosicionVisual] = useState<PosicionAsistente>({
    bottom: PREFERENCIA_INICIAL.abajo,
    right: PREFERENCIA_INICIAL.derecha,
  });
  const tarjetaRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; y: number; abajo: number; derecha: number } | null>(null);

  useEffect(() => {
    setPref(leerPreferencia());
  }, []);

  useEffect(() => {
    if (pref.minimizada || !tarjetaRef.current) return;
    const tarjeta = tarjetaRef.current;
    let frame = 0;
    const medir = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const controles = Array.from(document.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [role="button"]',
        )).filter((el) => !tarjeta.contains(el) && el.getClientRects().length > 0
          && getComputedStyle(el).visibility !== 'hidden');
        const obstaculos: RectanguloUI[] = controles.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, right: r.right, bottom: r.bottom, left: r.left };
        });
        const r = tarjeta.getBoundingClientRect();
        setPosicionVisual(elegirPosicionAsistente(
          { width: window.innerWidth, height: window.innerHeight },
          { width: r.width, height: r.height },
          { bottom: pref.abajo, right: pref.derecha },
          obstaculos,
        ));
      });
    };
    const observer = new ResizeObserver(medir);
    observer.observe(document.documentElement);
    window.addEventListener('scroll', medir, true);
    window.addEventListener('resize', medir);
    medir();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', medir, true);
      window.removeEventListener('resize', medir);
    };
  }, [pathname, pref.abajo, pref.derecha, pref.minimizada]);

  const cambiar = (nueva: PreferenciaTarjeta) => {
    setPref(nueva);
    guardarPreferencia(nueva);
  };

  const empezarArrastre = (e: React.PointerEvent) => {
    arrastre.current = {
      x: e.clientX,
      y: e.clientY,
      abajo: posicionVisual.bottom,
      derecha: posicionVisual.right,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const moverArrastre = (e: React.PointerEvent) => {
    const a = arrastre.current;
    if (!a) return;
    const maxAbajo = Math.max(16, window.innerHeight - 80);
    const maxDerecha = Math.max(16, window.innerWidth - 80);
    setPref((p) => ({
      ...p,
      abajo: Math.min(maxAbajo, Math.max(8, a.abajo - (e.clientY - a.y))),
      derecha: Math.min(maxDerecha, Math.max(8, a.derecha - (e.clientX - a.x))),
    }));
  };
  const soltarArrastre = () => {
    if (!arrastre.current) return;
    arrastre.current = null;
    setPref((p) => {
      guardarPreferencia(p);
      return p;
    });
  };

  useEffect(() => {
    setOverrides(readOverrides());
    const handleStorage = () => setOverrides(readOverrides());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('ak-assistant-personas-updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('ak-assistant-personas-updated', handleStorage);
    };
  }, []);

  const persona = useMemo(
    () => applyAssistantPersonaOverrides(getAssistantPersonaByPath(pathname || '/'), overrides),
    [pathname, overrides],
  );

  if (pref.minimizada) {
    return (
      <button
        type="button"
        onClick={() => cambiar({ ...pref, minimizada: false })}
        className="fixed z-30 hidden h-10 w-10 items-center justify-center rounded-full border-2 bg-white shadow-lg print:hidden xl:flex"
        style={{ bottom: pref.abajo, right: pref.derecha, borderColor: persona.color }}
        title="Mostrar el asistente"
        aria-label="Mostrar el asistente"
      >
        <Bot className="h-4 w-4" style={{ color: persona.color }} />
      </button>
    );
  }

  return (
    <div
      ref={tarjetaRef}
      className="fixed z-30 hidden max-w-[250px] rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-lg backdrop-blur print:hidden xl:block"
      style={{ bottom: posicionVisual.bottom, right: posicionVisual.right }}
    >
      <div className="flex items-center gap-2">
        <span
          onPointerDown={empezarArrastre}
          onPointerMove={moverArrastre}
          onPointerUp={soltarArrastre}
          onPointerCancel={soltarArrastre}
          className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          title="Arrastrá para mover el asistente"
          aria-label="Mover el asistente"
          role="button"
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <button
          type="button"
          onClick={openAssistantWidget}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1.5 py-1 text-left transition hover:bg-slate-50"
          title="Abrir asistente activo"
        >
          <Avatar className="h-10 w-10 border-2" style={{ borderColor: persona.color }}>
            <AvatarImage src={persona.avatarUrl} alt={persona.name} />
            <AvatarFallback className="text-white" style={{ backgroundColor: persona.color }}>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-xs font-black text-slate-900">{persona.shortName}</span>
            <span className="block truncate text-[11px] font-medium text-slate-500">{persona.role}</span>
          </span>
        </button>
        {/* Ajustes del equipo: el cliente que abre su enlace no los ve (Codex, auditoria 79). */}
        {!esVistaDelCliente && (<>
        <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-slate-500" title="Personalizar asistentes">
          <Link href="/settings/asistentes-contextuales">
            <Camera className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-slate-500" title="Ver sincronizaciones">
          <Link href="/settings/sincronizaciones">
            <Settings2 className="h-4 w-4" />
          </Link>
        </Button>
        </>)}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-slate-500"
          title="Minimizar el asistente"
          aria-label="Minimizar el asistente"
          onClick={() => cambiar({ ...pref, minimizada: true })}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
