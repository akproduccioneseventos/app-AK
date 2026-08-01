'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface MercadoPagoButtonProps {
  amount: number;
  title: string;
  referenceId: string;
  buttonText?: string;
  className?: string;
}

export function MercadoPagoButton({ amount, title, referenceId, buttonText = 'Regalar por MercadoPago', className = '' }: MercadoPagoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Llamada al endpoint interno para no exponer el Access Token en el cliente
      const res = await fetch('/api/integrations/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount,
          referenceId
        })
      });

      const data = await res.json();
      
      if (data.init_point) {
        // Redirigir al usuario a la pasarela de pago de MercadoPago
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || 'No se pudo generar el link');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error de conexión',
        description: 'No pudimos conectarnos con MercadoPago. Intentá de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={isLoading}
      className={`bg-[#009EE3] hover:bg-[#008ACB] text-white font-bold py-6 px-8 rounded-2xl w-full flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <>
          <CreditCard className="w-6 h-6" />
          <span className="text-lg">{buttonText}</span>
        </>
      )}
    </Button>
  );
}
