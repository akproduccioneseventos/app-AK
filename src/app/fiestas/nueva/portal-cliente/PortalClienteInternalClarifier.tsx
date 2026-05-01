'use client';

import { useEffect } from 'react';

const TEXT_REPLACEMENTS: Array<[string, string]> = [
  ['Configuración del Portal', 'Acceso del cliente'],
  ['Controla qué información puede ver y editar tu cliente en su portal privado.', 'Configurá el acceso, link personalizado y módulos visibles del Portal Cliente VIP.'],
  ['Contraseña de Acceso del Cliente', 'Link personalizado del portal'],
  ['Contraseña del portal copiada al portapapeles', 'Link del portal copiado al portapapeles'],
  ['Este valor actúa como contraseña de acceso. El enlace oficial para compartir con el cliente está abajo.', 'Este valor forma parte del enlace privado del portal. El enlace oficial para compartir con el cliente está abajo.'],
  ['Usá un enlace legible (ej: cliente-vip-nombre-evento) o generá uno sugerido con el botón 🔄.', 'Personalizá el link del portal con un nombre claro. Ejemplo: cliente-vip-rocio-15. También podés generar uno sugerido con el botón 🔄.'],
  ['Personalización de la Portada', 'Portada del portal'],
  ['Lo que debe traer el cliente', 'Tareas pendientes y bebidas del cliente'],
  ['Lo que tengo que enviar o llevar', 'Tareas pendientes del cliente'],
  ['Comida y bebidas — configuración de ítems', 'Comida, bebidas y extras'],
  ['Guardar Bebidas y Extras', 'Guardar comida, bebidas y extras'],
  ['Notas Compartidas', 'Mensajes con AK'],
  ['FAQ', 'Preguntas frecuentes'],
  ['Panel Financiero', 'Pagos y documentos'],
  ['Pagos y saldo', 'Pagos y documentos'],
  ['Bebidas y extras', 'Comida y bebidas'],
];

function replaceTextNodes(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();

  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const node of nodes) {
    let value = node.nodeValue ?? '';
    let changed = false;

    for (const [from, to] of TEXT_REPLACEMENTS) {
      if (value.includes(from)) {
        value = value.replaceAll(from, to);
        changed = true;
      }
    }

    if (changed) node.nodeValue = value;
  }
}

function addInternalGuide() {
  if (document.getElementById('portal-cliente-internal-guide')) return;

  const title = Array.from(document.querySelectorAll('h1')).find(h => h.textContent?.includes('Portal del Cliente'));
  const header = title?.closest('div.flex.items-center.justify-between');
  if (!header) return;

  const guide = document.createElement('section');
  guide.id = 'portal-cliente-internal-guide';
  guide.className = 'rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground space-y-3';
  guide.innerHTML = `
    <div class="space-y-1">
      <p class="text-base font-bold text-foreground">Orden recomendado del Portal Cliente VIP</p>
      <p>Este panel interno configura lo que después ve el cliente en su link privado. Primero revisá acceso y portada; después tareas, mensajes, pagos y organización.</p>
    </div>
    <div class="grid gap-2 sm:grid-cols-2">
      <div class="rounded-xl bg-background/70 border p-3"><strong class="text-foreground">1. Acceso del cliente</strong><br/>Link personalizado, copiar enlace y WhatsApp.</div>
      <div class="rounded-xl bg-background/70 border p-3"><strong class="text-foreground">2. Portada</strong><br/>Imagen, color, nombre visible y mensajes.</div>
      <div class="rounded-xl bg-background/70 border p-3"><strong class="text-foreground">3. Pendientes y mensajes</strong><br/>Tareas del cliente y mensajes con AK siempre a mano.</div>
      <div class="rounded-xl bg-background/70 border p-3"><strong class="text-foreground">4. Pagos y documentos</strong><br/>Datos bancarios, comprobantes, contrato y presupuesto.</div>
    </div>
  `;

  header.insertAdjacentElement('afterend', guide);
}

export default function PortalClienteInternalClarifier() {
  useEffect(() => {
    const apply = () => {
      replaceTextNodes(document.body);
      addInternalGuide();
    };

    apply();

    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
