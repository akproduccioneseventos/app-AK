'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This is a client-side redirect component
export default function RedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    // We redirect to the '/ver' sub-page which contains the actual content
    if (id) {
      router.replace(`/presupuestos/${id}/ver`);
    }
  }, [id, router]);

  // You can show a loading spinner here if you want
  return null;
}