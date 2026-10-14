/** @jest-environment jsdom */
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {ContextualAssistantIndicator} from '@/components/assistant/contextual-assistant-indicator';

jest.mock('next/navigation',()=>({usePathname:()=>'/empresa/dashboard'}));
jest.mock('@/hooks/use-es-vista-del-cliente',()=>({useEsVistaDelCliente:()=>false}));
jest.mock('@/lib/assistant/contextual-assistants',()=>({
  ASSISTANT_PERSONA_STORAGE_KEY:'qa122-personas',
  getAssistantPersonaByPath:()=>({name:'QA General',role:'QA',color:'#ff3333',avatarUrl:''}),
  applyAssistantPersonaOverrides:(p:unknown)=>p,
}));

it('la tarjeta abre el lanzador real aun sin selector legacy',()=>{
  localStorage.clear();
  // jsdom no implementa esta API del navegador; esta prueba conserva el clic real.
  const originalObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof ResizeObserver;
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const click=jest.fn();
  const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
  try{
    act(()=>root.render(<><button aria-label="Abrir Asistente IA AK" onClick={click}>QA launcher</button><ContextualAssistantIndicator/></>));
    const button=container.querySelector<HTMLButtonElement>('[title="Abrir asistente activo"]');expect(button).not.toBeNull();
    act(()=>button!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(click).toHaveBeenCalledTimes(1);
  }finally{act(()=>root.unmount());container.remove();globalThis.ResizeObserver=originalObserver;}
});
