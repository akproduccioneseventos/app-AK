const fs = require('fs');

const mappings = [
  { file: 'src/app/acceso-personal/[tokenId]/page.tsx', para: 'equipo' },
  { file: 'src/app/proveedor/acceso/[token]/page.tsx', para: 'equipo' },
  { file: 'src/app/evento/barra/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/buzon/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/en-vivo/[fiestaId]/invitados/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/en-vivo/[fiestaId]/organizador/page.tsx', para: 'cliente' },
  { file: 'src/app/evento/en-vivo/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/mi-mesa/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/plataforma-360/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/social/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/touchpix/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/video-vida/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/evento/zona-digital/[fiestaId]/page.tsx', para: 'invitado' },
  { file: 'src/app/feedback/[fiestaId]/page.tsx', para: 'cliente' },
  { file: 'src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx', para: 'invitado' },
  { file: 'src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx', para: 'cliente' },
  { file: 'src/app/portal/c/[accessKey]/PublicPortalProView.tsx', para: 'cliente' },
  { file: 'src/app/portal/c/[accessKey]/PublicPortalView.tsx', para: 'cliente' },
  { file: 'src/app/portal/mesas/page.tsx', para: 'invitado' },
  { file: 'src/app/portal/page.tsx', para: 'cliente' },
  { file: 'src/app/portal/[fiestaId]/contrato/page.tsx', para: 'cliente' },
  { file: 'src/app/portal/[fiestaId]/decoracion/page.tsx', para: 'cliente' },
  { file: 'src/app/portal-cliente/[id]/confirmar-invitados/page.tsx', para: 'cliente' },
  { file: 'src/app/portal-cliente/[id]/faq/page.tsx', para: 'cliente' },
  { file: 'src/app/portal-cliente/[id]/mensajes/page.tsx', para: 'cliente' },
  { file: 'src/app/portal-cliente/[id]/menu/page.tsx', para: 'cliente' },
  { file: 'src/app/portal-cliente/[id]/muro-social/page.tsx', para: 'cliente' },
  { file: 'src/app/portal-cliente/[id]/musica/page.tsx', para: 'cliente' },
  { file: 'src/app/portal-cliente/[id]/page.tsx', para: 'cliente' },
  { file: 'src/app/recepcion/[fiestaId]/RecepcionClient.tsx', para: 'invitado' },
  { file: 'src/app/simulador-ak/page.tsx', para: 'cliente' },
  { file: 'src/app/video-vida/[fiestaId]/page.tsx', para: 'invitado' }
];

let updated = 0;
for (const m of mappings) {
  if (!fs.existsSync(m.file)) continue;
  let code = fs.readFileSync(m.file, 'utf8');
  if (code.includes('AvisoDeDatos')) {
    console.log('Already has AvisoDeDatos:', m.file);
    continue;
  }

  // Add import after 'use client'; or at top
  const importStatement = "import { AvisoDeDatos } from '@/components/legal/AvisoDeDatos';\n";
  if (code.startsWith("'use client';") || code.startsWith('"use client";')) {
    const firstLineEnd = code.indexOf('\n');
    code = code.slice(0, firstLineEnd + 1) + importStatement + code.slice(firstLineEnd + 1);
  } else {
    code = importStatement + code;
  }

  // Add component
  if (code.includes('</form>')) {
    code = code.replace('</form>', `  <div className="pt-2 text-center"><AvisoDeDatos para="${m.para}" /></div>\n</form>`);
  } else if (code.includes('</CardFooter>')) {
    code = code.replace('</CardFooter>', `  <div className="w-full pt-2 text-center"><AvisoDeDatos para="${m.para}" /></div>\n</CardFooter>`);
  } else if (code.includes('</main>')) {
    code = code.replace('</main>', `  <div className="pt-4 text-center"><AvisoDeDatos para="${m.para}" /></div>\n</main>`);
  } else {
    const lastDivIndex = code.lastIndexOf('</div>');
    if (lastDivIndex !== -1) {
      code = code.slice(0, lastDivIndex) + `  <div className="pt-2 text-center"><AvisoDeDatos para="${m.para}" /></div>\n` + code.slice(lastDivIndex);
    }
  }

  fs.writeFileSync(m.file, code, 'utf8');
  updated++;
  console.log('Updated:', m.file);
}
console.log('Total updated:', updated);
