'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * El salón en 3D, aislado del resto de la pantalla.
 *
 * Por qué existe: la pantalla del Configurador de Reunión —la que se usa
 * **sentado adelante del cliente**, en la reunión de cierre— se moría entera y
 * mostraba "¡Ups! Algo salió mal". El motivo estaba adentro de la vista 3D
 * (`Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`),
 * pero se llevaba puesto todo lo demás: el catálogo de servicios, el cálculo del
 * presupuesto y el botón de guardar. Nada de eso tiene que ver con el dibujo 3D.
 *
 * Con esto, si el dibujo falla, **falla solo el dibujo**: el resto de la pantalla
 * sigue andando y se puede cerrar la venta igual. Y se dice en criollo qué pasó,
 * en vez de dejar al vendedor mirando un cartel de error delante del cliente.
 *
 * No tapa el problema: el dibujo sigue sin verse y hay que arreglarlo. Lo que
 * evita es que un widget se lleve puesta la reunión.
 */
export class SalonSceneAislada extends React.Component<
  { children: React.ReactNode },
  { fallo: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { fallo: false };
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[salon-3d] La vista 3D no se pudo dibujar:', error);
  }

  render() {
    if (this.state.fallo) {
      return (
        <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-6 text-center">
          <AlertTriangle className="h-7 w-7 text-amber-600" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            El salón en 3D no se pudo dibujar
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Es sólo el dibujo: el catálogo, el presupuesto y el guardado siguen funcionando
            normal, así que podés seguir con la reunión. Avisale al equipo de AK para que lo
            revise.
          </p>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}
