'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * El cuadro blanco donde aparece el codigo QR para llevarse el recuerdo, al
 * final de cada estacion (fotocabina, plataforma 360, boomerang, espejo).
 *
 * Existe porque las cuatro estaciones tenian el mismo defecto copiado: cuando
 * la subida fallaba, la pantalla igual pasaba al cartel de "listo, escanea tu
 * recuerdo" y dejaba una rueda girando para siempre, porque el enlace del QR
 * nunca llegaba. El invitado se iba de la fiesta convencido de que su foto
 * estaba guardada, y no habia nada.
 *
 * Ahora hay tres estados posibles y ninguno miente:
 *  - hay enlace  -> se muestra el QR;
 *  - hubo error  -> se dice que no se pudo y que use los botones de abajo;
 *  - ninguno     -> sigue subiendo, y ahi si la rueda tiene sentido.
 */
export function QrRecuerdo({
  qrCodeUrl,
  error,
  size = 180,
}: {
  qrCodeUrl: string;
  /** Texto del fallo, si la subida no salio. Vacio o nulo cuando todo va bien. */
  error?: string | null;
  size?: number;
}) {
  if (qrCodeUrl) {
    return <QRCodeSVG value={qrCodeUrl} size={size} level="Q" includeMargin={false} />;
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 px-3 text-center"
        style={{ width: size, height: size }}
        role="alert"
      >
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-black leading-tight text-zinc-900">No se pudo subir</p>
        <p className="text-xs leading-tight text-zinc-600">
          Guardala en tu celular con el boton de descargar, o volve a intentar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
    </div>
  );
}
