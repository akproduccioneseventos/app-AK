'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, Loader2 } from 'lucide-react';
import { MenuForm } from '@/components/catering/MenuForm';
import { getMenuById } from '@/app/actions/menus-catering';
import { getInsumos } from '@/app/actions/insumos';
import type { FullMenu } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { useToast } from '@/hooks/use-toast';
import { avisosDeUnidadesDelMenu } from '@/lib/catering/unidades';

export default function EditarMenuPage() {
  const params = useParams<{ menuId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [insumos, setInsumos] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMenu = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const decodedId = decodeURIComponent(id);
      const [menuData, insumosData] = await Promise.all([getMenuById(decodedId), getInsumos()]);
      if (menuData) {
        setMenu(menuData);
        setInsumos(insumosData);
      } else {
        toast({
          title: 'Error',
          description: `No se encontró el menú con ID ${decodedId}.`,
          variant: 'destructive'
        });
        router.push('/empresa/menus');
      }
    } catch (e) {
      toast({ title: 'Error al cargar', variant: 'destructive' });
      router.push('/empresa/menus');
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);


  useEffect(() => {
    if (params.menuId) {
      loadMenu(params.menuId);
    }
  }, [params.menuId, loadMenu]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const avisosUnidades = menu ? avisosDeUnidadesDelMenu((menu.items || []).flatMap(item => item.ingredients || []), insumos) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editar Menú: <span className="text-primary">{menu?.name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline"><Link href="/empresa/menus">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Menús
                </Link></Button>
        </div>
      </div>

      {avisosUnidades.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-1">
          <p className="font-semibold">Avisos de unidades:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {avisosUnidades.map((aviso, idx) => (
              <li key={idx}>{aviso}</li>
            ))}
          </ul>
        </div>
      )}

      <MenuForm existingMenu={menu || undefined} />
    </div>
  );
}
