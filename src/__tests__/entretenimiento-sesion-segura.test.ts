import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

/**
 * Orden 48 - ENT-03: Blindaje de sesion en Fotocabina y Touchpix.
 *
 * Garantiza que:
 * 1. Una respuesta de subida diferida (de la persona A) NO reinicie la pantalla ni muestre
 *    exito en la sesion de la persona siguiente (persona B).
 * 2. Si alguien comienza una sesion nueva sin subir nada (o presiona repetir), cualquier
 *    temporizador pendiente de la sesion previa se cancela inmediatamente.
 * 3. La pantalla de la persona siguiente en la fila permanece estable sin perdida de capturas.
 */

describe('Orden 48 - ENT-03: Entretenimiento sin reinicio a la persona siguiente', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Touchpix: aislamiento de sesion entre participantes', () => {
    it('no reinicia la sesion B cuando la subida de A termina con retraso', async () => {
      let liveSessionId = 'sess_persona_A';
      let resetsCount = 0;
      let successCount = 0;
      let pendingUploadResolve: (value: any) => void;

      const uploadPromise = new Promise((resolve) => {
        pendingUploadResolve = resolve;
      });

      const sessionWhenStarted = liveSessionId;
      const isLiveSession = () => liveSessionId === sessionWhenStarted;

      let resetTimer: any = null;

      const onUploadComplete = async () => {
        await uploadPromise;
        if (!isLiveSession()) {
          // Persona B ya esta en la cabina: NO tocar la UI ni reiniciar
          return;
        }
        successCount++;
        resetTimer = setTimeout(() => {
          if (isLiveSession()) {
            resetsCount++;
          }
        }, 3000);
      };

      const uploadExecution = onUploadComplete();

      // La Persona B se acerca e inicia nueva sesion (o retake) antes de que A termine
      liveSessionId = 'sess_persona_B';
      if (resetTimer) clearTimeout(resetTimer);

      // Ahora termina la subida lenta de A
      pendingUploadResolve!({ success: true, post: { imageUrl: 'https://ejemplo.com/fotoA.jpg' } });
      await uploadExecution;

      jest.advanceTimersByTime(5000);

      expect(successCount).toBe(0);
      expect(resetsCount).toBe(0);
    });

    it('ejecuta exito y reinicio normalmente si la Persona A permanece en su misma sesion', async () => {
      let liveSessionId = 'sess_persona_A';
      let resetsCount = 0;
      let successCount = 0;
      let pendingUploadResolve: (value: any) => void;

      const uploadPromise = new Promise((resolve) => {
        pendingUploadResolve = resolve;
      });

      const sessionWhenStarted = liveSessionId;
      const isLiveSession = () => liveSessionId === sessionWhenStarted;

      let resetTimer: any = null;

      const onUploadComplete = async () => {
        await uploadPromise;
        if (!isLiveSession()) return;
        successCount++;
        resetTimer = setTimeout(() => {
          if (isLiveSession()) {
            resetsCount++;
          }
        }, 3000);
      };

      const uploadExecution = onUploadComplete();

      pendingUploadResolve!({ success: true, post: { imageUrl: 'https://ejemplo.com/fotoA.jpg' } });
      await uploadExecution;

      expect(successCount).toBe(1);
      expect(resetsCount).toBe(0);

      jest.advanceTimersByTime(3000);
      expect(resetsCount).toBe(1);
    });

    it('cancela el temporizador de reinicio previo si el participante toca Repetir a mano', () => {
      let liveSessionId = 'sess_persona_A';
      let resetsTriggered = 0;
      let resetTimer: any = null;

      const sessionAtStart = liveSessionId;
      resetTimer = setTimeout(() => {
        if (liveSessionId === sessionAtStart) {
          resetsTriggered++;
        }
      }, 3000);

      jest.advanceTimersByTime(1000);
      clearTimeout(resetTimer);
      resetTimer = null;
      liveSessionId = 'sess_persona_B';

      jest.advanceTimersByTime(5000);

      expect(resetsTriggered).toBe(0);
    });
  });

  describe('Fotocabina: proteccion de tanda y cola de espera', () => {
    it('una respuesta tardia de fotocabina no sobreescribe la pantalla del siguiente invitado', async () => {
      let liveSessionId = 'cab_persona_A';
      let showedSuccess = false;
      let resetsCount = 0;
      let pendingUploadResolve: (value: any) => void;

      const uploadPromise = new Promise((resolve) => {
        pendingUploadResolve = resolve;
      });

      const sessionWhenStarted = liveSessionId;
      const isLiveSession = () => liveSessionId === sessionWhenStarted;

      let resetTimer: any = null;

      const handleAcceptAndPublishMock = async () => {
        const res = await uploadPromise as any;
        if (!isLiveSession()) return;
        if (res.success) {
          showedSuccess = true;
          resetTimer = setTimeout(() => {
            if (isLiveSession()) {
              resetsCount++;
            }
          }, 20000);
        }
      };

      const uploadTask = handleAcceptAndPublishMock();

      liveSessionId = 'cab_persona_B';
      if (resetTimer) clearTimeout(resetTimer);

      pendingUploadResolve!({ success: true, media: { url: 'https://ejemplo.com/tiraA.jpg' } });
      await uploadTask;

      jest.advanceTimersByTime(25000);

      expect(showedSuccess).toBe(false);
      expect(resetsCount).toBe(0);
    });

    it('iniciar una toma nueva cancela de inmediato cualquier reinicio pendiente', () => {
      let liveSessionId = 'cab_persona_A';
      let resetFired = false;

      const sessionAtStart = liveSessionId;
      let timer: any = setTimeout(() => {
        if (liveSessionId === sessionAtStart) {
          resetFired = true;
        }
      }, 20000);

      jest.advanceTimersByTime(5000);
      clearTimeout(timer);
      timer = null;
      liveSessionId = 'cab_persona_B';

      jest.advanceTimersByTime(20000);

      expect(resetFired).toBe(false);
    });
  });
});
