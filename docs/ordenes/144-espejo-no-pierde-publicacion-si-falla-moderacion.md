# Orden144 - Una foto guardada no es una foto publicada

Codex audita; Gemini corrige entretenimiento. Claude revisa que se conserve la
moderacion y compila. No fusionar automaticamente ni abrir otra implementacion
si este consumidor ya cambio en una entrega no subida.

## Contraste y evidencia

10/10/2026. Ejecutado main8521548477d90cc2ffa05e9f2edb22c6c51a893b.
Contraste remoto9a054620718673f00e10b52f0811cc1af729ba4e: archivos/simbolos
de este caso SIN delta; ninguna PR abierta al consultar. Trabajo local de otras
IA: NO CONTRASTADO CON LA TANDA; contrastar antes de programar.

ENT93-MOD P1: espejo foto con permiso de estacion de invitado, sin sesion de
equipo. Camara ficticia real640x480; servidor/Firestore/Storage reales demo.
Vision devuelve API_KEY_INVALID con clave dummy: fallo de proveedor controlado,
NO prueba de credenciales de produccion. La foto se descarga correctamente,
uploadEntretenimientoMedia devuelve success:true, media.syncStatus:pendiente,
SIN socialPostId, y hay CERO social_gallery_posts de esa fiesta.

Se reproduce dos veces. Raw93-espejo-diagnostico.json y adjunto
93-salidas/espejo-fiesta-y-respuestas.json conservan respuesta y media guardada.
La pantalla pasa al final y el consumidor dice Foto enviada al muro aunque ese
paso no se hizo. No confundir un archivo en Storage con publicacion.

## Causa comprobada en consumidores reales

- src/app/actions/fiesta/entretenimiento.actions.ts, uploadEntretenimientoMedia:
  seguridad.reason:error -> revisionManual:true; guarda media aun cuando falla
  createSocialMediaPostFromUrlForStation; descarta socialPostResult.error.
- src/app/actions/social-gallery.ts, persistSocialMediaPostFromUrl:
  imageAiSafe: input.revisionManual === false convierte desconocido en false.
- src/lib/social-fiesta/content-review.ts, reviewSocialContent: false implica
  blocked/adult_content_risk, no pending_review. Se retorna antes de guardar post.
- src/app/evento/espejo-magico/[fiestaId]/page.tsx, handleUpload: basta success
  para finalizar/anunciar subida, sin comprobar syncStatus/socialPostId.

## Correccion exigida

1. Separar seguro, riesgoso y NO revisado. Caida de Vision NO significa seguro
   ni contenido adulto. Guardar pendiente de aprobacion manual, nunca aprobado.
   Riesgo real o texto bloqueado deben seguir rechazados.
2. Propagar el resultado del mural. Foto guardada/publicacion pendiente/error
   deben distinguirse en respuesta y pantalla; no anunciar envio si no hay post.
3. Reintento estable de la MISMA captura: una media y un post. No duplicar ni
   volver a pagar/procesar una captura ya guardada; conservar anterior si falla.
4. Comprobar el lector del mural: pendiente NO aparece en pantalla publica;
   moderador autoriza y recarga ve un solo post. No retirar permisos ni moderacion.

## Aceptacion pendiente tras correccion

Reutilizar93-pendientes-anteriores.spec.ts con copia en el TEMP aislado. Este
caso es una prueba negativa ejecutada, NO aprobacion de la entrega futura.
Agregar control de Vision caido, rechazo real, reintento concurrente y consumidor
moderado. La prueba propuesta de abajo aun NO existe ni se ejecuto.

```comprobar
archivo: src/app/actions/social-gallery.ts
usa: createSocialMediaPostFromUrlForStation en src/app/actions/fiesta/entretenimiento.actions.ts
prueba: tests/e2e/espejo-moderacion-caida-y-reintento.spec.ts
prueba: src/__tests__/la-foto-sin-revisar-queda-pendiente-no-rechazada.test.ts
prueba: src/__tests__/espejo-guardada-no-es-publicada.test.ts
usa: imageAiSafeDesde en src/app/actions/social-gallery.ts
```
