
'use client';

import React, { useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Wand2, Loader2, AlertTriangle, Lightbulb, Zap, Rocket, ClipboardCopy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateMarketingPlan, type MarketingPlanInput, type MarketingPlanOutput } from '@/ai/flows/generate-marketing-plan-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getInvoiceTemplateSettings } from '@/app/actions/settings';


export default function MarketingAIPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<MarketingPlanOutput | null>(null);

  // Form state for brand identity
  const [brandInfo, setBrandInfo] = useState<MarketingPlanInput>({
    brandName: 'AK Producciones',
    targetAudience: 'Personas y empresas en Salto que buscan organizar eventos memorables, desde fiestas de 15 y bodas hasta eventos corporativos. Valoran la experiencia, la calidad y un servicio integral.',
    keyServices: 'Organización integral de fiestas, servicio de catering, discoteca, decoración, barra de tragos, personal para eventos.',
    toneOfVoice: 'Cercano y Amistoso',
    mainGoal: 'Generar leads para fiestas de fin de año',
  });

  const handleInputChange = (field: keyof MarketingPlanInput, value: string) => {
    setBrandInfo(prev => ({...prev, [field]: value}));
  };

  const handleGeneratePlan = async (e: FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setPlanResult(null);

    try {
      const result = await generateMarketingPlan(brandInfo);
      setPlanResult(result);
      toast({ title: "¡Plan de Marketing Generado!", description: "La IA ha creado una estrategia semanal para ti." });
    } catch (err: any) {
      console.error("Error generating marketing plan:", err);
      setError(err.message || "Ocurrió un error inesperado durante la generación del plan.");
      toast({ title: "Error de IA", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado al portapapeles" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Asesor de Marketing IA</h1>
        </div>
        <Link href="/empresa/redes-sociales" passHref>
          <Button variant="outline" disabled={isGenerating}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      <p className="text-lg text-muted-foreground">
        Define la identidad de tu marca y deja que la IA cree un plan de contenido semanal estratégico para tus redes sociales.
      </p>

      <Card className="shadow-lg">
        <form onSubmit={handleGeneratePlan}>
          <CardHeader>
            <CardTitle className="font-headline text-xl">1. Define tu Marca y Objetivos</CardTitle>
            <CardDescription>Proporciona a la IA el contexto que necesita para crear una estrategia relevante.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="brandName">Nombre de tu Marca</Label>
                <Input id="brandName" value={brandInfo.brandName} onChange={e => handleInputChange('brandName', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="targetAudience">Público Objetivo</Label>
                    <Textarea id="targetAudience" value={brandInfo.targetAudience} onChange={e => handleInputChange('targetAudience', e.target.value)} rows={3}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="keyServices">Servicios Clave</Label>
                    <Textarea id="keyServices" value={brandInfo.keyServices} onChange={e => handleInputChange('keyServices', e.target.value)} rows={3}/>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="toneOfVoice">Tono de Voz</Label>
                    <Select value={brandInfo.toneOfVoice} onValueChange={(val) => handleInputChange('toneOfVoice', val)}>
                        <SelectTrigger id="toneOfVoice"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Profesional y Corporativo">Profesional y Corporativo</SelectItem>
                            <SelectItem value="Cercano y Amistoso">Cercano y Amistoso</SelectItem>
                            <SelectItem value="Moderno y Divertido">Moderno y Divertido</SelectItem>
                            <SelectItem value="Lujoso y Exclusivo">Lujoso y Exclusivo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="mainGoal">Objetivo Principal de la Semana</Label>
                    <Input id="mainGoal" value={brandInfo.mainGoal} onChange={e => handleInputChange('mainGoal', e.target.value)} placeholder="Ej: Generar leads, crear contenido viral..."/>
                </div>
             </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Zap className="w-5 h-5 mr-2"/>}
              {isGenerating ? 'Creando Estrategia...' : 'Generar Plan de Marketing Semanal'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isGenerating && (
        <div className="text-center py-10">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary"/>
            <p className="mt-4 text-muted-foreground">La IA está diseñando tu plan estratégico...</p>
        </div>
      )}

      {error && (
        <Card className="border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/>Error al Generar Plan</CardTitle></CardHeader><CardContent><p>{error}</p></CardContent></Card>
      )}

      {planResult && (
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><Rocket className="text-primary"/>Resumen de la Estrategia Semanal</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">{planResult.weeklySummary}</p></CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><Lightbulb className="text-primary"/>Ideas de Contenido Diario</CardTitle></CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                        {planResult.dailyPlan.map((post, index) => (
                             <AccordionItem key={index} value={`item-${index}`} className="border-b">
                                <AccordionTrigger className="text-md font-semibold hover:no-underline">{post.day}: <span className="text-primary ml-2">{post.theme}</span></AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-3">
                                    <p className="text-muted-foreground whitespace-pre-line">{post.contentIdea}</p>
                                    <div className="flex justify-between items-center">
                                       <p className="text-xs font-mono bg-muted p-1.5 rounded">{post.suggestedHashtags}</p>
                                       <Button size="sm" variant="ghost" onClick={() => handleCopyToClipboard(post.contentIdea)}><ClipboardCopy className="w-4 h-4 mr-2"/>Copiar Idea</Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

