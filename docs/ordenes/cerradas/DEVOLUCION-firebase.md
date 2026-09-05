# DEVOLUCIÓN — Las cuatro de Firebase: tres no las usa nadie

**Para Gemini. 1 de septiembre de 2026.**

**Lo de la plata está bien: las cuatro son gratis**, y la de achicar fotos además **ahorra**,
porque Firebase cobra por lo que se guarda. Eso queda.

**El problema es otro: tres de las cuatro no las llama nadie**, salvo tu propia prueba.

| Lo que dijiste | Lo verificado |
|---|---|
| Notificaciones al celular | **Enganchada.** La usa `src/app/actions/notifications.ts`. **Queda.** |
| Achicar las fotos pesadas | **Sólo la usa `firebase-enhancements.test.ts`.** Ningún invitado sube una foto por ahí |
| Medir la velocidad | **Sólo tu prueba.** No mide ninguna pantalla |
| Escudo antibots | **Sólo tu prueba.** No protege ningún formulario |
| App Check | **Nadie la llama.** Ni tu prueba |

**Tus controles dieron 374 suites y 2.362 pruebas en verde.** Y estaban en verde: **la prueba
probaba tu código aislado**, no que la app lo use. Es la forma exacta que tuvieron todas las
fallas de este año.

---

## Qué hacer, una por una

### 1. Achicar las fotos — es la que más plata ahorra

**Engancharla donde el invitado sube la foto**, que es el único lugar donde importa:

- `src/app/evento/social/[fiestaId]/page.tsx` — cuando sube al muro.
- `src/app/evento/video-vida/[fiestaId]/page.tsx` — las seis fotos del video de vida.
- Y donde el cliente suba fotos a su moodboard.

**La prueba tiene que comprobar el resultado**: que una foto de 10 megas **llegue achicada**, no
que la función exista.

### 2. Medir la velocidad

Se prende una vez, al arrancar la app en el navegador. Si no encontrás dónde, **el lugar es el
mismo que el del punto 4**.

### 3. Escudo antibots

**En los formularios públicos que hoy están abiertos**: el simulador de presupuesto y el pedido
de contacto. Son los que un robot puede saturar y **los que gastan cuota de inteligencia
artificial**.

### 4. App Check

Se llama **una vez, al arrancar la app en el navegador**. Sin la llave configurada devuelve nulo
y no hace nada: **eso está bien, no rompe nada**. Engancharla igual, para que el día que se
cargue la llave, funcione.

**OJO, y esto es serio:** **no actives la exigencia de App Check en la consola de Firebase.** Si
se activa mal, **la app deja de funcionar para todos**. Se engancha del lado del código y se
avisa; lo de la consola lo decide el dueño.

---

## Cómo se comprueba que esto está hecho

```comprobar
usa: image-optimizer en src/app/evento/social/[fiestaId]/page.tsx
usa: bot-shield en src/app/simulador-de-presupuesto/page.tsx
usa: initAppCheck en src/components/app-shell.tsx
```

**Mientras esas tres líneas den "falta", la entrega no está hecha**, aunque las pruebas den
verde.
