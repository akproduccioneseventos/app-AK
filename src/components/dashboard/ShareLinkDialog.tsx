
'use client';

import { useState, useEffect, type ReactNode } from 'react';
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
import { ClipboardCopy, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCodeStylized from 'qrcode.react';

interface ShareLinkDialogProps {
  children: ReactNode;
  relativePath: string;
  title: string;
  description: string;
}

export function ShareLinkDialog({ children, relativePath, title, description }: ShareLinkDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [fullLink, setFullLink] = useState('');

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const origin = window.location.origin;
      setFullLink(`${origin}${relativePath}`);
    }
  }, [isOpen, relativePath]);

  const handleCopyToClipboard = () => {
    if (!fullLink) return;
    navigator.clipboard.writeText(fullLink);
    toast({ title: "Enlace Copiado", description: "El enlace se ha copiado al portapapeles." });
  };

  const handleWhatsAppSend = () => {
    if (!fullLink) return;
    const message = `¡Hola! Te comparto este enlace: ${fullLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
            {fullLink ? (
                <div className="p-4 bg-white rounded-lg border">
                    <QRCodeStylized value={fullLink} size={160} />
                </div>
            ) : <Loader2 className="w-8 h-8 animate-spin"/>}
            <div className="flex items-center space-x-2 w-full">
              <Input id="link" value={fullLink} readOnly />
              <Button type="button" size="icon" className="px-3" onClick={handleCopyToClipboard} disabled={!fullLink}>
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={handleWhatsAppSend} className="w-full sm:w-auto bg-green-500 hover:bg-green-600" disabled={!fullLink}>
            <Send className="w-4 h-4 mr-2" />
            Enviar por WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
