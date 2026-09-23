import * as React from 'react';

/**
 * Compatibilidad de React Three Fiber con React 19.
 *
 * React 19 renombró y reorganizó los campos internos que react-reconciler v0.29
 * busca en `React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`.
 * Este puente asegura que `ReactCurrentBatchConfig`, `ReactCurrentOwner` y
 * `ReactCurrentDispatcher` estén presentes para que Fiber no lance
 * `Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`.
 */
if (typeof window !== 'undefined') {
  try {
    const r = React as any;
    const internals =
      r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED ||
      r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
      {};

    if (!internals.ReactCurrentBatchConfig) {
      internals.ReactCurrentBatchConfig = { transition: null };
    }
    if (!internals.ReactCurrentOwner) {
      internals.ReactCurrentOwner = { current: null };
    }
    if (!internals.ReactCurrentDispatcher) {
      internals.ReactCurrentDispatcher = { current: null };
    }

    if (!r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
    }
    if (!r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
      r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = internals;
    }
  } catch {}
}

