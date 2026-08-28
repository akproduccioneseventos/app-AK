'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Monitor, Loader2, Sparkles } from 'lucide-react';
import {
  TableroControlEstaciones,
  EstadoEstacionOperador,
} from '@/components/entretenimiento/TableroControlEstaciones';
import { getEntretenimientoFiesta } from '@/app/actions/fiesta/entretenimiento.actions';
import { Button } from '@/components/ui/button';

export default function ControlEntretenimientoPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.id as string;

  const [nombreEvento, setNombreEvento] = useState('Fiesta');
  const [estaciones, setEstaciones] = useState<EstadoEstacionOperador[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      const res = await getEntretenimientoFiesta(fiestaId);
      if (res.success && res.fiesta) {
        const f = res.fiesta;
        setNombreEvento(f.configuracion?.nombreEvento || 'Fiesta');

        // Construir listado de estaciones
        const lista: EstadoEstacionOperador[] = [
          {
            id: 'plataforma360',
            nombre: 'Plataforma 360',
            tipo: 'plataforma360',
            activa: f.others?.entretenimiento?.modules?.plataforma360?.enabled !== false,
            estadoOperativo: 'idle',
            totalCapturas: 0,
            rutaOperador: `/evento/plataforma-360/${fiestaId}?role=operator`,
            rutaPantalla: `/evento/plataforma-360/${fiestaId}?role=display`,
          },
          {
            id: 'bogue',
            nombre: 'Bogue (Boomerang)',
            tipo: 'bogue',
            activa: f.others?.entretenimiento?.modules?.bogue?.enabled !== false,
            estadoOperativo: 'idle',
            totalCapturas: 0,
            rutaOperador: `/evento/bogue/${fiestaId}?role=operator`,
            rutaPantalla: `/evento/bogue/${fiestaId}?role=display`,
          },
          {
            id: 'espejoMagicoFoto',
            nombre: 'Espejo Mágico (Foto)',
            tipo: 'espejoMagico',
            activa: f.others?.entretenimiento?.modules?.espejoMagicoFoto?.enabled !== false,
            estadoOperativo: 'idle',
            totalCapturas: 0,
            rutaOperador: `/evento/espejo-magico/${fiestaId}?mode=foto&role=operator`,
            rutaPantalla: `/evento/espejo-magico/${fiestaId}?mode=foto&role=display`,
          },
          {
            id: 'espejoMagicoFirma',
            nombre: 'Espejo Mágico (Firma)',
            tipo: 'espejoMagico',
            activa: f.others?.entretenimiento?.modules?.espejoMagicoFirma?.enabled !== false,
            estadoOperativo: 'idle',
            totalCapturas: 0,
            rutaOperador: `/evento/espejo-magico/${fiestaId}?mode=firma&role=operator`,
            rutaPantalla: `/evento/espejo-magico/${fiestaId}?mode=firma&role=display`,
          },
          {
            id: 'espejoMagicoIA',
            nombre: 'Touchpix (Retrato IA)',
            tipo: 'espejoMagico',
            activa: f.others?.entretenimiento?.modules?.espejoMagicoIA?.enabled !== false,
            estadoOperativo: 'idle',
            totalCapturas: 0,
            rutaOperador: `/evento/touchpix/${fiestaId}?role=operator`,
            rutaPantalla: `/evento/touchpix/${fiestaId}?role=display`,
          },
          {
            id: 'totems',
            nombre: 'Tótems Interactivos',
            tipo: 'totems',
            activa: f.others?.entretenimiento?.modules?.totems?.enabled !== false,
            estadoOperativo: 'idle',
            totalCapturas: 0,
            rutaOperador: `/evento/totem/${fiestaId}/totem-1`,
            rutaPantalla: `/evento/totem/${fiestaId}/totem-1`,
          },
          {
            id: 'capsulaTiempo',
            nombre: 'Cápsula del Tiempo',
            tipo: 'capsulaTiempo',
            activa: f.others?.entretenimiento?.modules?.capsulaTiempo?.enabled !== false,
            estadoOperativo: 'idle',
            totalCapturas: 0,
            rutaOperador: `/evento/buzon/${fiestaId}`,
            rutaPantalla: `/evento/buzon/${fiestaId}`,
          },
        ];

        setEstaciones(lista);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, [fiestaId]);

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/fiestas/nueva/entretenimiento?id=${fiestaId}`}
            className="rounded-lg border border-white/10 bg-zinc-900 p-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Monitor className="h-6 w-6 text-amber-400" />
              Tablero de Operación en Vivo
            </h1>
            <p className="text-xs text-slate-400">
              Monitoreo centralizado de todas las estaciones para {nombreEvento}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      ) : (
        <TableroControlEstaciones
          fiestaId={fiestaId}
          nombreEvento={nombreEvento}
          estaciones={estaciones}
          onRefresh={cargarDatos}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
