'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Camera, ExternalLink, Loader2, Pencil, Plus, RefreshCw, Star, Trash2, Upload, Video, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GaleriaFoto, GaleriaVideo } from '@/types/galeria';
import {
  GALERIA_CATEGORIAS,
  SERVICIOS_GALERIA,
  SUBCATEGORIAS_POR_SERVICIO,
  TIPOS_FIESTA_GALERIA,
} from '@/types/galeria';
import {
  getGaleriaItems,
  addGaleriaFoto,
  addGaleriaVideo,
  deleteGaleriaItem,
  toggleDestacada,
  updateGaleriaFoto,
} from '@/app/actions/galeria';
import { addCatalogoFoto } from '@/app/actions/catalogo-fotos';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{1,20}$/;
const VIMEO_ID_RE = /^\d+$/;

type VideoSource = {
  platform: 'youtube' | 'vimeo';
  id: string;
  embedUrl: string;
  thumbnailUrl: string;
};

function extractVideoSource(url: string): VideoSource | null {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('?')[0];
      if (!id || !YOUTUBE_ID_RE.test(id)) return null;
      return {
        platform: 'youtube',
        id,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      };
    }
    else if (u.hostname === 'youtube.com' || u.hostname === 'www.youtube.com' || u.hostname === 'm.youtube.com') {
      const id = u.searchParams.get('v');
      if (!id || !YOUTUBE_ID_RE.test(id)) return null;
      return {
        platform: 'youtube',
        id,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      };
    }
    if (u.hostname === 'vimeo.com' || u.hostname === 'www.vimeo.com' || u.hostname === 'player.vimeo.com') {
      const maybeId = (u.pathname.split('/').filter(Boolean).pop() || '').trim();
      if (!VIMEO_ID_RE.test(maybeId)) return null;
      return {
        platform: 'vimeo',
        id: maybeId,
        embedUrl: `https://player.vimeo.com/video/${maybeId}`,
        thumbnailUrl: `https://vumbnail.com/${maybeId}.jpg`,
      };
    }
  } catch {
    // invalid url
  }
  return null;
}

function sanitizeHttpUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {
    // invalid url
  }
  return null;
}

interface EditFotoDialogState {
  open: boolean;
  foto: GaleriaFoto | null;
}

export default function GaleriaAdminPage() {
  const { toast } = useToast();
  const [fotos, setFotos] = useState<GaleriaFoto[]>([]);
  const [videos, setVideos] = useState<GaleriaVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'fotos' | 'videos'>('fotos');
  const [servicioNames, setServicioNames] = useState<string[]>([]);

  // Foto form
  const [fotoUrl, setFotoUrl] = useState('');
  const [fotoTitulo, setFotoTitulo] = useState('');
  const [fotoDescripcion, setFotoDescripcion] = useState('');
  const [fotoCategoria, setFotoCategoria] = useState('');
  const [fotoTipoFiesta, setFotoTipoFiesta] = useState('');
  const [fotoSubCategoria, setFotoSubCategoria] = useState('');
  const [fotoDestacada, setFotoDestacada] = useState(false);
  const [isSavingFoto, setIsSavingFoto] = useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);
  const [vistaMode, setVistaMode] = useState<'tipoFiesta' | 'servicio' | 'todas'>('tipoFiesta');
  const [editFotoDialog, setEditFotoDialog] = useState<EditFotoDialogState>({ open: false, foto: null });

  // Video form
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitulo, setVideoTitulo] = useState('');
  const [videoDescripcion, setVideoDescripcion] = useState('');
  const [videoCategoria, setVideoCategoria] = useState('');
  const [videoDestacada, setVideoDestacada] = useState(false);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [isUploadingVideoFile, setIsUploadingVideoFile] = useState(false);

  // Combined categories (base + service names)
  const allCategories = useMemo(() => {
    const options = new Set<string>([
      ...SERVICIOS_GALERIA,
      ...servicioNames,
      ...GALERIA_CATEGORIAS,
      ...fotos.map((f) => f.categoria).filter(Boolean),
    ]);
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [servicioNames, fotos]);

  const availableServiciosForView = useMemo(() => {
    const options = new Set<string>([
      ...SERVICIOS_GALERIA,
      ...servicioNames,
      ...fotos.map((f) => f.categoria).filter(Boolean),
    ]);
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [servicioNames, fotos]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, servicios] = await Promise.all([
        getGaleriaItems(),
        getServiciosEmpresa(),
      ]);
      setFotos(data.fotos.sort((a, b) => (b.destacada ? 1 : 0) - (a.destacada ? 1 : 0) || a.orden - b.orden));
      setVideos(data.videos.sort((a, b) => (b.destacada ? 1 : 0) - (a.destacada ? 1 : 0) || a.orden - b.orden));
      // Extract unique service names and categories from catalog
      const names = Array.from(new Set([
        ...servicios.map(s => s.nombre),
        ...servicios.filter(s => s.categoria).map(s => s.categoria!),
      ])).sort();
      setServicioNames(names);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la galería.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const availableSubcats = SUBCATEGORIAS_POR_SERVICIO[fotoCategoria] || [];
    if (!availableSubcats.includes(fotoSubCategoria)) {
      setFotoSubCategoria('');
    }
  }, [fotoCategoria, fotoSubCategoria]);

  const openEditFotoDialog = (foto: GaleriaFoto) => {
    setEditFotoDialog({ open: true, foto: { ...foto } });
  };

  const handleEditFotoField = <K extends keyof GaleriaFoto>(field: K, value: GaleriaFoto[K]) => {
    setEditFotoDialog((prev) => {
      if (!prev.foto) return prev;
      const nextFoto = { ...prev.foto, [field]: value };
      if (field === 'categoria') {
        const nextSubcats = SUBCATEGORIAS_POR_SERVICIO[String(value)] || [];
        if (!nextSubcats.includes(nextFoto.subCategoria || '')) {
          nextFoto.subCategoria = undefined;
        }
      }
      return { ...prev, foto: nextFoto };
    });
  };

  const handleAddFoto = async () => {
    if (!fotoUrl.trim() || !fotoCategoria) {
      toast({ title: 'Campos requeridos', description: 'Ingresá la URL y la categoría.', variant: 'destructive' });
      return;
    }
    setIsSavingFoto(true);
    try {
      const fotoId = `foto_${Date.now()}`;
      const foto: GaleriaFoto = {
        id: fotoId,
        tipo: 'foto',
        url: fotoUrl.trim(),
        titulo: fotoTitulo.trim() || undefined,
        descripcion: fotoDescripcion.trim() || undefined,
        categoria: fotoCategoria,
        tipoFiesta: fotoTipoFiesta || undefined,
        subCategoria: fotoSubCategoria || undefined,
        destacada: fotoDestacada,
        orden: fotos.length,
        createdAt: new Date().toISOString(),
      };
      await addGaleriaFoto(foto);
      await addCatalogoFoto({
        id: `cat_${fotoId}`,
        url: fotoUrl.trim(),
        titulo: fotoTitulo.trim() || undefined,
        descripcion: fotoDescripcion.trim() || undefined,
        categoriaServicio: fotoCategoria,
        tipoFiesta: fotoTipoFiesta || undefined,
        destacada: fotoDestacada,
        orden: fotos.length,
        source: 'galeria',
        createdAt: new Date().toISOString(),
      });
      toast({ title: '✅ Foto agregada', description: 'La foto se guardó en la galería.' });
      setFotoUrl('');
      setFotoTitulo('');
      setFotoDescripcion('');
      setFotoCategoria('');
      setFotoTipoFiesta('');
      setFotoSubCategoria('');
      setFotoDestacada(false);
      await fetchData();
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar la foto.', variant: 'destructive' });
    } finally {
      setIsSavingFoto(false);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Formato no permitido', description: 'Solo se permiten imágenes JPG, PNG o WebP.', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    if (!fotoCategoria) {
      toast({ title: 'Categoría requerida', description: 'Seleccioná una categoría antes de subir la foto.', variant: 'destructive' });
      return;
    }
    setIsUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append('folder', 'galeria-empresa');
      formData.append('file', file);
      const result = await uploadPublicPageAsset(formData);
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Error al subir');
      }
      const fotoId = `foto_${Date.now()}`;
      const foto: GaleriaFoto = {
        id: fotoId,
        tipo: 'foto',
        url: result.url,
        titulo: fotoTitulo.trim() || undefined,
        descripcion: fotoDescripcion.trim() || undefined,
        categoria: fotoCategoria,
        tipoFiesta: fotoTipoFiesta || undefined,
        subCategoria: fotoSubCategoria || undefined,
        destacada: fotoDestacada,
        orden: fotos.length,
        createdAt: new Date().toISOString(),
      };
      await addGaleriaFoto(foto);
      await addCatalogoFoto({
        id: `cat_${fotoId}`,
        url: result.url,
        titulo: fotoTitulo.trim() || undefined,
        descripcion: fotoDescripcion.trim() || undefined,
        categoriaServicio: fotoCategoria,
        tipoFiesta: fotoTipoFiesta || undefined,
        destacada: fotoDestacada,
        orden: fotos.length,
        source: 'galeria',
        createdAt: new Date().toISOString(),
      });
      toast({ title: '✅ Foto subida', description: 'La foto se subió y guardó en la galería.' });
      setFotoUrl('');
      setFotoTitulo('');
      setFotoDescripcion('');
      setFotoCategoria('');
      setFotoTipoFiesta('');
      setFotoSubCategoria('');
      setFotoDestacada(false);
      await fetchData();
    } catch (err: any) {
      toast({ title: 'Error al subir foto', description: err.message || 'No se pudo subir la foto. Verifica tu conexión y configuración de almacenamiento.', variant: 'destructive' });
    } finally {
      setIsUploadingFoto(false);
      e.target.value = '';
    }
  };

  const handleSyncCatalog = async () => {
    setIsSyncingCatalog(true);
    try {
      const [servicios, menusData] = await Promise.all([
        getServiciosEmpresa(),
        import('@/app/actions/menus-catering').then(m => m.getMenus()),
      ]);
      const existingUrls = new Set(fotos.map(f => f.url));
      let added = 0;
      const newFotos: GaleriaFoto[] = [];
      const makeId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return `foto_catalog_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
        }
        return `foto_catalog_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
      };

      // Sync service images
      for (const servicio of servicios) {
        const imgUrl = servicio.imageUrl;
        if (imgUrl && !existingUrls.has(imgUrl)) {
          existingUrls.add(imgUrl);
          newFotos.push({
            id: makeId(),
            tipo: 'foto',
            url: imgUrl,
            titulo: servicio.nombre,
            descripcion: servicio.notas || undefined,
            categoria: servicio.categoria || servicio.nombre,
            servicio: servicio.nombre,
            destacada: false,
            orden: fotos.length + added,
            createdAt: new Date().toISOString(),
          });
          added++;
        }
      }

      // Sync menu item images
      for (const menu of menusData) {
        // Full menu image
        if (menu.imageUrl && !existingUrls.has(menu.imageUrl)) {
          existingUrls.add(menu.imageUrl);
          newFotos.push({
            id: makeId(),
            tipo: 'foto',
            url: menu.imageUrl,
            titulo: menu.name,
            descripcion: menu.description || undefined,
            categoria: menu.templateType || 'Catering',
            servicio: menu.name,
            destacada: false,
            orden: fotos.length + added,
            createdAt: new Date().toISOString(),
          });
          added++;
        }
        // Individual dish images
        for (const item of menu.items) {
          if (item.imageUrl && !existingUrls.has(item.imageUrl)) {
            existingUrls.add(item.imageUrl);
            newFotos.push({
              id: makeId(),
              tipo: 'foto',
              url: item.imageUrl,
              titulo: item.name,
              descripcion: undefined,
              categoria: item.type || 'Catering',
              servicio: item.name,
              destacada: false,
              orden: fotos.length + added,
              createdAt: new Date().toISOString(),
            });
            added++;
          }
        }
      }

      // Add all new photos
      for (const foto of newFotos) {
        await addGaleriaFoto(foto);
      }

      if (added > 0) {
        toast({ title: `✅ ${added} imagen(es) importadas`, description: 'Las imágenes del catálogo se agregaron a la galería.' });
        await fetchData();
      } else {
        toast({ title: 'Sin cambios', description: 'No se encontraron imágenes nuevas en el catálogo. Asegurate de agregar imágenes a los servicios y platos del menú.' });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo sincronizar el catálogo.', variant: 'destructive' });
    } finally {
      setIsSyncingCatalog(false);
    }
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim() || !videoCategoria || !videoTitulo.trim()) {
      toast({ title: 'Campos requeridos', description: 'Ingresá URL, título y categoría.', variant: 'destructive' });
      return;
    }
    const source = extractVideoSource(videoUrl.trim());
    if (!source) {
      toast({ title: 'URL inválida', description: 'Ingresá un link válido de YouTube o Vimeo.', variant: 'destructive' });
      return;
    }
    setIsSavingVideo(true);
    try {
      const video: GaleriaVideo = {
        id: `video_${Date.now()}`,
        tipo: 'video',
        youtubeUrl: videoUrl.trim(),
        youtubeId: source.id,
        plataforma: source.platform,
        embedUrl: source.embedUrl,
        thumbnailUrl: source.thumbnailUrl,
        titulo: videoTitulo.trim(),
        descripcion: videoDescripcion.trim() || undefined,
        categoria: videoCategoria,
        destacada: videoDestacada,
        orden: videos.length,
        createdAt: new Date().toISOString(),
      };
      await addGaleriaVideo(video);
      toast({ title: '✅ Video agregado', description: 'El video se guardó en la galería.' });
      setVideoUrl('');
      setVideoTitulo('');
      setVideoDescripcion('');
      setVideoCategoria('');
      setVideoDestacada(false);
      await fetchData();
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el video.', variant: 'destructive' });
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!videoCategoria || !videoTitulo.trim()) {
      toast({ title: 'Campos requeridos', description: 'Completá título y categoría antes de subir un video.', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('video/')) {
      toast({ title: 'Formato inválido', description: 'Seleccioná un archivo de video válido.', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    setIsUploadingVideoFile(true);
    try {
      const formData = new FormData();
      formData.append('folder', 'galeria-empresa-videos');
      formData.append('file', file);
      const result = await uploadPublicPageAsset(formData);
      if (!result.success || !result.url) throw new Error(result.error || 'No se pudo subir el video.');
      const video: GaleriaVideo = {
        id: `video_${Date.now()}`,
        tipo: 'video',
        youtubeUrl: result.url,
        youtubeId: '',
        plataforma: 'archivo',
        embedUrl: result.url,
        thumbnailUrl: '/logo_ak_producciones.png',
        titulo: videoTitulo.trim(),
        descripcion: videoDescripcion.trim() || undefined,
        categoria: videoCategoria,
        destacada: videoDestacada,
        orden: videos.length,
        createdAt: new Date().toISOString(),
      };
      await addGaleriaVideo(video);
      toast({ title: '✅ Video subido', description: 'El video se cargó y quedó disponible en la galería.' });
      setVideoUrl('');
      setVideoTitulo('');
      setVideoDescripcion('');
      setVideoCategoria('');
      setVideoDestacada(false);
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error al subir video', description: error?.message || 'No se pudo subir el video.', variant: 'destructive' });
    } finally {
      setIsUploadingVideoFile(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGaleriaItem(id);
      toast({ title: 'Eliminado', description: 'El item fue eliminado.' });
      await fetchData();
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar.', variant: 'destructive' });
    }
  };

  const handleToggleDestacada = async (id: string) => {
    try {
      await toggleDestacada(id);
      await fetchData();
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar.', variant: 'destructive' });
    }
  };

  const handleSaveEditFoto = async () => {
    if (!editFotoDialog.foto) return;
    const payload: Partial<GaleriaFoto> = {
      titulo: editFotoDialog.foto.titulo?.trim() || undefined,
      descripcion: editFotoDialog.foto.descripcion?.trim() || undefined,
      categoria: editFotoDialog.foto.categoria,
      tipoFiesta: editFotoDialog.foto.tipoFiesta || undefined,
      subCategoria: editFotoDialog.foto.subCategoria || undefined,
      destacada: editFotoDialog.foto.destacada,
    };

    const result = await updateGaleriaFoto(editFotoDialog.foto.id, payload);
    if (!result.success) {
      toast({ title: 'Error', description: result.error || 'No se pudo actualizar la foto.', variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Foto actualizada', description: 'Los cambios se guardaron correctamente.' });
    setEditFotoDialog({ open: false, foto: null });
    await fetchData();
  };

  const renderFotoCard = (foto: GaleriaFoto) => (
    <div key={foto.id} className="relative group rounded-xl overflow-hidden border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sanitizeHttpUrl(foto.url) ?? ''}
        alt={foto.titulo ?? foto.categoria}
        className="w-full aspect-square object-cover"
      />
      <div className="absolute inset-0 bg-black/40 sm:bg-black/0 sm:group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <Button
          size="icon"
          variant="secondary"
          className="w-8 h-8"
          onClick={() => openEditFotoDialog(foto)}
          title="Editar foto"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant={foto.destacada ? 'default' : 'secondary'}
          className="w-8 h-8"
          onClick={() => handleToggleDestacada(foto.id)}
          title={foto.destacada ? 'Quitar destacada' : 'Marcar como destacada'}
        >
          <Star className={`w-4 h-4 ${foto.destacada ? 'fill-white' : ''}`} />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="destructive" className="w-8 h-8">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(foto.id)}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="p-2">
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="secondary" className="text-xs">{foto.categoria}</Badge>
          {foto.subCategoria && <Badge variant="outline" className="text-xs">{foto.subCategoria}</Badge>}
          {foto.tipoFiesta && <Badge variant="outline" className="text-xs">{foto.tipoFiesta}</Badge>}
          {foto.destacada && <Badge className="text-xs"><Star className="w-3 h-3 mr-1 fill-white" />Destacada</Badge>}
        </div>
        {foto.titulo && <p className="text-xs mt-1 font-medium truncate">{foto.titulo}</p>}
      </div>
    </div>
  );

  const fotosSinTipoFiesta = useMemo(() => fotos.filter((f) => !f.tipoFiesta), [fotos]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Camera className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Galería Pública</h1>
            <p className="text-muted-foreground text-sm">Fotos y videos que se muestran en tu página web</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncCatalog}
            disabled={isSyncingCatalog}
          >
            {isSyncingCatalog ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sincronizar desde Catálogos
          </Button>
          <Link href="/landing" target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Ver página pública
            </Button>
          </Link>
          <Link href="/empresa">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('fotos')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'fotos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-1" />
          Fotos ({fotos.length})
        </button>
        <button
          onClick={() => setTab('videos')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'videos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Video className="w-4 h-4 inline mr-1" />
          Videos ({videos.length})
        </button>
      </div>

      {tab === 'fotos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add foto form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar Foto
                </CardTitle>
                <CardDescription>Subí desde tu dispositivo o pegá una URL de imagen.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>URL de la imagen (opcional si subís archivo)</Label>
                  <Input
                    placeholder="https://..."
                    value={fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                  />
                  {fotoUrl && sanitizeHttpUrl(fotoUrl) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sanitizeHttpUrl(fotoUrl)!} alt="Vista previa de la imagen" className="mt-2 rounded-lg w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Categoría / Servicio *</Label>
                  <Select value={fotoCategoria} onValueChange={(v) => { if (v) setFotoCategoria(v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Título (opcional)</Label>
                  <Input
                    placeholder="Ej: Boda de Valentina y Rodrigo"
                    value={fotoTitulo}
                    onChange={(e) => setFotoTitulo(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    placeholder="Breve descripción..."
                    value={fotoDescripcion}
                    onChange={(e) => setFotoDescripcion(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Tipo de Fiesta (opcional)</Label>
                  <Select value={fotoTipoFiesta} onValueChange={setFotoTipoFiesta}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de fiesta" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_FIESTA_GALERIA.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {fotoCategoria && (SUBCATEGORIAS_POR_SERVICIO[fotoCategoria]?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    <Label>Sub-categoría (opcional)</Label>
                    <Select value={fotoSubCategoria || '__none__'} onValueChange={(v) => setFotoSubCategoria(v === '__none__' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin sub-categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin sub-categoría</SelectItem>
                        {(SUBCATEGORIAS_POR_SERVICIO[fotoCategoria] || []).map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Switch
                    id="foto-destacada"
                    checked={fotoDestacada}
                    onCheckedChange={setFotoDestacada}
                  />
                  <Label htmlFor="foto-destacada">Foto destacada (aparece primero)</Label>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="upload-foto-input" className="w-full">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      disabled={isUploadingFoto || !fotoCategoria}
                    >
                      <span>
                        {isUploadingFoto ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {isUploadingFoto ? 'Subiendo...' : 'Subir desde dispositivo'}
                      </span>
                    </Button>
                    <input
                      id="upload-foto-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingFoto || !fotoCategoria}
                      onChange={handleUploadFoto}
                    />
                  </label>
                  <Button onClick={handleAddFoto} disabled={isSavingFoto || !fotoUrl.trim()} className="w-full">
                    {isSavingFoto ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Agregar por URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fotos list */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : fotos.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No hay fotos todavía. ¡Agregá la primera!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <div className="flex rounded-xl overflow-hidden border border-slate-200">
                    <button
                      onClick={() => setVistaMode('tipoFiesta')}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${vistaMode === 'tipoFiesta' ? 'bg-primary text-white' : 'hover:bg-slate-50'}`}
                    >
                      Por Tipo de Fiesta
                    </button>
                    <button
                      onClick={() => setVistaMode('servicio')}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${vistaMode === 'servicio' ? 'bg-primary text-white' : 'hover:bg-slate-50'}`}
                    >
                      Por Servicio
                    </button>
                    <button
                      onClick={() => setVistaMode('todas')}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${vistaMode === 'todas' ? 'bg-primary text-white' : 'hover:bg-slate-50'}`}
                    >
                      Todas
                    </button>
                  </div>
                </div>

                {vistaMode === 'todas' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {fotos.map(renderFotoCard)}
                  </div>
                )}

                {vistaMode === 'tipoFiesta' && (
                  <Accordion type="multiple" className="w-full">
                    {TIPOS_FIESTA_GALERIA.map((tipo) => {
                      const fotosTipo = fotos.filter((f) => f.tipoFiesta === tipo);
                      return (
                        <AccordionItem value={tipo} key={tipo}>
                          <AccordionTrigger className="text-sm font-black uppercase tracking-tight no-underline">
                            <span>{tipo} <span className="text-slate-400">({fotosTipo.length} fotos)</span></span>
                          </AccordionTrigger>
                          <AccordionContent>
                            {fotosTipo.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {fotosTipo.map(renderFotoCard)}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Sin fotos en esta sección.</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                    <AccordionItem value="sin-clasificar">
                      <AccordionTrigger className="text-sm font-black uppercase tracking-tight no-underline">
                        <span>Sin clasificar <span className="text-slate-400">({fotosSinTipoFiesta.length} fotos)</span></span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {fotosSinTipoFiesta.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {fotosSinTipoFiesta.map(renderFotoCard)}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sin fotos en esta sección.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {vistaMode === 'servicio' && (
                  <div className="space-y-6">
                    {availableServiciosForView.map((servicio) => {
                      const fotosServicio = fotos.filter((f) => f.categoria === servicio);
                      if (fotosServicio.length === 0) return null;
                      const subcats = SUBCATEGORIAS_POR_SERVICIO[servicio];
                      const fotosOtras = subcats?.length
                        ? fotosServicio.filter((f) => !f.subCategoria || !subcats.includes(f.subCategoria))
                        : [];
                      return (
                        <div key={servicio} className="space-y-3">
                          <h3 className="text-lg font-black uppercase tracking-tight">
                            {servicio} <span className="text-slate-400 text-sm">({fotosServicio.length})</span>
                          </h3>
                          {subcats?.length ? (
                            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                              {subcats.map((sub) => {
                                const fotosSub = fotosServicio.filter((f) => f.subCategoria === sub);
                                if (fotosSub.length === 0) return null;
                                return (
                                  <div key={sub} className="space-y-2">
                                    <h4 className="text-sm font-bold text-slate-600">
                                      {sub} <span className="text-slate-400">({fotosSub.length})</span>
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {fotosSub.map(renderFotoCard)}
                                    </div>
                                  </div>
                                );
                              })}
                              {fotosOtras.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-bold text-slate-600">
                                    Otras <span className="text-slate-400">({fotosOtras.length})</span>
                                  </h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {fotosOtras.map(renderFotoCard)}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {fotosServicio.map(renderFotoCard)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add video form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar Video
                </CardTitle>
                <CardDescription>Podés usar YouTube, Vimeo o subir un archivo propio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Link de YouTube / Vimeo</Label>
                  <Input
                    placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  {videoUrl && extractVideoSource(videoUrl) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={extractVideoSource(videoUrl)?.thumbnailUrl || ''}
                      alt="Vista previa del video"
                      className="mt-2 rounded-lg w-full aspect-video object-cover"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Ej: Boda de Valentina y Rodrigo"
                    value={videoTitulo}
                    onChange={(e) => setVideoTitulo(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Categoría *</Label>
                  <Select value={videoCategoria} onValueChange={setVideoCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {GALERIA_CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    placeholder="Breve descripción..."
                    value={videoDescripcion}
                    onChange={(e) => setVideoDescripcion(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="video-destacado"
                    checked={videoDestacada}
                    onCheckedChange={setVideoDestacada}
                  />
                  <Label htmlFor="video-destacado">Video destacado</Label>
                </div>
                <Button onClick={handleAddVideo} disabled={isSavingVideo} className="w-full">
                  {isSavingVideo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Agregar link de video
                </Button>
                <label htmlFor="video-file-upload" className="w-full">
                  <Button asChild variant="outline" className="w-full" disabled={isUploadingVideoFile}>
                    <span>
                      {isUploadingVideoFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      Subir video propio
                    </span>
                  </Button>
                  <input
                    id="video-file-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={isUploadingVideoFile}
                    onChange={handleUploadVideo}
                  />
                </label>
              </CardContent>
            </Card>
          </div>

          {/* Videos list */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : videos.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Video className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No hay videos todavía. ¡Agregá el primero!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="relative group rounded-xl overflow-hidden border bg-card">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sanitizeHttpUrl(video.thumbnailUrl) ?? ''}
                        alt={video.titulo}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Video className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{video.titulo}</p>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">{video.categoria}</Badge>
                            {video.destacada && <Badge className="text-xs"><Star className="w-3 h-3 mr-1 fill-white" />Destacado</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant={video.destacada ? 'default' : 'ghost'}
                            className="w-7 h-7"
                            onClick={() => handleToggleDestacada(video.id)}
                            title={video.destacada ? 'Quitar destacado' : 'Marcar como destacado'}
                          >
                            <Star className={`w-3 h-3 ${video.destacada ? 'fill-white' : ''}`} />
                          </Button>
                          <Link href={sanitizeHttpUrl(video.youtubeUrl) ?? '#'} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" className="w-7 h-7">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar video?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(video.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={editFotoDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setEditFotoDialog({ open: false, foto: null });
            return;
          }
          setEditFotoDialog((prev) => ({ ...prev, open }));
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar foto</DialogTitle>
            <DialogDescription>Actualizá título, descripción y clasificación de la foto.</DialogDescription>
          </DialogHeader>
          {editFotoDialog.foto && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Título (opcional)</Label>
                <Input
                  value={editFotoDialog.foto.titulo || ''}
                  onChange={(e) => handleEditFotoField('titulo', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  rows={2}
                  value={editFotoDialog.foto.descripcion || ''}
                  onChange={(e) => handleEditFotoField('descripcion', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Tipo de Fiesta (opcional)</Label>
                <Select
                  value={editFotoDialog.foto.tipoFiesta || '__none__'}
                  onValueChange={(v) => handleEditFotoField('tipoFiesta', v === '__none__' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin tipo de fiesta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin tipo de fiesta</SelectItem>
                    {TIPOS_FIESTA_GALERIA.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Categoría / Servicio</Label>
                <Select
                  value={editFotoDialog.foto.categoria}
                  onValueChange={(v) => handleEditFotoField('categoria', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editFotoDialog.foto.categoria && (SUBCATEGORIAS_POR_SERVICIO[editFotoDialog.foto.categoria]?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <Label>Sub-categoría (opcional)</Label>
                  <Select
                    value={editFotoDialog.foto.subCategoria || '__none__'}
                    onValueChange={(v) => handleEditFotoField('subCategoria', v === '__none__' ? undefined : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin sub-categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin sub-categoría</SelectItem>
                      {(SUBCATEGORIAS_POR_SERVICIO[editFotoDialog.foto.categoria] || []).map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Switch
                  id="edit-foto-destacada"
                  checked={!!editFotoDialog.foto.destacada}
                  onCheckedChange={(checked) => handleEditFotoField('destacada', checked)}
                />
                <Label htmlFor="edit-foto-destacada">Destacada</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFotoDialog({ open: false, foto: null })}>Cancelar</Button>
            <Button onClick={handleSaveEditFoto}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
