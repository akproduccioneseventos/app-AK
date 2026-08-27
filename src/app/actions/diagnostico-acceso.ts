'use server';

import { dbAdmin } from '@/lib/firebase/server';
import { hasPrivateSessionSecret } from '@/lib/auth/session-token';

/**
 * Por que existe esto.
 *
 * **El dueno no podia entrar a su app y no habia forma de saber por que.** La pantalla
 * decia "Contrasena incorrecta" o "Error al iniciar sesion", que no distinguen entre
 * cuatro problemas completamente distintos: la base caida, la llave de firma sin
 * configurar, ninguna cuenta creada, o efectivamente una clave equivocada. Cada uno se
 * resuelve de una manera diferente y ninguno se parece al otro.
 *
 * Averiguarlo requeria que alguien leyera registros del servidor. El dueno no es
 * programador: pedirle eso es pedirle que haga de tecnico, y **la app tiene que
 * averiguarlo sola**.
 *
 * Esto corre solo cuando un intento de entrada falla, comprueba las cuatro cosas en orden
 * y devuelve **una frase en criollo diciendo cual de las cuatro fue**.
 *
 * **Que NO devuelve, nunca:** ningun valor de configuracion, ninguna clave, ningun correo
 * de nadie. Solo si cada pieza esta o no esta. Se muestra en una pantalla publica —
 * cualquiera que abra la direccion de entrada la ve— asi que dice que esta roto, jamas con
 * que se arregla por dentro.
 */
export interface DiagnosticoAcceso {
  /** Que esta pasando, en una frase que se entienda sin saber de computadoras. */
  causa: string;
  /** El proximo paso concreto para quien esta mirando la pantalla. */
  queHacer: string;
  /** Para las pruebas y el registro. No se muestra. */
  codigo: 'sin-base' | 'base-caida' | 'sin-llave-de-sesion' | 'sin-cuentas' | 'credenciales';
}

const TOPE_MS = 6000;

async function laBaseContesta(): Promise<boolean> {
  if (!dbAdmin) return false;
  let reloj: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      dbAdmin.collection('app-settings').limit(1).get(),
      new Promise<never>((_, rechazar) => {
        reloj = setTimeout(() => rechazar(new Error('tarde')), TOPE_MS);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (reloj) clearTimeout(reloj);
  }
}

async function hayAlgunaCuenta(): Promise<boolean> {
  if (!dbAdmin) return false;
  try {
    const snap = await dbAdmin.collection('users').limit(1).get();
    return !snap.empty;
  } catch {
    // Si no se puede leer, no se afirma que no hay cuentas: eso seria inventar.
    return true;
  }
}

export async function diagnosticarAcceso(): Promise<DiagnosticoAcceso> {
  if (!dbAdmin) {
    return {
      codigo: 'sin-base',
      causa: 'La app no esta conectada a la base de datos.',
      queHacer: 'No es tu clave. Hay que revisar la conexion con Firebase: hasta que eso se arregle, nadie puede entrar.',
    };
  }

  if (!(await laBaseContesta())) {
    return {
      codigo: 'base-caida',
      causa: 'La base de datos no esta respondiendo.',
      queHacer: 'No es tu clave. Suele ser pasajero: esperá un par de minutos y volvé a intentar. Si sigue igual, el problema esta en Firebase.',
    };
  }

  // La base anda. Si falta la llave que firma la sesion, la clave se comprueba bien
  // y aun asi no se puede entrar: la app no logra dejar la puerta abierta.
  if (process.env.NODE_ENV === 'production' && !hasPrivateSessionSecret()) {
    return {
      codigo: 'sin-llave-de-sesion',
      causa: 'Falta configurar la llave que mantiene la sesion abierta.',
      queHacer: 'No es tu clave: aunque la escribas bien, la app no puede dejarte adentro. Hay que cargar esa configuracion en el servidor.',
    };
  }

  if (!(await hayAlgunaCuenta())) {
    return {
      codigo: 'sin-cuentas',
      causa: 'Todavia no hay ninguna cuenta creada en la app.',
      queHacer: 'No es tu clave: no existe ningun usuario para entrar. Hay que crear el primero.',
    };
  }

  return {
    codigo: 'credenciales',
    causa: 'La base responde bien y hay cuentas cargadas.',
    queHacer: 'Entonces el correo o la clave no coinciden. Tocá "Olvidé mi contraseña" para recuperarla, o entrá con Google.',
  };
}
