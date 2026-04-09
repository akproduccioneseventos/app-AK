'use client';

import { QRCodeSVG } from 'qrcode.react';
import type { Invitado } from '@/types/fiesta';

interface Props {
  invitado: Invitado;
  fiestaId: string;
  nombreEvento?: string;
  size?: number;
}

export function InvitadoQR({ invitado, fiestaId, nombreEvento, size = 160 }: Props) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/invitado/${fiestaId}/${invitado.id}`;

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-purple-100 bg-white">
      <QRCodeSVG
        value={url}
        size={size}
        bgColor="#ffffff"
        fgColor="#1e1b4b"
        level="M"
        includeMargin
      />
      <div className="text-center space-y-0.5">
        <p className="font-black text-sm text-slate-800">{invitado.nombre}</p>
        {invitado.tableNumber && (
          <p className="text-xs text-slate-500">Mesa {invitado.tableNumber}</p>
        )}
        {nombreEvento && (
          <p className="text-xs text-purple-600 font-semibold">{nombreEvento}</p>
        )}
      </div>
      <p className="text-[10px] text-slate-400 break-all text-center max-w-[160px]">{url}</p>
    </div>
  );
}
