'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Save, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getWhatsAppProspectosCrmSettings,
  saveWhatsAppProspectosCrmSettings,
} from '@/app/actions/whatsapp';
import {
  getSettingsAsistenteAction,
  saveSettingsAsistenteAction,
} from '@/app/actions/asistente-proactivo.actions';

export function WhatsAppProspectosCrmCard() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [asistenteProspectosWhatsApp, setAsistenteProspectosWhatsApp] = useState(false);
  const [numerosPersonales, setNumerosPersonales] = useState<string[]>([]);
  const [nuevoNumero, setNuevoNumero] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getWhatsAppProspectosCrmSettings(),
      getSettingsAsistenteAction().catch(() => null),
    ])
      .then(([res, resAsistente]) => {
        if (!mounted) return;
        setEnabled(Boolean(res.llevarWhatsAppProspectosAlCrm));
        setNumerosPersonales(Array.isArray(res.numerosPersonales) ? res.numerosPersonales : []);
        if (resAsistente?.success && resAsistente.settings) {
          setAsistenteProspectosWhatsApp(Boolean(resAsistente.settings.asistenteProspectosWhatsApp));
        }
      })
      .catch(() => {
        // Si no tiene permiso o falla lectura, queda apagado por defecto
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const agregarNumero = () => {
    const limpio = nuevoNumero.trim();
    if (!limpio) return;
    if (numerosPersonales.includes(limpio)) {
      setNuevoNumero('');
      return;
    }
    setNumerosPersonales((prev) => [...prev, limpio]);
    setNuevoNumero('');
  };

  const quitarNumero = (numero: string) => {
    setNumerosPersonales((prev) => prev.filter((n) => n !== numero));
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const [res] = await Promise.all([
        saveWhatsAppProspectosCrmSettings({
          llevarWhatsAppProspectosAlCrm: enabled,
          numerosPersonales,
        }),
        saveSettingsAsistenteAction({
          asistenteProspectosWhatsApp,
        }).catch(() => null),
      ]);
      if (res.success) {
        setEnabled(res.llevarWhatsAppProspectosAlCrm);
        setNumerosPersonales(res.numerosPersonales);
        toast({
          title: 'Ajustes guardados',
          description: enabled
            ? 'Los WhatsApp de prospectos ahora pasan al CRM.'
            : 'El ingreso de WhatsApp al CRM quedó apagado.',
        });
      } else {
        toast({
          title: 'Error',
          description: res.error || 'No se pudieron guardar los ajustes.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Error inesperado al guardar.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-lg border-emerald-200/80">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600" />
          Prospectos de WhatsApp al CRM
          <Badge variant={enabled ? 'default' : 'secondary'}>
            {enabled ? 'Activo' : 'Apagado'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Controlá si los mensajes de WhatsApp de prospectos entran automáticamente a la ficha del CRM y qué números personales quedan siempre afuera.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando opciones...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30 gap-4">
              <Label htmlFor="llevar-crm-whatsapp" className="flex flex-col space-y-1 cursor-pointer">
                <span className="text-base font-medium">Llevar al CRM los WhatsApp de prospectos</span>
                <span className="font-normal text-muted-foreground text-sm">
                  {enabled
                    ? 'Activo: anuncios, prospectos existentes, enlaces (ref AK-...) y consultas nuevas de eventos entran al CRM.'
                    : 'Apagado por defecto: todo funciona como hoy y ningún WhatsApp común entra solo al CRM.'}
                </span>
              </Label>
              <Switch
                id="llevar-crm-whatsapp"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30 gap-4">
              <Label htmlFor="asistente-prospectos-whatsapp" className="flex flex-col space-y-1 cursor-pointer">
                <span className="text-base font-medium">El asistente contesta a los prospectos</span>
                <span className="font-normal text-muted-foreground text-sm">
                  {asistenteProspectosWhatsApp
                    ? 'Prendido: responde a prospectos habilitados; números personales, personal y nota <= 2 nunca reciben respuesta.'
                    : 'Apagado de entrada: el asistente no responde solo a los prospectos de WhatsApp.'}
                </span>
              </Label>
              <Switch
                id="asistente-prospectos-whatsapp"
                checked={asistenteProspectosWhatsApp}
                onCheckedChange={setAsistenteProspectosWhatsApp}
                disabled={saving}
              />
            </div>

            <div className="space-y-3 border rounded-md p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <Label className="font-semibold text-sm">Números personales</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Los números de esta lista (familia, amigos, contactos personales) ganan sobre todas las puertas: nunca entran al CRM ni reciben respuesta automática.
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="Ej: 099 123 456"
                  value={nuevoNumero}
                  onChange={(e) => setNuevoNumero(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarNumero();
                    }
                  }}
                  disabled={saving}
                />
                <Button type="button" variant="outline" onClick={agregarNumero} disabled={saving || !nuevoNumero.trim()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>

              {numerosPersonales.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No hay números personales cargados.</p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {numerosPersonales.map((numero) => (
                    <Badge key={numero} variant="outline" className="gap-1.5 py-1 px-2.5 text-xs">
                      <span>{numero}</span>
                      <button
                        type="button"
                        onClick={() => quitarNumero(numero)}
                        disabled={saving}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Quitar ${numero}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button type="button" onClick={guardar} disabled={loading || saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar reglas de ingreso al CRM
        </Button>
      </CardFooter>
    </Card>
  );
}
