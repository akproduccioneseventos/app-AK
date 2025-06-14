
'use client';

import { useState } from 'react';
import type { FormEvent as ReactFormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompanyInfoState {
  companyName: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
}

export default function CompanySettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoState>({
    companyName: "Presupuestador AK Producciones",
    taxId: "A08123456",
    address: "Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España",
    email: "",
    phone: "",
  });

  const handleChange = (field: keyof CompanyInfoState, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: ReactFormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: "Información Guardada (Simulado)",
      description: "Los datos de la empresa se han guardado (simulación).",
    });
    // En una aplicación real, aquí llamarías a una server action para guardar los datos.
    // Por ejemplo: await saveCompanyInfo(companyInfo);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Información de la Empresa
        </h1>
        <Link href="/settings" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Datos de tu Empresa</CardTitle>
          <CardDescription>Esta información aparecerá en tus facturas y presupuestos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-base">Nombre de la Empresa</Label>
              <Input 
                id="company-name" 
                placeholder="Ej: AK Producciones S.L." 
                value={companyInfo.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-taxid" className="text-base">NIF/CIF</Label>
              <Input 
                id="company-taxid" 
                placeholder="Ej: B12345678" 
                value={companyInfo.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-address" className="text-base">Dirección Completa</Label>
              <Textarea 
                id="company-address" 
                placeholder="Ej: Calle Falsa 123, Piso 2, Oficina A..." 
                rows={3} 
                value={companyInfo.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-email" className="text-base">Email de Contacto</Label>
                <Input 
                  id="company-email" 
                  type="email" 
                  placeholder="contacto@tuempresa.com" 
                  value={companyInfo.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="text-base p-3"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone" className="text-base">Teléfono de Contacto</Label>
                <Input 
                  id="company-phone" 
                  type="tel" 
                  placeholder="+34 900 000 000" 
                  value={companyInfo.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="text-base p-3"
                  disabled={isSaving}
                />
              </div>
            </div>
             <Image 
                src="https://placehold.co/600x200.png" 
                alt="Configuración de empresa" 
                width={600}
                height={200}
                className="mt-6 rounded-md shadow-md mx-auto"
                data-ai-hint="company settings form"
            />
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                {isSaving ? 'Guardando...' : 'Guardar Información'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
