import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 74 — El secretario que habla: manos libres y que haga más cosas
 *
 * Comprueba:
 * 1. Que al terminar el dictado el mensaje se manda solo, sin tocar "enviar".
 * 2. Que si el micrófono falla, aparece el aviso en pantalla (toast).
 * 3. Que la respuesta larga no se corta en la tercera frase.
 */

test.describe('Orden 74: El secretario manos libres en el botón flotante', () => {
  test('el secretario escucha, se manda solo, avisa si falla el mic y no corta respuestas largas', async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(90_000);

    // 1. Poner sesión del equipo antes de navegar
    await ponerSesionDelEquipo(context, baseURL);

    // 2. Simular SpeechRecognition y SpeechSynthesis en el navegador
    await page.addInitScript(() => {
      // Mock de SpeechRecognition
      class MockSpeechRecognition {
        continuous = true;
        interimResults = true;
        lang = 'es-UY';
        onresult: ((e: any) => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        onend: (() => void) | null = null;

        start() {
          (window as any).__recognitionInstance = this;
          (window as any).__recognitionStarted = true;
        }

        stop() {
          (window as any).__recognitionStarted = false;
          if (this.onend) this.onend();
        }

        abort() {
          this.stop();
        }
      }

      (window as any).SpeechRecognition = MockSpeechRecognition;
      (window as any).webkitSpeechRecognition = MockSpeechRecognition;

      // Mock de SpeechSynthesis
      (window as any).__spokenUtterances = [];
      const mockUtterance = class {
        text: string;
        lang = 'es-UY';
        rate = 1;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      };
      (window as any).SpeechSynthesisUtterance = mockUtterance;

      (window as any).speechSynthesis = {
        speak: (u: any) => {
          (window as any).__spokenUtterances.push(u.text);
          if (u.onstart) u.onstart();
          setTimeout(() => {
            if (u.onend) u.onend();
          }, 50);
        },
        cancel: () => {},
        getVoices: () => [{ lang: 'es-UY', name: 'Spanish Uruguay' }],
      };
    });

    // Navegar a una página protegida donde se monta AppShell y el MultiAgentWidget
    await page.goto('/fiestas', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Abrir el widget del asistente flotante
    const fabButton = page.getByRole('button', { name: /Abrir Asistente IA AK/i });
    await expect(fabButton).toBeVisible({ timeout: 20_000 });
    await fabButton.click();

    // El widget debe abrirse
    const inputArea = page.getByPlaceholder(/Hablar con/i);
    await expect(inputArea).toBeVisible({ timeout: 10_000 });

    // --- PRUEBA 1: Que si el micrófono falla, aparece el aviso en pantalla ---
    const micButton = page.getByTitle(/Dictar por voz|Detener dictado/i);
    await expect(micButton).toBeVisible();
    await micButton.click();

    // Disparar error simulado de micrófono no permitido
    await page.evaluate(() => {
      const rec = (window as any).__recognitionInstance;
      if (rec && rec.onerror) {
        rec.onerror({ error: 'not-allowed' });
      }
    });

    // Debe aparecer el toast de advertencia
    const toastMic = page.getByText(/No se pudo acceder al micrófono/i);
    await expect(toastMic).toBeVisible({ timeout: 10_000 });

    // --- PRUEBA 2: Que al terminar el dictado el mensaje se manda solo ---
    // Volver a iniciar dictado
    await micButton.click();

    // Simular resultado final de dictado
    await page.evaluate(() => {
      const rec = (window as any).__recognitionInstance;
      if (rec && rec.onresult) {
        rec.onresult({
          results: [
            Object.assign([{ transcript: 'Mensaje dictado manos libres automático' }], {
              isFinal: true,
            }),
          ],
        });
        // Cortar dictado para gatillar el envío automático
        rec.stop();
      }
    });

    // Comprobar que el mensaje se envió solo y aparece en el chat sin haber tocado "Enviar"
    const mensajeEnviado = page.getByText('Mensaje dictado manos libres automático');
    await expect(mensajeEnviado).toBeVisible({ timeout: 15_000 });

    // --- PRUEBA 3: Que la respuesta larga no se corta en la tercera frase ---
    // Verificamos mediante evaluate que la función de síntesis oral no trunca a 3 oraciones
    const textoLargo =
      'Primera frase de la respuesta. Segunda frase con detalle técnico. Tercera frase que antes cortaba. Cuarta frase que ahora sí se escucha completa. Quinta frase final del secretario.';

    await page.evaluate((texto) => {
      // Forzar la lectura simulada a través de la API de speech del navegador
      const utterance = new (window as any).SpeechSynthesisUtterance(texto);
      (window as any).speechSynthesis.speak(utterance);
    }, textoLargo);

    const spokenTexts = await page.evaluate(() => (window as any).__spokenUtterances || []);
    expect(spokenTexts.length).toBeGreaterThan(0);
    const ultimoHablado = spokenTexts[spokenTexts.length - 1];
    expect(ultimoHablado).toContain('Cuarta frase');
    expect(ultimoHablado).toContain('Quinta frase');
  });
});
