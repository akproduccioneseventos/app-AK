/**
 * Esto tiene que correr ANTES que la biblioteca 3D, y por eso vive en su propio
 * archivo.
 *
 * La biblioteca del salón en 3D busca una pieza interna de React
 * (`ReactCurrentBatchConfig`) **en el momento en que se carga**, no cuando se
 * dibuja. Si no la encuentra, revienta ahí mismo y el salón nunca aparece.
 *
 * El primer intento de arreglo puso el relleno dentro del archivo de la escena,
 * arriba de todo. **No sirvió, y el motivo es sutil:** las importaciones de un
 * archivo se ejecutan siempre primero, antes que cualquier línea suelta. Así que
 * la biblioteca se cargaba —y fallaba— antes de que el relleno llegara a correr.
 * Se comprobó abriendo la pantalla: seguía saliendo "no se pudo dibujar".
 *
 * Poniéndolo en un archivo aparte y trayéndolo **antes** que la biblioteca, el
 * orden queda garantizado.
 *
 * No pisa nada: sólo completa la pieza si falta.
 */
import React from 'react';

const internas = (React as unknown as Record<string, unknown>)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Record<string, unknown> | undefined;

if (internas && !internas.ReactCurrentBatchConfig) {
  internas.ReactCurrentBatchConfig = { transition: null };
}

export {};
