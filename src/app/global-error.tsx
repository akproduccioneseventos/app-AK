'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error fatal capturado por global-error:', error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif', margin: 0, padding: 0, backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
          <div style={{ maxWidth: '480px', width: '100%', backgroundColor: 'white', borderRadius: '24px', padding: '48px 32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,.15)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
              Error Crítico
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
              Ocurrió un error grave en la aplicación. No te preocupes, tus datos están seguros en los archivos JSON.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{ padding: '12px 24px', backgroundColor: 'hsl(262.1, 83.3%, 57.8%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                🔄 Reintentar
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{ padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                🏠 Volver al Inicio
              </button>
            </div>
            {error.message && (
              <p style={{ marginTop: '24px', fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', wordBreak: 'break-all' }}>
                {error.message}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
