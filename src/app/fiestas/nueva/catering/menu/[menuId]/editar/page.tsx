// This file has been moved to /app/empresa/menus/[menuId]/editar/page.tsx
// The new component will handle the general menu editing.
// This redirect is to ensure old bookmarks don't break.

'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeprecatedEditMenuPage() {
    const router = useRouter();
    const params = useParams();
    const menuId = params.menuId as string;

    useEffect(() => {
        if(menuId){
            router.replace(`/empresa/menus/${menuId}/editar`);
        } else {
            router.replace('/empresa/menus');
        }
    }, [router, menuId]);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
             <div className="flex justify-center items-center h-64">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Redirigiendo al nuevo editor de menús...</p>
            </div>
        </div>
    );
}
