'use client';

import { useState } from 'react';
import { Save, Gift, Landmark, Link as LinkIcon, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { InvitacionDigitalRegalos } from '@/types/fiesta';

interface GiftRegistryConfigProps {
  initialConfig: InvitacionDigitalRegalos;
  onSave: (config: InvitacionDigitalRegalos) => Promise<void>;
}

export function GiftRegistryConfig({ initialConfig, onSave }: GiftRegistryConfigProps) {
  const [config, setConfig] = useState<InvitacionDigitalRegalos>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
    } finally {
      setIsSaving(false);
    }
  };

  const showBankInfo = config.tipo === 'dinero' || config.tipo === 'ambos';
  const showListInfo = config.tipo === 'regalos' || config.tipo === 'ambos';

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Gift className="w-5 h-5 text-violet-400" />
          Configuración de Regalos
        </CardTitle>
        <CardDescription className="text-slate-400">
          Personalizá cómo los invitados pueden hacerte llegar sus regalos. El dinero se transfiere directo a tu cuenta (Cero comisiones).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Modalidad de Regalos</Label>
          <Select
            value={config.tipo}
            onValueChange={(v: any) => setConfig({ ...config, tipo: v })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Seleccioná una opción" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="dinero">Sólo Dinero (Transferencia/Mercado Pago)</SelectItem>
              <SelectItem value="regalos">Sólo Lista de Regalos (Link externo)</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
              <SelectItem value="ninguno">No recibir regalos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.tipo !== 'ninguno' && (
          <div className="space-y-2">
            <Label>Mensaje Personalizado</Label>
            <Textarea
              value={config.textoPersonalizado || ''}
              onChange={(e) => setConfig({ ...config, textoPersonalizado: e.target.value })}
              placeholder="Ej: El mejor regalo es que compartas este momento con nosotros. Si deseás hacernos un presente..."
              className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
            />
          </div>
        )}

        {showBankInfo && (
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-violet-400 font-semibold">
              <PiggyBank className="w-4 h-4" />
              Datos Bancarios / Mercado Pago
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco / Billetera Virtual</Label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    value={config.banco || ''}
                    onChange={(e) => setConfig({ ...config, banco: e.target.value })}
                    placeholder="Ej: Mercado Pago o Santander"
                    className="pl-9 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Titular de la Cuenta</Label>
                <Input
                  value={config.titular || ''}
                  onChange={(e) => setConfig({ ...config, titular: e.target.value })}
                  placeholder="Nombre completo"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>CBU / CVU / Alias</Label>
                <Input
                  value={config.aliasCBU || ''}
                  onChange={(e) => setConfig({ ...config, aliasCBU: e.target.value })}
                  placeholder="alias.mercado.pago"
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {showListInfo && (
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Gift className="w-4 h-4" />
              Lista de Regalos Externa
            </div>

            <div className="space-y-2">
              <Label>Link a la Lista (Fravega, Colectivo, etc.)</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  value={config.linkListaRegalos || ''}
                  onChange={(e) => setConfig({ ...config, linkListaRegalos: e.target.value })}
                  placeholder="https://"
                  className="pl-9 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-violet-600 hover:bg-violet-500 text-white w-full sm:w-auto"
          >
            {isSaving ? 'Guardando...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
