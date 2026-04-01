'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp-templates';

interface WhatsAppSendModalProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the dialog should close (cancel or after send). */
  onOpenChange: (open: boolean) => void;
  /** Initial rendered message text (user can edit before sending). */
  initialMessage: string;
  /** WhatsApp phone number (digits only, with country code). */
  phoneNumber?: string;
}

/**
 * "Edit before sending" modal for WhatsApp messages.
 * Pre-fills the rendered message and lets the user tweak it before
 * opening the wa.me link.
 */
export function WhatsAppSendModal({
  open,
  onOpenChange,
  initialMessage,
  phoneNumber = '',
}: WhatsAppSendModalProps) {
  const [message, setMessage] = useState(initialMessage);

  // Reset message text whenever the dialog opens with a fresh render
  useEffect(() => {
    if (open) setMessage(initialMessage);
  }, [open, initialMessage]);

  const handleSend = () => {
    openWhatsApp(phoneNumber, message);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            Enviar por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Revisá y editá el mensaje antes de abrirlo en WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={10}
          className="font-mono text-sm resize-none"
          placeholder="Escribí el mensaje aquí..."
        />

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSend}
          >
            <Send className="w-4 h-4 mr-2" />
            Abrir en WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
