'use client';

import { useEffect } from 'react';
import { CLIENT_PORTAL_VIP_AREAS, CLIENT_PORTAL_VIP_REPLACEMENTS } from '@/lib/client-portal-vip-ux';

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

    for (const [from, to] of CLIENT_PORTAL_VIP_REPLACEMENTS) {
      if (value.includes(from)) {
        value = value.replaceAll(from, to);
        changed = true;
      }
    }

    if (changed) node.nodeValue = value;
  }
}

function findPortalHeader() {
  const candidates = Array.from(document.querySelectorAll('h1, h2')).filter(el => {
    const text = el.textContent ?? '';
    return text.includes('Portal del Cliente') || text.includes('Portal Cliente') || text.includes('Portal VIP');
  });

  return candidates[0]?.closest('div.flex.items-center.justify-between') ?? candidates[0]?.parentElement ?? null;
}

function addInternalOverview() {
  if (document.getElementById('portal-cliente-vip-overview')) return;

  const header = findPortalHeader();
  if (!header) return;

  const section = document.createElement('section');
  section.id = 'portal-cliente-vip-overview';
  section.className = 'rounded-3xl border border-primary/20 bg-primary/5 p-4 sm:p-5 text-sm text-muted-foreground space-y-4 shadow-sm';

  const cards = CLIENT_PORTAL_VIP_AREAS.map((area, idx) => `
    <div class="rounded-2xl bg-background/80 border border-border p-3">
      <p class="text-xs font-black uppercase tracking-wide text-primary">${idx + 1}. ${area.title}</p>
      <p class="mt-1 text-xs leading-relaxed">${area.description}</p>
    </div>
  `).join('');

  section.innerHTML = `
    <div class="space-y-1">
      <p class="text-lg font-black text-foreground">Portal Cliente VIP — estructura correcta</p>
      <p>Este panel configura el portal privado que ve el cliente. La vista pública debe respetar estos mismos nombres y secciones.</p>
    </div>
    <div class="grid gap-2 sm:grid-cols-2">
      ${cards}
    </div>
    <div class="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      Pagos, seña y saldo van siempre en <strong>Pagos y documentos</strong>. No deben quedar dentro de tareas o “lo que debe llevar”.
    </div>
  `;

  header.insertAdjacentElement('afterend', section);
}

function addPublicQuickGuide() {
  if (document.getElementById('portal-cliente-public-guide')) return;

  const main = document.querySelector('main') ?? document.body;
  const firstSection = main.querySelector('section, div');
  if (!firstSection) return;

  const guide = document.createElement('section');
  guide.id = 'portal-cliente-public-guide';
  guide.className = 'mx-auto max-w-3xl px-4 -mt-3 mb-4 relative z-20';
  guide.innerHTML = `
    <div class="rounded-3xl bg-white border border-slate-100 shadow-lg p-4 space-y-3">
      <p class="text-sm font-black text-slate-900">Tu portal VIP</p>
      <div class="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div class="rounded-2xl bg-slate-50 p-3"><strong>Próximos pasos</strong><br/>Tareas pendientes y mensajes.</div>
        <div class="rounded-2xl bg-slate-50 p-3"><strong>Pagos</strong><br/>Saldo, comprobantes y documentos.</div>
        <div class="rounded-2xl bg-slate-50 p-3"><strong>Evento</strong><br/>Organización, menú, fotos e invitados.</div>
        <div class="rounded-2xl bg-slate-50 p-3"><strong>Ayuda</strong><br/>Preguntas frecuentes y contacto.</div>
      </div>
    </div>
  `;

  firstSection.insertAdjacentElement('afterend', guide);
}

export default function ClientPortalVipUxLayer({ mode }: { mode: 'admin' | 'public' }) {
  useEffect(() => {
    const apply = () => {
      replaceTextNodes(document.body);
      if (mode === 'admin') addInternalOverview();
      if (mode === 'public') addPublicQuickGuide();
    };

    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [mode]);

  return null;
}
