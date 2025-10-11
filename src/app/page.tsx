
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RedirectToAdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new admin dashboard
    router.replace('/admin/aaiff');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );
}

    