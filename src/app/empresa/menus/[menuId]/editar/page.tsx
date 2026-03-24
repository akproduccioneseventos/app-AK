
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, Loader2 } from 'lucide-react';
import { MenuForm } from '@/components/catering/MenuForm';
import { getMenuById } from '@/app/actions/menus-catering';
import type { FullMenu } from '@/types/catering';
import { useToast } from '@/hooks/use-toast';

export default function EditarMenuPage({ params }: { params: { menuId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadMenu = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const decodedId = decodeURIComponent(id);
      const menuData = await getMenuById(decodedId);
      if (menuData) {
        setMenu(menuData);
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
            <Link href="/empresa/menus" passHref>
                <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Menús
                </Button>
            </Link>
        </div>
      </div>

      <MenuForm existingMenu={menu || undefined} />
    </div>
  );
}
