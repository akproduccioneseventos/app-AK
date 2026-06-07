'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, ImagePlus, RotateCcw, Save, Sparkles } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ASSISTANT_PERSONA_STORAGE_KEY,
  ASSISTANT_PERSONAS,
  type AssistantPersonaId,
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

function persistOverrides(next: AssistantPersonaOverrideMap) {
  localStorage.setItem(ASSISTANT_PERSONA_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('ak-assistant-personas-updated'));
}

export default function ContextualAssistantsSettingsPage() {
  const [overrides, setOverrides] = useState<AssistantPersonaOverrideMap>({});

  useEffect(() => {
    setOverrides(readOverrides());
  }, []);

  const updateColor = (id: AssistantPersonaId, color: string) => {
    const next = { ...overrides, [id]: { ...overrides[id], color } };
    setOverrides(next);
    persistOverrides(next);
  };

  const updatePhoto = (id: AssistantPersonaId, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...overrides, [id]: { ...overrides[id], avatarUrl: String(reader.result || '') } };
      setOverrides(next);
      persistOverrides(next);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const resetPersona = (id: AssistantPersonaId) => {
    const next = { ...overrides };
    delete next[id];
    setOverrides(next);
    persistOverrides(next);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/settings/lanzamiento-cto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel CTO
            </Link>
          </Button>
          <Badge className="bg-slate-900 text-white hover:bg-slate-900">Asistentes por modulo</Badge>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-slate-200 bg-white">
            <CardContent className="space-y-4 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-slate-700" />
                Identidad visual del equipo IA
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Asistentes contextuales AK</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Cada asistente se activa visualmente segun la pantalla donde estes: secretaria, contador, marketing, organizador, salones/decoracion o CTO. Aca podes ponerles color y foto para diferenciarlos rapido.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle>Como funciona</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Cuando entras a clientes o CRM aparece la secretaria. En facturas y pagos aparece contable. En salones y decoracion aparece el asistente visual. En ajustes aparece CTO.</p>
              <p>La foto y el color quedan guardados en este navegador para que la experiencia sea simple y rapida.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {ASSISTANT_PERSONAS.map((persona) => {
            const color = overrides[persona.id]?.color || persona.color;
            const avatarUrl = overrides[persona.id]?.avatarUrl || persona.avatarUrl;
            return (
              <Card key={persona.id} className="border-slate-200 bg-white">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Avatar className="h-14 w-14 border-2" style={{ borderColor: color }}>
                      <AvatarImage src={avatarUrl} alt={persona.name} />
                      <AvatarFallback className="text-white" style={{ backgroundColor: color }}>
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <Badge variant="outline">{persona.role}</Badge>
                  </div>
                  <CardTitle className="text-lg">{persona.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Color del asistente</Label>
                    <div className="flex items-center gap-2">
                      <Input type="color" value={color} onChange={(event) => updateColor(persona.id, event.target.value)} className="h-10 w-14 p-1" />
                      <Input value={color} onChange={(event) => updateColor(persona.id, event.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Foto o avatar</Label>
                    <Input type="file" accept="image/*" onChange={(event) => updatePhoto(persona.id, event)} />
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="mb-1 font-bold text-slate-800">Se activa en:</p>
                    <p>{persona.routeMatchers.join(', ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => resetPersona(persona.id)}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button type="button" className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={() => persistOverrides(overrides)}>
                      <Save className="mr-2 h-4 w-4" /> Guardado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
