'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getPublicGuestPortalData } from '@/app/actions/public-guest-portal';
import { updateGuestQuinceDate } from '@/app/actions/fiesta/invitados.actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';

export function QuinceLeadPrompt({ fiestaId, guestId, guestAccessToken }: { fiestaId?: string; guestId?: string; guestAccessToken?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateStr, setDateStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!fiestaId || !guestId || !guestAccessToken) return;
    
    // Solo mostramos este prompt una vez por sesion local si el usuario lo cierra,
    // o nunca si ya se guardó la info (lo valida el backend).
    if (localStorage.getItem(`q15_prompted_${guestId}`)) return;

    let mounted = true;
    
    const checkGuest = async () => {
      try {
        const portal = await getPublicGuestPortalData(fiestaId, guestId, guestAccessToken);
        if (!mounted || !portal?.guest) return;
        
        const isTeen = portal.guest.categoria === 'Adolescente' || portal.guest.categoria === 'Niño/Adolescente';
        
        if (isTeen && !portal.guest.cumple15) {
          // Add a small delay so it doesn't pop up instantly and interrupt the main experience
          setTimeout(() => {
            if (mounted) setIsOpen(true);
          }, 3500);
        }
      } catch (e) {
        console.warn('Failed to check guest for quince lead:', e);
      }
    };
    
    checkGuest();
    
    return () => { mounted = false; };
  }, [fiestaId, guestId, guestAccessToken]);

  const handleSubmit = async () => {
    if (!dateStr || !fiestaId || !guestId || !guestAccessToken) return;
    
    setIsSubmitting(true);
    try {
      const res = await updateGuestQuinceDate(fiestaId, guestId, guestAccessToken, dateStr);
      if (res.success) {
        setIsOpen(false);
        localStorage.setItem(`q15_prompted_${guestId}`, 'true');
        toast({ title: "¡Anotado! 🎉", description: "Falta menos de lo que pensás para tu fiesta." });
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo guardar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    setIsOpen(false);
    // Remember that they skipped so we don't nag them again on this device
    localStorage.setItem(`q15_prompted_${guestId}`, 'true');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-sm rounded-3xl border-2 border-indigo-500/20 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto bg-indigo-100 text-indigo-600 p-3 rounded-full w-fit mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-xl font-black text-slate-900 tracking-tight">
            ¿Cuándo cumplís tus 15?
          </DialogTitle>
          <DialogDescription className="text-center font-semibold text-slate-500">
            Contanos tu fecha de cumple y enterate de los beneficios de festejar con AK Producciones.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-slate-400 px-1">Tu fecha de cumpleaños</Label>
            <Input 
              type="date" 
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-base font-bold"
            />
          </div>
        </div>
        
        <DialogFooter className="flex-col gap-2 sm:flex-col items-stretch">
          <Button 
            onClick={handleSubmit} 
            disabled={!dateStr || isSubmitting}
            className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar fecha
          </Button>
          <Button 
            onClick={handleSkip} 
            variant="ghost" 
            className="w-full text-slate-400 font-bold hover:text-slate-600"
          >
            Ahora no
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
