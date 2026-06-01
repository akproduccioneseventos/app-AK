'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Camera, Settings2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ASSISTANT_PERSONA_STORAGE_KEY,
  applyAssistantPersonaOverrides,
  getAssistantPersonaByPath,
  type AssistantPersonaOverrideMap,
} from '@/lib/assistant/contextual-assistants';

function readOverrides(): AssistantPersonaOverrideMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(ASSISTANT_PERSONA_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function openAssistantWidget() {
  const button = document.querySelector<HTMLButtonElement>('[aria-label="Abrir Asistente AK"]');
  button?.click();
}

export function ContextualAssistantIndicator() {
  const pathname = usePathname();
  const [overrides, setOverrides] = useState<AssistantPersonaOverrideMap>({});

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

  return (
    <div className="fixed right-5 top-20 z-30 hidden max-w-[250px] rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-lg backdrop-blur print:hidden xl:block">
      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}
