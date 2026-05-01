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

function addInternalDefaultLinkWarning() {
  if (document.getElementById('portal-cliente-default-link-warning')) return;

  const bodyText = document.body.innerText || '';
  const hasDefaultClientLink = bodyText.includes('CLIENTE1') || bodyText.includes('/portal/c/CLIENTE1');
  if (!hasDefaultClientLink) return;

  const header = findPortalHeader();
  if (!header) return;

  const warning = document.createElement('section');
  warning.id = 'portal-cliente-default-link-warning';
  warning.className = 'rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-1';
  warning.innerHTML = `
    <p class="font-black">Atención: este portal sigue usando el link de prueba CLIENTE1.</p>
    <p>Antes de enviarlo al cliente, cambiá el link personalizado por un nombre real del evento. Ejemplo: <strong>cliente-vip-rocio-15</strong>.</p>
  `;

  header.insertAdjacentElement('afterend', warning);
}

function addPublicUnconfiguredWarning() {
  if (document.getElementById('portal-cliente-unconfigured-warning')) return;

  const bodyText = document.body.innerText || '';
  const isUnconfigured =
    bodyText.includes('Evento sin configurar') ||
    bodyText.includes('Lugar a confirmar') ||
    bodyText.includes('/portal/c/CLIENTE1') ||
    window.location.pathname.toLowerCase().includes('/portal/c/cliente1');

  if (!isUnconfigured) return;

  const heroTitle = Array.from(document.querySelectorAll('h1')).find(h =>
    (h.textContent ?? '').includes('Evento sin configurar')
  );
  const heroContainer = heroTitle?.closest('div.relative') ?? document.querySelector('main') ?? document.body;

  const warning = document.createElement('section');
  warning.id = 'portal-cliente-unconfigured-warning';
  warning.className = 'mx-auto max-w-3xl px-4 -mt-5 mb-4 relative z-30';
  warning.innerHTML = `
    <div class="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-xl text-amber-900 space-y-2">
      <p class="text-base font-black">Portal sin datos reales todavía</p>
      <p class="text-sm leading-relaxed">Este link está funcionando, pero el evento todavía no tiene configurados los datos reales del cliente, fecha, lugar, presupuesto o contrato. No conviene enviarlo al cliente hasta completar esos datos desde Planificador.</p>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="rounded-2xl bg-white/70 border border-amber-100 p-2"><strong>1.</strong> Cambiar CLIENTE1 por link personalizado.</div>
        <div class="rounded-2xl bg-white/70 border border-amber-100 p-2"><strong>2.</strong> Cargar nombre real del evento.</div>
        <div class="rounded-2xl bg-white/70 border border-amber-100 p-2"><strong>3.</strong> Vincular presupuesto/contrato.</div>
        <div class="rounded-2xl bg-white/70 border border-amber-100 p-2"><strong>4.</strong> Revisar pagos y tareas.</div>
      </div>
    </div>
  `;

  heroContainer.insertAdjacentElement('afterend', warning);
}

function correctFalsePublicProcessStates() {
  const bodyText = document.body.innerText || '';
  const isUnconfigured =
    bodyText.includes('Evento sin configurar') ||
    window.location.pathname.toLowerCase().includes('/portal/c/cliente1');

  if (!isUnconfigured) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const node of nodes) {
    let value = node.nodeValue ?? '';
    let changed = false;

    const replacements: Array<[string, string]> = [
      ['Pago completado ✓', 'Pago sin configurar'],
      ['Pago completado', 'Pago sin configurar'],
      ['Contrato pendiente de firma', 'Contrato sin configurar'],
      ['Sin confirmaciones aún', 'Invitados sin configurar'],
      ['PAGADO', 'PAGO'],
    ];

    for (const [from, to] of replacements) {
      if (value.includes(from)) {
        value = value.replaceAll(from, to);
        changed = true;
      }
    }

    if (changed) node.nodeValue = value;
  }
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
      if (mode === 'admin') {
        addInternalOverview();
        addInternalDefaultLinkWarning();
      }
      if (mode === 'public') {
        addPublicQuickGuide();
        addPublicUnconfiguredWarning();
        correctFalsePublicProcessStates();
      }
    };

    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [mode]);

  return null;
}
