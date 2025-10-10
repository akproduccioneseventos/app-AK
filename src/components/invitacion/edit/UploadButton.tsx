
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, UploadCloud } from "lucide-react";
import React, { useState } from "react";
import NextImage from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { uploadPublicPageAsset } from "@/app/actions/fiesta/assets.actions";


interface UploadButtonProps {
    currentUrl?: string | null;
    onUrlChange: (url: string) => void;
    accept?: string;
    fiestaId?: string; // Make fiestaId optional
}

export const UploadButton: React.FC<UploadButtonProps> = ({ currentUrl, onUrlChange, accept="image/*", fiestaId: propFiestaId }) => {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    // Get fiestaId from props first, then from searchParams as a fallback
    const fiestaId = propFiestaId || searchParams.get('fiestaId');

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileToUpload(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!fileToUpload || !fiestaId) {
            toast({title: "Error", description: "Falta el archivo o el ID de la fiesta.", variant: "destructive"});
            return;
        }
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('fiestaId', fiestaId);
            formData.append('file', fileToUpload);
            const result = await uploadPublicPageAsset(fiestaId, fileToUpload);

            if (result.success && result.url) {
                onUrlChange(result.url);
                toast({title: "Archivo Subido"});
                setIsUploadModalOpen(false);
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            toast({ title: "Error", description: `No se pudo subir el archivo: ${e.message}`, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    }
    
    return (
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <div className="flex items-center gap-2">
                <Input value={currentUrl || ''} onChange={e => onUrlChange(e.target.value)} placeholder="https://... o sube un archivo"/>
                <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                        setFileToUpload(null);
                        setPreviewUrl(null);
                    }}>
                        Subir
                    </Button>
                </DialogTrigger>
            </div>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Subir Archivo Multimedia</DialogTitle>
                    <DialogDescription>Selecciona una imagen o video para esta sección.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label htmlFor="upload-file-input">Archivo</Label>
                    <Input id="upload-file-input" type="file" accept={accept} onChange={handleFileChange} />
                    {previewUrl && (
                        <div className="mt-2 relative h-48 w-full">
                            <NextImage src={previewUrl} alt="Vista previa" fill style={{objectFit: 'contain'}} className="rounded-md" />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                    <Button onClick={handleUpload} disabled={isUploading || !fileToUpload}>
                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UploadCloud className="w-4 h-4 mr-2"/>}
                        Subir y Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
