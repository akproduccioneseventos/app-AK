'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Music2,
  Palette,
  Utensils,
  Clock,
  Users,
  Sparkles,
  Loader2,
  CalendarCheck,
} from 'lucide-react';
import type { FiestaEnPlanificacion, Reunion } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta-actual';

interface PreguntaExtra {
  id: string;
  pregunta: string;
}

const PREGUNTAS_DEFECTO: PreguntaExtra[] = [
  { id: 'sorpresas', pregunta: '¿Hay alguna sorpresa o momento emotivo previsto por amigos/familiares?' },
  { id: 'apertura_pista', pregunta: '¿Quién abre la pista y qué ritmo prefieren para arrancar?' },
  { id: 'protocolo_fotos', pregunta: '¿Protocolo de fotos familiares (mesa por mesa o al ingreso)?' },
];

function parsePaletaTexto(paleta: any): string {
  if (!paleta) return '';
  if (typeof paleta === 'string') return paleta;
  if (Array.isArray(paleta)) return paleta.join(', ');
  if (typeof paleta === 'object') {
    return [paleta.primary, paleta.secondary, paleta.accent].filter(Boolean).join(', ');
  }
  return '';
}

function ReunionOrganizacionContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Campos que mapean directamente a la estructura real de la fiesta
  const [cancionEntrada, setCancionEntrada] = useState('');
  const [cancionVals, setCancionVals] = useState('');
  const [musicaProhibida, setMusicaProhibida] = useState('');
  const [estiloTema, setEstiloTema] = useState('');
  const [paletaColores, setPaletaColores] = useState('');
  const [cateringNotas, setCateringNotas] = useState('');
  const [alergias, setAlergias] = useState('');
  const [cronogramaNotas, setCronogramaNotas] = useState('');
  const [cantidadInvitados, setCantidadInvitados] = useState<number | ''>('');
  const [respuestasExtra, setRespuestasExtra] = useState<Record<string, string>>({});

  const cargarDatos = useCallback(async () => {
    if (!fiestaId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) throw new Error('Fiesta no encontrada');

      setFiesta(data);
      // Mapear campos existentes
      setCancionEntrada(data.musica?.cancionEntrada || '');
      setCancionVals(data.musica?.cancionVals || '');
      setMusicaProhibida(data.musica?.listaNoReproducir || '');
      setEstiloTema(data.decoracion?.tema || '');
      setPaletaColores(parsePaletaTexto(data.decoracion?.paletaColores));
      setCateringNotas(data.catering?.detallesMenu || '');
      setAlergias(data.catering?.alergiasOIntolerancias || '');
      setCantidadInvitados(data.configuracion?.invitadosEstimados ?? '');
      setRespuestasExtra(data.reunionOrganizacion?.respuestasExtra || {});
      if (Array.isArray(data.programa) && data.programa.length > 0) {
        setCronogramaNotas(data.programa.map((p: any) => `${p.hora || ''} - ${p.titulo || p.actividad || ''}`).join('\n'));
      }
    } catch (err: any) {
      toast({
        title: 'Error al cargar',
        description: err.message || 'No se pudo cargar la fiesta',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const guardarCambiosDirectos = async (): Promise<FiestaEnPlanificacion | null> => {
    if (!fiesta || !fiestaId) return null;
    setIsSaving(true);
    try {
      const coloresArray = typeof paletaColores === 'string'
        ? paletaColores.split(',').map((c) => c.trim()).filter(Boolean)
        : [];

      const fiestaActualizada: FiestaEnPlanificacion = {
        ...fiesta,
        musica: {
          ...fiesta.musica,
          cancionEntrada,
          cancionVals,
          listaNoReproducir: musicaProhibida,
          cancionesTortaBrindis: fiesta.musica?.cancionesTortaBrindis || [],
          playlistFiesta: fiesta.musica?.playlistFiesta || '',
          sugerenciasInvitados: fiesta.musica?.sugerenciasInvitados || '',
        },
        decoracion: {
          ...fiesta.decoracion,
          tema: estiloTema,
          paletaColores: {
            primary: coloresArray[0] || (fiesta.decoracion?.paletaColores?.primary ?? ''),
            secondary: coloresArray[1] || (fiesta.decoracion?.paletaColores?.secondary ?? ''),
            accent: coloresArray[2] || (fiesta.decoracion?.paletaColores?.accent ?? ''),
          },
        },
        catering: {
          ...fiesta.catering,
          detallesMenu: cateringNotas,
          alergiasOIntolerancias: alergias,
        },
        configuracion: {
          ...fiesta.configuracion,
          invitadosEstimados: cantidadInvitados !== '' ? Number(cantidadInvitados) : (fiesta.configuracion?.invitadosEstimados ?? 0),
        },
        reunionOrganizacion: {
          ...fiesta.reunionOrganizacion,
          respuestasExtra,
        },
      };

      const resSave = await saveFiesta(fiestaActualizada);
      if (!resSave?.success) {
        toast({
          title: 'Error al guardar',
          description: resSave?.error || 'No se pudieron guardar los cambios.',
          variant: 'destructive',
        });
        return null;
      }
      setFiesta(fiestaActualizada);
      toast({
        title: 'Cambios guardados',
        description: 'Todos los datos se actualizaron en sus módulos correspondientes.',
      });
      return fiestaActualizada;
    } catch (err: any) {
      toast({
        title: 'Error al guardar',
        description: err.message || 'No se pudieron guardar los cambios.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCerrarReunion = async () => {
    setIsClosing(true);
    try {
      const fiestaGuardada = await guardarCambiosDirectos();
      if (!fiestaGuardada || !fiestaId) return;

      const fechaHoy = new Date().toISOString();
      const acuerdosTexto = [
        `Reunión de Organización completada con el cliente el ${new Date().toLocaleDateString('es-UY')}.`,
        cancionEntrada ? `• Entrada: ${cancionEntrada}` : null,
        cancionVals ? `• Vals: ${cancionVals}` : null,
        estiloTema ? `• Estilo/Tema: ${estiloTema}` : null,
        paletaColores ? `• Paleta: ${paletaColores}` : null,
        alergias ? `• Alergias reportadas: ${alergias}` : null,
        cantidadInvitados ? `• Cantidad de invitados estimada: ${cantidadInvitados}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const nuevaReunion: Reunion = {
        id: `reunion_org_${Date.now()}`,
        fiestaId,
        titulo: 'Reunión de Organización',
        fecha: fechaHoy,
        hora: '19:00',
        notas: 'Reunión presencial de definición y coordinación general.',
        acuerdos: acuerdosTexto,
        checklist: [],
      };

      const conReunion: FiestaEnPlanificacion = {
        ...fiestaGuardada,
        reuniones: [...(fiestaGuardada.reuniones || []), nuevaReunion],
        reunionOrganizacion: {
          ...fiestaGuardada.reunionOrganizacion,
          cerradaAt: fechaHoy,
          respuestasExtra,
        },
      };

      const resCerrar = await saveFiesta(conReunion);
      if (!resCerrar?.success) {
        toast({
          title: 'Error al cerrar reunión',
          description: resCerrar?.error || 'No se pudo cerrar la reunión.',
          variant: 'destructive',
        });
        return;
      }
      setFiesta(conReunion);

      toast({
        title: '¡Reunión cerrada con éxito!',
        description: 'Se registró la reunión en el historial con todos los acuerdos detallados.',
      });
    } catch (err: any) {
      toast({
        title: 'Error al cerrar reunión',
        description: err.message || 'No se pudo cerrar la reunión.',
        variant: 'destructive',
      });
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href={fiestaId ? `/fiestas/nueva?fiestaId=${fiestaId}` : '/fiestas'}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Reunión de Organización</h1>
              {fiesta?.reunionOrganizacion?.cerradaAt && (
                <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Cerrada
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Completá este recorrido con el cliente presente. Cada respuesta se guarda en su módulo correspondiente sin duplicar datos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => guardarCambiosDirectos()}
            disabled={isSaving || isClosing}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar cambios
          </Button>
          <Button
            onClick={handleCerrarReunion}
            disabled={isSaving || isClosing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isClosing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
            Cerrar la reunión
          </Button>
        </div>
      </div>

      {/* Sección 1: Música */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Music2 className="h-5 w-5 text-indigo-500" />
            1. Música y Momentos Clave
          </CardTitle>
          <CardDescription>
            Se guarda directamente en la configuración de música de la fiesta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cancionEntrada">Canción de Entrada</Label>
              <Input
                id="cancionEntrada"
                placeholder="Ej: Coldplay - A Sky Full of Stars"
                value={cancionEntrada}
                onChange={(e) => setCancionEntrada(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancionVals">Canción del Vals / Momento Central</Label>
              <Input
                id="cancionVals"
                placeholder="Ej: Danubio Azul / Canción especial"
                value={cancionVals}
                onChange={(e) => setCancionVals(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="musicaProhibida">Lista de canciones o géneros prohibidos</Label>
            <Textarea
              id="musicaProhibida"
              placeholder="Temas o ritmos que NO deben sonar bajo ningún concepto..."
              rows={2}
              value={musicaProhibida}
              onChange={(e) => setMusicaProhibida(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sección 2: Estilo y Decoración */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-500" />
            2. Estilo y Paleta de Colores
          </CardTitle>
          <CardDescription>
            Se guarda directamente en el módulo de ambientación y diseño.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estiloTema">Temática o Estilo General</Label>
              <Input
                id="estiloTema"
                placeholder="Ej: Elegante moderno, Neón, Rústico chic..."
                value={estiloTema}
                onChange={(e) => setEstiloTema(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paletaColores">Paleta de Colores (separados por coma)</Label>
              <Input
                id="paletaColores"
                placeholder="Ej: Dorado, Blanco, Negro..."
                value={paletaColores}
                onChange={(e) => setPaletaColores(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección 3: Menú, Alergias y Catering */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Utensils className="h-5 w-5 text-amber-500" />
            3. Menú y Alergias
          </CardTitle>
          <CardDescription>
            Se guarda directamente en catering y registro de alérgenos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cateringNotas">Detalles del Menú Acordado</Label>
            <Textarea
              id="cateringNotas"
              placeholder="Entrada, plato principal, postre, mesa dulce..."
              rows={2}
              value={cateringNotas}
              onChange={(e) => setCateringNotas(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alergias">Alergias o Restricciones Alimentarias (celíacos, veganos, etc.)</Label>
            <Textarea
              id="alergias"
              placeholder="Indicar cantidad y necesidades específicas..."
              rows={2}
              value={alergias}
              onChange={(e) => setAlergias(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sección 4: Invitados y Tiempos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            4. Invitados y Momentos Clave
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="cantidadInvitados">Cantidad Estimada de Invitados</Label>
            <Input
              id="cantidadInvitados"
              type="number"
              placeholder="120"
              value={cantidadInvitados}
              onChange={(e) => setCantidadInvitados(e.target.value ? parseInt(e.target.value, 10) : '')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cronogramaNotas">Momentos Clave del Cronograma</Label>
            <Textarea
              id="cronogramaNotas"
              placeholder="Horario de recepción, tanda de baile, corte de torta, cotillón..."
              rows={3}
              value={cronogramaNotas}
              onChange={(e) => setCronogramaNotas(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sección 5: Preguntas Propias de la Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            5. Preguntas Especiales AK
          </CardTitle>
          <CardDescription>
            Preguntas operativas propias de la productora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PREGUNTAS_DEFECTO.map((p) => (
            <div key={p.id} className="space-y-2">
              <Label htmlFor={`extra_${p.id}`}>{p.pregunta}</Label>
              <Input
                id={`extra_${p.id}`}
                placeholder="Anotar respuesta acordada..."
                value={respuestasExtra[p.id] || ''}
                onChange={(e) =>
                  setRespuestasExtra({ ...respuestasExtra, [p.id]: e.target.value })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pie con cierre */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => guardarCambiosDirectos()}
          disabled={isSaving || isClosing}
        >
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar cambios
        </Button>
        {/* data-testid en el pie porque hay otro botón igual en el header (UX intencional) */}
        <Button
          onClick={handleCerrarReunion}
          disabled={isSaving || isClosing}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          data-testid="btn-cerrar-reunion"
        >
          {isClosing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
          Cerrar la reunión
        </Button>
      </div>
    </div>
  );
}

export default function ReunionOrganizacionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ReunionOrganizacionContent />
    </Suspense>
  );
}
