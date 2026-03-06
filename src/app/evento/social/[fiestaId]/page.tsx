'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useRef, type ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSocialPosts, uploadSocialPost, addLikeToPost, addCommentToPost, deleteSocialPost, clearGallery, getChatMessages, addChatMessage } from '@/app/actions/social-gallery';
import type { SocialGalleryPost, SocialComment, ChatMessage } from '@/types/social-gallery';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FiestaEnPlanificacion, SocialConnection, SocialGallerySettings } from '@/types/fiesta';
import { motion, AnimatePresence } from 'framer-motion';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import NextImage from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Heart, MessageCircle, Send, Upload, RefreshCw, PartyPopper, MonitorPlay, X, Trash2, Download, Share2, User as UserIcon, MessageSquare, Settings2, CheckCircle2, Save, Camera as CameraIcon } from 'lucide-react';
import { WatermarkedImage } from '@/components/watermarked-image';
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
} from "@/components/ui/alert-dialog";
import { ShareLinkDialog } from '@/components/dashboard/ShareLinkDialog';
import QRCodeStylized from 'qrcode.react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getSocialConnections } from '@/app/actions/social-connections';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';


const PostCard: React.FC<{ 
  post: SocialGalleryPost; 
  onLike: (postId: string) => void; 
  onComment: (postId: string, text: string) => Promise<void>; 
  onDelete?: (postId: string) => void;
  isAdminView: boolean;
  authorName: string;
  accentColor: string;
}> = ({ post, onLike, onComment, onDelete, isAdminView, authorName, accentColor }) => {
  const [commentText, setCommentText] = useState('');
  
  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await onComment(post.id, commentText);
    setCommentText('');
  };

  const formattedTimestamp = formatDistanceToNow(new Date(post.timestamp), {
    addSuffix: true,
    locale: es,
  });

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <Card className="shadow-xl border-none overflow-hidden flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl group transition-all hover:translate-y-[-4px]">
        <CardHeader className="flex flex-row items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner" style={{ backgroundColor: accentColor }}>
                {post.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="font-bold text-sm text-slate-800">{post.authorName}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{formattedTimestamp}</p>
            </div>
            </div>
            {isAdminView && onDelete && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive"><Trash2 className="w-4 h-4"/></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>Se eliminará esta foto. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(post.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            )}
        </CardHeader>
        <CardContent className="p-0 flex-grow">
            <WatermarkedImage containerClassName="aspect-square relative bg-slate-100" src={post.imageUrl} alt={`Foto de ${post.authorName}`} layout="fill" objectFit="cover" data-ai-hint="event photo" />
        </CardContent>
        <CardFooter className="p-4 flex flex-col items-start gap-3">
            <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 group/like outline-none">
                        <Heart className={`w-6 h-6 transition-all ${post.likes > 0 ? 'text-red-500 fill-current scale-110' : 'text-slate-400 group-hover/like:text-red-400'}`} />
                        <span className="text-sm font-bold text-slate-600">{post.likes}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-sm font-bold text-slate-600">{post.comments.length}</span>
                    </div>
                </div>
            </div>
            <div className="w-full pt-3 border-t border-slate-100 space-y-3">
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 text-sm scrollbar-hide">
                    {post.comments.length > 0 ? post.comments.map(c => (
                        <div key={c.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                            <span className="font-black text-slate-700 text-xs mr-1">{c.authorName}:</span> 
                            <span className="text-slate-600 leading-relaxed">{c.text}</span>
                        </div>
                    )) : <p className="text-xs text-muted-foreground text-center py-2 italic">Sin comentarios aún...</p>}
                </div>
                <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
                    <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Escribe un comentario..." className="h-10 text-xs rounded-xl bg-slate-50 border-none focus-visible:ring-1" style={{ '--tw-ring-color': accentColor } as any}/>
                    <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0 rounded-xl shadow-md transition-transform active:scale-95" disabled={!commentText.trim()} style={{ backgroundColor: accentColor }}>
                        <Send className="w-4 h-4"/>
                    </Button>
                </form>
            </div>
        </CardFooter>
        </Card>
    </motion.div>
  );
};


export default function SocialGalleryPage({ params }: { params: { fiestaId: string } }) {
  const { toast } = useToast();
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  
  const [authorName, setAuthorName] = useState('');
  const [tempAuthorName, setTempAuthorName] = useState('');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  const [isAdminView, setIsAdminView] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  // Custom Settings State (for Admin)
  const [localSettings, setLocalSettings] = useState<SocialGallerySettings>({
      enabled: true,
      allowLikes: true,
      allowComments: true,
      uploadsActive: true,
      backgroundColor: '#f1f5f9',
      accentColor: '#3b82f6',
      chatEnabled: true,
      title: '',
      subtitle: ''
  });


  // Dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  // Projection mode state
  const [projectionMode, setProjectionMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);


  const fetchData = useCallback(async (showLoadingIndicator = true) => {
    if(showLoadingIndicator) setIsLoading(true);
    try {
      const [fetchedPosts, fiestaData, fetchedChat, settingsData, socialConnections] = await Promise.all([
          getSocialPosts(params.fiestaId),
          getFiestaById(params.fiestaId),
          getChatMessages(params.fiestaId),
          getInvoiceTemplateSettings(),
          getSocialConnections(),
      ]);
      setPosts(fetchedPosts);
      setFiesta(fiestaData);
      if (fiestaData?.socialGallerySettings) {
          setLocalSettings(prev => ({ ...prev, ...fiestaData.socialGallerySettings }));
      }
      setChatMessages(fetchedChat);
      setCompanyLogoUrl(settingsData.logoUrl);
      setWhatsappNumber(socialConnections.find(c => c.platform === 'WhatsApp')?.phoneNumber || null);

    } catch (e) {
      toast({ title: "Error al cargar galería", variant: "destructive" });
    } finally {
      if(showLoadingIndicator) setIsLoading(false);
    }
  }, [params.fiestaId, toast]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const sessionAuth = sessionStorage.getItem('ak_producciones_auth_session') === 'true';
        setIsAdminView(sessionAuth);
        
        if (sessionAuth) {
            setAuthorName("Organización");
        } else {
            const savedName = sessionStorage.getItem(`socialWallAuthor_${params.fiestaId}`);
            if (savedName) {
                setAuthorName(savedName);
            } else {
                setIsNameModalOpen(true);
            }
        }
    }
  }, [params.fiestaId]);


  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
        fetchData(false);
    }, 5000); 
    return () => clearInterval(interval);
  }, [fetchData]);
  
  useEffect(() => {
    if (projectionMode && posts.length > 0) {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % posts.length);
        }, 7000);
        return () => clearInterval(timer);
    }
  }, [projectionMode, posts.length]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);


  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
         toast({ title: "Archivo demasiado grande", description: "El tamaño máximo es 10MB.", variant: "destructive" });
         return;
      }
      setFileToUpload(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSetAuthorName = (e: FormEvent) => {
    e.preventDefault();
    if(tempAuthorName.trim()) {
        setAuthorName(tempAuthorName);
        sessionStorage.setItem(`socialWallAuthor_${params.fiestaId}`, tempAuthorName);
        setIsNameModalOpen(false);
    }
  };

  const handleUploadSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fileToUpload) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('fiestaId', params.fiestaId);
    formData.append('file', fileToUpload);
    formData.append('authorName', authorName || 'Anónimo');

    const result = await uploadSocialPost(formData);
    if (result.success) {
      toast({ title: "¡Foto publicada!", description: "Tu momento ya está en el mural." });
      await fetchData(false);
      setIsUploadDialogOpen(false);
      setFileToUpload(null);
      setUploadPreview(null);
    } else {
      toast({ title: "Error al subir", description: result.error, variant: "destructive" });
    }
    setIsUploading(false);
  };
  
  const handleLike = async (postId: string) => {
    const originalPosts = [...posts];
    setPosts(prev => prev.map(p => p.id === postId ? {...p, likes: (p.likes || 0) + 1} : p));
    const result = await addLikeToPost(postId);
    if (!result.success) {
      toast({title: "Error", description: "No se pudo registrar el 'Me Gusta'."});
      setPosts(originalPosts); // Revert on error
    }
  };
  
  const handleComment = async (postId: string, text: string) => {
    const result = await addCommentToPost(postId, text, authorName || 'Anónimo');
    if (!result.success) {
        toast({title: "Error", description: "No se pudo añadir el comentario."});
    }
    await fetchData(false);
  };

   const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    setIsSendingChat(true);
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      authorName: authorName || 'Anónimo',
      text: newChatMessage,
      timestamp: new Date().toISOString(),
      fiestaId: params.fiestaId
    };
    setChatMessages(prev => [...prev, optimisticMessage]);
    setNewChatMessage('');
    
    const result = await addChatMessage(params.fiestaId, newChatMessage, authorName);
    if (!result.success) {
      toast({ title: "Error", description: "No se pudo enviar tu mensaje.", variant: "destructive" });
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMessage.id)); // Revert
    } else {
        await fetchData(false); // Sync with server state
    }
    setIsSendingChat(false);
  };


  const handleDelete = async (postId: string) => {
    await deleteSocialPost(postId);
    toast({ title: "Foto eliminada" });
    await fetchData(false);
  };

  const handleClearGallery = async () => {
    setIsClearing(true);
    await clearGallery(params.fiestaId);
    toast({ title: "Galería Limpiada", variant: "destructive" });
    await fetchData();
    setIsClearing(false);
  };

  const handleSaveSettings = async () => {
      if (!fiesta) return;
      setIsSavingSettings(true);
      try {
          const updatedFiesta = { ...fiesta, socialGallerySettings: localSettings };
          const result = await saveFiesta(updatedFiesta);
          if (result.success) {
              toast({ title: "Ajustes guardados" });
              setIsSettingsDialogOpen(false);
              await fetchData(false);
          } else throw new Error(result.error);
      } catch (e: any) {
          toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally {
          setIsSavingSettings(false);
      }
  };
  
  const handleDownloadChat = async () => {
    let content = `Historial del Chat - ${fiesta?.configuracion.nombreEvento || 'Evento'}\n`;
    content += `Generado el: ${new Date().toLocaleString('es-ES')}\n\n`;
    chatMessages.forEach(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString('es-ES');
      content += `[${timestamp}] ${msg.authorName}: ${msg.text}\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${params.fiestaId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const accentColor = localSettings.accentColor || '#3b82f6';
  const bgColor = localSettings.backgroundColor || '#f1f5f9';

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: bgColor }}>
      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} hideCloseButton className="rounded-3xl border-none shadow-2xl">
            <DialogHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="w-8 h-8 text-primary"/>
                </div>
                <DialogTitle className="text-2xl font-headline">¡Bienvenido/a!</DialogTitle>
                <DialogDescription className="text-base">Dinos tu nombre para participar en el mural del evento.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSetAuthorName} className="space-y-6 py-4">
                <div className="space-y-2">
                    <Label htmlFor="author-name-input" className="text-xs uppercase tracking-widest font-bold text-slate-400">Tu Nombre</Label>
                    <Input id="author-name-input" value={tempAuthorName} onChange={e => setTempAuthorName(e.target.value)} placeholder="Ej: Juan Pérez" required className="h-12 rounded-xl text-lg bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary"/>
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg" disabled={!tempAuthorName.trim()}>Ingresar al Mural</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm px-4">
        <div className="max-w-6xl mx-auto h-20 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-2.5 rounded-2xl hidden sm:flex" style={{ backgroundColor: `${accentColor}15` }}>
                <PartyPopper className="w-6 h-6" style={{ color: accentColor }}/>
            </div>
            <div className="min-w-0">
                <h1 className="text-xl font-black font-headline text-slate-800 truncate">
                    {localSettings.title || fiesta?.configuracion.nombreEvento || 'Mural Social'}
                </h1>
                <p className="text-xs font-medium text-slate-400 truncate uppercase tracking-tighter">
                    {localSettings.subtitle || 'Comparte tus fotos favoritas'}
                </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
             <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="h-11 rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95" disabled={!authorName} style={{ backgroundColor: accentColor }}>
                        <Upload className="w-5 h-5 mr-2"/>
                        <span className="hidden sm:inline">Subir Foto</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-none">
                    <DialogHeader><DialogTitle className="text-xl font-bold">Publicar Momento</DialogTitle><DialogDescription>Sube una foto para que todos la vean.</DialogDescription></DialogHeader>
                    <form onSubmit={handleUploadSubmit} className="space-y-6 py-2">
                        {uploadPreview ? (
                            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-inner border bg-slate-50">
                                <NextImage src={uploadPreview} alt="Vista previa" layout="fill" objectFit="contain" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={() => {setFileToUpload(null); setUploadPreview(null);}}><X className="w-4 h-4"/></Button>
                            </div>
                        ) : (
                            <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 transition-colors hover:bg-slate-100 hover:border-primary/30">
                                <Label htmlFor="file-upload-dialog" className="cursor-pointer text-center text-slate-400 p-8 flex flex-col items-center gap-3">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                                        <Upload className="w-8 h-8 text-primary" style={{ color: accentColor }}/>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-600">Toca para seleccionar</p>
                                        <p className="text-xs">JPG, PNG o GIF (Máx 10MB)</p>
                                    </div>
                                </Label>
                                <Input id="file-upload-dialog" type="file" onChange={handleFileSelect} className="hidden" accept="image/*" />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={isUploading || !fileToUpload} style={{ backgroundColor: accentColor }}>
                                {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Send className="w-5 h-5 mr-2"/>}
                                {isUploading ? "Publicando..." : "Publicar ahora"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {isAdminView && (
              <>
                 <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="h-11 w-11 rounded-2xl p-0 border-slate-200"><Settings2 className="w-5 h-5 text-slate-600"/></Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl border-none">
                        <DialogHeader><DialogTitle className="text-xl font-bold">Ajustes del Mural</DialogTitle><DialogDescription>Personaliza la apariencia y funciones para los invitados.</DialogDescription></DialogHeader>
                        <div className="space-y-5 py-4">
                            <div className="space-y-2"><Label className="text-xs font-bold text-slate-400 uppercase">Personalización Visual</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><Label>Color Fondo</Label><div className="flex gap-2"><Input type="color" value={localSettings.backgroundColor} onChange={e => setLocalSettings(p => ({...p, backgroundColor: e.target.value}))} className="w-10 h-10 p-1"/><Input value={localSettings.backgroundColor} onChange={e => setLocalSettings(p => ({...p, backgroundColor: e.target.value}))}/></div></div>
                                    <div className="space-y-1.5"><Label>Color Acento</Label><div className="flex gap-2"><Input type="color" value={localSettings.accentColor} onChange={e => setLocalSettings(p => ({...p, accentColor: e.target.value}))} className="w-10 h-10 p-1"/><Input value={localSettings.accentColor} onChange={e => setLocalSettings(p => ({...p, accentColor: e.target.value}))}/></div></div>
                                </div>
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-base font-bold">Chat en Vivo</Label><p className="text-xs text-muted-foreground">Activa el panel de conversación inferior.</p></div><Switch checked={localSettings.chatEnabled} onCheckedChange={v => setLocalSettings(p => ({...p, chatEnabled: v}))}/></div>
                            <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-base font-bold">Permitir Subidas</Label><p className="text-xs text-muted-foreground">Habilitar el botón de "Subir Foto".</p></div><Switch checked={localSettings.uploadsActive} onCheckedChange={v => setLocalSettings(p => ({...p, uploadsActive: v}))}/></div>
                        </div>
                        <DialogFooter><Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full h-12 rounded-xl text-lg font-bold">{isSavingSettings ? <Loader2 className="animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}Guardar Ajustes</Button></DialogFooter>
                    </DialogContent>
                 </Dialog>
                 <ShareLinkDialog relativePath={`/evento/social/${params.fiestaId}`} title="Compartir Mural" description="Usa este código para que los invitados se unan.">
                    <Button variant="outline" className="h-11 w-11 rounded-2xl p-0 border-slate-200"><Share2 className="w-5 h-5 text-slate-600"/></Button>
                </ShareLinkDialog>
                 <Button variant="outline" onClick={() => setProjectionMode(true)} className="h-11 w-11 rounded-2xl p-0 border-slate-200"><MonitorPlay className="w-5 h-5 text-slate-600"/></Button>
              </>
            )}
             <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={isLoading} className="h-11 w-11 rounded-2xl"><RefreshCw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`}/></Button>
          </div>
        </div>
        {isAdminView && (
          <div className="bg-amber-50 border-y border-amber-100 p-2.5 flex justify-center items-center gap-6 overflow-x-auto">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest whitespace-nowrap">MODO ADMINISTRADOR</span>
            <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-amber-800 hover:bg-amber-100" onClick={handleDownloadChat}><Download className="w-3 h-3 mr-1.5"/>CHAT</Button>
                <a href={`/api/social-gallery/${params.fiestaId}/download`} download><Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-amber-800 hover:bg-amber-100"><Download className="w-3 h-3 mr-1.5"/>FOTOS</Button></a>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-destructive hover:bg-red-50" disabled={isClearing}><Trash2 className="w-3 h-3 mr-1.5"/>VACIAR</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Vaciar el mural?</AlertDialogTitle><AlertDialogDescription>Se eliminarán permanentemente todas las fotos y mensajes.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleClearGallery} className="bg-destructive hover:bg-destructive/90">Confirmar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-8 space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence>
                {posts.length === 0 && isLoading ? (
                    Array.from({length:4}).map((_, i) => (
                        <div key={i} className="aspect-square bg-white/50 animate-pulse rounded-3xl border border-white"></div>
                    ))
                ) : posts.map(post => (
                    <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} isAdminView={isAdminView} onDelete={handleDelete} authorName={authorName} accentColor={accentColor} />
                ))}
            </AnimatePresence>
        </div>
        
        {posts.length === 0 && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-slate-200">
                    <CameraIcon className="w-10 h-10 text-slate-300"/>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">¡Mural vacío!</h2>
                    <p className="text-slate-400">Sé el primero en compartir una foto de este momento.</p>
                </div>
                <Button onClick={() => setIsUploadDialogOpen(true)} className="h-12 rounded-xl px-8 font-bold" style={{ backgroundColor: accentColor }}>Subir primera foto</Button>
            </motion.div>
        )}
        
        {localSettings.chatEnabled && (
            <Card className="shadow-2xl border-none rounded-[1.5rem] overflow-hidden bg-white/90 backdrop-blur-md max-w-lg mx-auto">
                <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}15` }}>
                        <MessageSquare className="w-4 h-4" style={{ color: accentColor }}/>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-800">Chat del Evento</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <ScrollArea className="h-48 pr-4">
                        <div className="space-y-3">
                            {chatMessages.map(msg => {
                                const isMe = msg.authorName === authorName;
                                return (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[90%]", isMe ? "ml-auto items-end" : "items-start")}>
                                        {!isMe && <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 ml-1">{msg.authorName}</span>}
                                        <div className={cn("px-3 py-1.5 rounded-xl text-xs shadow-sm", isMe ? "text-white" : "bg-slate-100 text-slate-700")} style={isMe ? { backgroundColor: accentColor } : {}}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[8px] text-slate-300 mt-0.5 mx-1">{new Date(msg.timestamp).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef}/>
                        </div>
                    </ScrollArea>
                    <form onSubmit={handleChatSubmit} className="flex gap-2 items-center mt-4 pt-3 border-t border-slate-100">
                        <Input value={newChatMessage} onChange={e => setNewChatMessage(e.target.value)} placeholder="Escribe un mensaje..." disabled={isSendingChat || !authorName} className="h-10 rounded-xl bg-slate-50 border-none px-4 text-xs focus-visible:ring-2" style={{ '--tw-ring-color': accentColor } as any} />
                        <Button type="submit" disabled={!newChatMessage.trim() || isSendingChat || !authorName} className="h-10 w-10 rounded-xl flex-shrink-0 shadow-lg shadow-primary/10 transition-transform active:scale-95" style={{ backgroundColor: accentColor }}>
                            {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        )}
      </main>
      
      {projectionMode && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col md:flex-row p-4 gap-4">
            <Button onClick={() => setProjectionMode(false)} variant="ghost" size="icon" className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/80 text-white hover:text-white h-10 w-10"><X className="w-6 h-6"/></Button>
            <div className="relative flex-grow h-full w-full md:w-3/4">
                {posts.map((post, index) => (
                    <div key={post.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                        <WatermarkedImage src={post.imageUrl} layout="fill" objectFit="contain" alt={`Foto de ${post.authorName}`} />
                    </div>
                ))}
            </div>
             <div className="flex-shrink-0 w-full md:w-1/4 h-1/3 md:h-full bg-slate-900/90 backdrop-blur rounded-[2rem] p-6 flex flex-col text-white shadow-2xl border border-white/5">
                {companyLogoUrl && (
                    <div className="relative h-24 w-full mb-6">
                        <NextImage src={companyLogoUrl} alt="Logo" layout="fill" objectFit="contain" data-ai-hint="company logo"/>
                    </div>
                )}
                <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="w-5 h-5" style={{ color: accentColor }}/>
                    <h2 className="text-xl font-black font-headline tracking-tight">Conversación</h2>
                </div>
                 <ScrollArea className="flex-grow mb-6">
                     <div className="space-y-4">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                <span className="font-black text-[10px] uppercase tracking-widest block mb-1" style={{ color: accentColor }}>{msg.authorName}</span>
                                <span className="text-sm leading-relaxed text-slate-200">{msg.text}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef}/>
                    </div>
                 </ScrollArea>
                 <div className="flex-shrink-0 text-center space-y-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                     <div className="space-y-3">
                        <p className="font-bold text-slate-300 text-sm">¡Escanea y participa!</p>
                        <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl">
                            <QRCodeStylized value={`${window.location.origin}/evento/social/${params.fiestaId}`} size={120} />
                        </div>
                     </div>
                     {whatsappNumber && (
                        <div className="border-t border-white/10 pt-4">
                           <p className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2">Contacto</p>
                           <p className="flex items-center justify-center gap-2 text-lg font-black" style={{ color: accentColor }}>
                             <MessageSquare className="w-5 h-5"/>
                             {whatsappNumber}
                           </p>
                        </div>
                     )}
                 </div>
            </div>
        </div>
      )}
    </div>
  );
}
