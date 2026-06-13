import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { Post445QuickAccess } from './post445-quick-access';

export default function NuevaFiestaLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <Post445QuickAccess />
      </Suspense>
    </>
  );
}
