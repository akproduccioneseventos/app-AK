'use client';

import { useEffect } from 'react';
import { recoverFromDeploymentMismatch } from '@/lib/deployment-recovery';

export function DeploymentRecovery() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      void recoverFromDeploymentMismatch(event.error || event.message);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      void recoverFromDeploymentMismatch(event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
