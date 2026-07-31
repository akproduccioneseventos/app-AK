'use client';

import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Gift,
  Landmark,
  PiggyBank,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { InvitacionDigitalRegalos } from '@/types/fiesta';

interface GiftRegistryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config?: InvitacionDigitalRegalos;
}

export function GiftRegistryModal({
  isOpen,
  onOpenChange,
  config,
}: GiftRegistryModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!config) return null;

  const showBankInfo = config.tipo === 'dinero' || config.tipo === 'ambos';
  const showGiftList = config.tipo === 'regalos' || config.tipo === 'ambos';

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white p-0 overflow-hidden">
        <div className="relative">
          {/* Header Graphic */}
          <div className="h-32 bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <Gift className="w-16 h-16 text-white/90 relative z-10 drop-shadow-lg" />
          </div>

          <div className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Mesa de Regalos
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-center">
                {config.textoPersonalizado || 'El mejor regalo es que compartas este momento con nosotros.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {showBankInfo && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
                  <div className="flex items-center gap-2 text-violet-400 font-semibold border-b border-slate-700 pb-2">
                    <PiggyBank className="w-5 h-5" />
                    <span>Datos para Transferencia</span>
                  </div>

                  <div className="space-y-3">
                    {config.banco && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1">
                          <p className="text-slate-400 text-xs">Banco</p>
                          <p className="font-medium text-white">{config.banco}</p>
                        </div>
                      </div>
                    )}

                    {config.titular && (
                      <div className="flex items-center gap-3 text-sm">
                        <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1">
                          <p className="text-slate-400 text-xs">Titular</p>
                          <p className="font-medium text-white">{config.titular}</p>
                        </div>
                      </div>
                    )}

                    {config.aliasCBU && (
                      <div className="flex items-center gap-3 text-sm group">
                        <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1">
                          <p className="text-slate-400 text-xs">CBU / Alias</p>
                          <p className="font-medium text-white">{config.aliasCBU}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopy(config.aliasCBU!, 'cbu')}
                          className="h-8 w-8 hover:bg-slate-700"
                          title="Copiar CBU/Alias"
                        >
                          {copiedField === 'cbu' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showGiftList && config.linkListaRegalos && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
                    <Gift className="w-5 h-5" />
                    <span>Lista de Regalos</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-4">
                    {config.instruccionesRegalos || 'Podés ver nuestra lista de regalos en el siguiente link:'}
                  </p>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    onClick={() => window.open(config.linkListaRegalos, '_blank')}
                  >
                    Ver Lista de Regalos
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Legal Note for AK Transparency */}
              <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 leading-tight">
                  Aviso de Transparencia: El importe se transfiere 100% directamente a la cuenta del agasajado. AK Producciones no interviene ni recauda fondos de regalos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
