
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, Package, ListChecks, FileJson, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import config from '@/data/armado-rapido-config.json';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function ArmadoRapidoConfigPage() {
  const { paquetes, reglas } = config;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Configuración de Armado Rápido
          </h1>
        </div>
        <Link href="/settings/budget-display" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Config. Presupuestos
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg border-blue-500/20 bg-blue-50/30 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><FileJson className="text-primary"/>Editando el Archivo de Configuración</CardTitle>
          <CardDescription>
            Toda la configuración del Armado Rápido se gestiona directamente en un archivo de texto. Para modificar los paquetes o las reglas, debes editar el siguiente archivo en tu proyecto:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block my-1 p-3 rounded-md bg-gray-200 dark:bg-gray-700 font-mono text-sm">
            src/data/armado-rapido-config.json
          </code>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes Definidos</CardTitle>
          <CardDescription>Estos son los combos que se mostrarán a tus clientes en la página de Armado Rápido.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paquetes.map(paquete => (
            <Card key={paquete.id} className="bg-muted/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{paquete.nombre}</CardTitle>
                <CardDescription className="text-xs">{paquete.descripcion}</CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-semibold mb-1">Servicios Base Incluidos:</h4>
                <ul className="text-xs list-disc list-inside text-muted-foreground">
                  {paquete.serviciosIncluidosIds.map(id => <li key={id}>{id}</li>)}
                </ul>
                {paquete.costoFijoAdicional > 0 && <p className="text-xs mt-2">Costo Adicional: ${paquete.costoFijoAdicional}</p>}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><ListChecks className="text-primary"/>Reglas de Cálculo Automático</CardTitle>
          <CardDescription>
            Define cómo se calculan automáticamente las cantidades de ciertos servicios basados en el número de invitados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-md mb-2">Reglas Dinámicas (Por Cantidad)</h4>
            <div className="space-y-2">
              {reglas.dinamicas.map((regla, i) => (
                <div key={i} className="p-2 border rounded-md text-sm">
                  <p>Para el servicio <code className="bg-muted px-1 rounded">{regla.servicioCatalogoId}</code>, se añade 1 unidad por cada <span className="font-bold">{regla.invitadosPorUnidad}</span> invitado(s).</p>
                </div>
              ))}
            </div>
          </div>
           <Separator/>
          <div>
            <h4 className="font-semibold text-md mb-2">Reglas Condicionales (Por Umbral)</h4>
            <div className="space-y-2">
              {reglas.condicionales.map((regla, i) => (
                <div key={i} className="p-2 border rounded-md text-sm">
                  <p>Si los invitados son <span className="font-bold">≤ {regla.umbralInvitados}</span>, se usa el servicio <code className="bg-muted px-1 rounded">{regla.servicioMenorId}</code>. Si no, se usa <code className="bg-muted px-1 rounded">{regla.servicioMayorId}</code>.</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Info className="text-primary"/>Estructura del Archivo de Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-2 text-muted-foreground">Usa esta estructura como referencia para editar el archivo JSON.</p>
          <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/30 font-mono text-xs">
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
