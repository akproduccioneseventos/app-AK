
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCopy, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareLinkDialogProps {
  children: React.ReactNode;
  link: string;
  title: string;
  description: string;
}

export function ShareLinkDialog({ children, link, title, description }: ShareLinkDialogProps) {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(link);
    toast({ title: "Enlace Copiado", description: "El enlace se ha copiado al portapapeles." });
  };

  const handleWhatsAppSend = () => {
    const message = `¡Hola! Te comparto este enlace para que puedas armar un presupuesto para tu evento:\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">Enlace</Label>
            <Input id="link" value={link} readOnly />
          </div>
          <Button type="button" size="icon" className="px-3" onClick={handleCopyToClipboard}>
            <ClipboardCopy className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={handleWhatsAppSend} className="w-full sm:w-auto bg-green-500 hover:bg-green-600">
            <Send className="w-4 h-4 mr-2" />
            Enviar por WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
