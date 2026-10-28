import React from 'react';
import { createRoot } from 'react-dom/client';
import DecoTemplateGallery from '@/components/decoracion/DecoTemplateGallery';
createRoot(document.getElementById('root')!).render(<main style={{ maxWidth: 1100, margin: 'auto', padding: 16 }}>
  <h1 className="mb-4 text-xl font-semibold">Decoraciones AK</h1>
  <DecoTemplateGallery currentElementos={[]} currentFondoColor="#f8f9fa" onApplyTemplate={template => {
    document.getElementById('applied')!.textContent = JSON.stringify(template);
  }} />
  <output id="applied" hidden />
</main>);
