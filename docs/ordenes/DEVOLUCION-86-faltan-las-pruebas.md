# Devolución — Orden 86: faltan las pruebas

**Para Gemini. Seguí en la MISMA rama (`feat/orden-85-86-duenio-septiembre`) y la misma
propuesta, la 1225.** Primero traé lo que subió Claude: `git pull`. Claude ya corrigió tres cosas
de plata en tu entrega; **no las deshagas**:

- `mandarAlContador` ahora recibe el **período** (`{ from, to }`), no los números.
- `proponerEquipoParaFiesta` conserva lo ya asignado.
- `checkGoogleMailStatus` pide sesión.

**Qué falta.** La puerta frena en el paso "Lo que se dijo es lo que es". Lo nuevo no tiene ninguna
prueba que lo mire. Hay que agregar:

1. **Pruebas de navegador**, en `tests/e2e/`, con la sesión del equipo, que es
   `ponerSesionDelEquipo` de `tests/e2e/helpers/fiesta-de-prueba.ts`:
   - **`/contabilidad/crm/outbox`:** un mensaje con `targetEmail` muestra el botón "Enviar por
     mail". Sin Google conectado, al tocarlo aparece "Conectá Google en Ajustes".
   - **`/empresa/resenas-google`:** sin acceso a Google, la pantalla dice en criollo que no hay
     acceso, y **no** muestra un botón "Publicar respuesta" activo.
   - **`/settings/company`:** el campo "Mail del contador" se escribe, se guarda, y al recargar
     sigue ahí.
2. **Pruebas de Jest que nombren las acciones:**
   - **`src/app/actions/fiesta/proponer-equipo.actions.ts`:** sin sesión del equipo no devuelve
     nada. Con sesión, devuelve la propuesta y conserva lo que ya estaba asignado.
   - **`src/app/actions/google-business-resenas.ts`:**
     - sin sesión, no llama a Google;
     - sin credenciales, devuelve `errorCriollo`;
     - `publicarRespuestaResenaAction` llama a `replyToGoogleBusinessReview` una sola vez.
   - **`src/app/actions/touchpix-ai.ts`:** `THEME_DEFINITIONS.caricatura` existe, y su pedido a
     la inteligencia artificial dice que **no** es burlona.
3. **Las dos pruebas de navegador que pedía la orden y no vinieron:**
   - **B1:** abrir la invitación del invitado, preguntarle al asistente "¿a qué hora es?" y ver la
     hora de la fiesta en pantalla.
   - **B7:** con una constancia de firma y sin contrato en papel, la pantalla del equipo muestra
     "Falta el contrato firmado en papel", y no hay ningún botón que confirme la reserva.

**Cada prueba se rompe a propósito antes de entregar** y tiene que ponerse en rojo. Leé
`docs/ANTES-DE-ENTREGAR.md`. **No toques** `src/app/actions/reportes.ts`,
`src/lib/contabilidad/*` ni `src/lib/personal/proponer-equipo.ts`: son de Claude.

```comprobar
usa: proponer-equipo.actions en src/__tests__/proponer-equipo-sin-solapamiento.test.ts
prueba: tests/e2e/orden-86-pantallas.spec.ts
```
