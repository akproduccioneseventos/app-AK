import { act } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { PwaInstallButton } from '@/components/pwa-install-button';

jest.mock('@/components/ui/button', () => {
  const React = require('react') as typeof import('react');
  function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props}>{children}</button>;
  }
  Button.displayName = 'MockButton';
  return { Button };
});

jest.mock('lucide-react', () => {
  const React = require('react') as typeof import('react');
  function icon(name: string) {
    const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg aria-hidden="true" data-icon={name} {...props} />;
    Icon.displayName = `Mock${name}`;
    return Icon;
  }
  return { CheckCircle2: icon('CheckCircle2'), Download: icon('Download'), MonitorSmartphone: icon('MonitorSmartphone') };
});

type InstallEvent = Event & {
  prompt: jest.Mock<Promise<void>>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function installEvent(choice = deferred<{ outcome: 'accepted' | 'dismissed'; platform: string }>(), prompt = jest.fn().mockResolvedValue(undefined)) {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as InstallEvent;
  event.prompt = prompt;
  event.userChoice = choice.promise;
  act(() => { window.dispatchEvent(event); });
  return { event, choice, prompt };
}

let container: HTMLDivElement;
let root: Root;
let matchMediaDescriptor: PropertyDescriptor | undefined;

function renderButton() {
  act(() => { flushSync(() => root.render(<PwaInstallButton />)); });
}

function button() {
  return container.querySelector('button') as HTMLButtonElement;
}

function clickButton() {
  act(() => { button().dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}

function clickElement(target: HTMLButtonElement) {
  act(() => { target.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}

function hasText(pattern: RegExp) {
  return [...container.querySelectorAll('*')].some(element => element.children.length === 0 && pattern.test(element.textContent ?? ''));
}

describe('PwaInstallButton: respuestas reales del navegador', () => {
  beforeEach(() => {
    matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: false, media: '(display-mode: standalone)', onchange: null, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false }),
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    if (matchMediaDescriptor) Object.defineProperty(window, 'matchMedia', matchMediaDescriptor);
    else Reflect.deleteProperty(window, 'matchMedia');
    jest.restoreAllMocks();
  });

  it('consume accepted sin afirmar instalada hasta appinstalled', async () => {
    renderButton();
    const { choice } = installEvent();
    clickButton();
    await act(async () => { choice.resolve({ outcome: 'accepted', platform: 'web' }); });
    expect(button()).toBeNull();
    expect(hasText(/ya esta instalada/i)).toBe(false);
  });

  it('consume dismissed sin afirmar instalada', async () => {
    renderButton();
    const { choice } = installEvent();
    clickButton();
    await act(async () => { choice.resolve({ outcome: 'dismissed', platform: 'web' }); });
    expect(button()).toBeNull();
    expect(hasText(/ya esta instalada/i)).toBe(false);
  });

  it('muestra rechazo y permite un nuevo evento deliberado', async () => {
    renderButton();
    const first = installEvent();
    first.prompt.mockRejectedValueOnce(new Error('prompt denied'));
    clickButton();
    await act(async () => { await Promise.resolve(); });
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(first.event.defaultPrevented).toBe(true);
    installEvent();
    expect(button()).toBeEnabled();
  });

  it('bloquea doble click sincronicamente y muestra estado pendiente', async () => {
    renderButton();
    const promptGate = deferred<void>();
    const { prompt } = installEvent(deferred(), jest.fn(() => promptGate.promise));
    const target = button();
    clickElement(target);
    clickElement(target);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="status"]')?.textContent).toMatch(/esperando respuesta/i);
    await act(async () => { promptGate.resolve(); });
  });

  it('conserva appinstalled ante dismiss concurrente', async () => {
    renderButton();
    const first = installEvent();
    clickButton();
    act(() => { window.dispatchEvent(new Event('appinstalled')); });
    expect(hasText(/ya esta instalada/i)).toBe(true);
    await act(async () => { first.choice.resolve({ outcome: 'dismissed', platform: 'web' }); });
    expect(hasText(/ya esta instalada/i)).toBe(true);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('ignora fallo tardio tras appinstalled', async () => {
    renderButton();
    const first = installEvent();
    clickButton();
    act(() => { window.dispatchEvent(new Event('appinstalled')); });
    expect(hasText(/ya esta instalada/i)).toBe(true);
    await act(async () => { first.choice.reject(new Error('late failure')); await Promise.resolve(); });
    expect(hasText(/ya esta instalada/i)).toBe(true);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('no deja que una respuesta vieja consuma un evento nuevo', async () => {
    renderButton();
    const old = installEvent();
    clickButton();
    const fresh = installEvent();
    await act(async () => { old.choice.resolve({ outcome: 'dismissed', platform: 'web' }); });
    expect(button()).toBeEnabled();
    clickButton();
    expect(fresh.prompt).toHaveBeenCalledTimes(1);
  });
});
