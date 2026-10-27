# Orden239 - Usar los datos del dialogo antes de crear propuestas

ID: **AK-CODEX-704-DIALOGO-PROPUESTAS**. Para Gemini; Claude valida/compila junto
con las otras correcciones. No fusionar documentacion sola.

Fuente reproducida main `c0add57f6237f666db97e7e902ef75f6c8d97479`.
Pagina y accion identicas en Claude publicado0c355975. Cambios privados posteriores
NO CONTRASTADOS: comprobar nuevoHEAD antes de programar.

## Defecto unico

`handleCrearTresPropuestas` cambia nombre/fecha/salon solo en estado React y llama
inmediatamente a `crearTresPropuestasDeWeb` con ID/color. La accion lee datos viejos.
Autoguardado2000ms no garantiza que la generacion use lo que el dueno escribio.
Sonda704:3FAIL de campos,2PASS de color/control. Ver informe705 y JSON704.

## Correccion y aceptacion

- Generacion debe recibir los valores actuales validados, o esperar su persistencia
  confirmada antes de leer. No basta llamar saveNow inmediatamente despues de un
  setState si ese guardado aun captura valores viejos.
- No mandar/reemplazar toda la fiesta desde el navegador para solucionar tres datos;
  conservar permisos de fiesta, cuentas bancarias, configuraciones ajenas y fechas
  civiles. No introducir cambios comerciales ni tocar contabilidad.
- Generar no publica la invitacion: conservar propuestas/eleccion explicita del cliente.
- Probar nombre/fecha/salon nuevos distintos de la base; color actual; control sin
  cambios; fallo de guardado no debe anunciar propuestas basadas en datos no aplicados.
- Agregar caso de interfaz real que escriba y pulse Crear sin esperar2segundos.
  Esa validacion renderizada esta PENDIENTE, no se declara ejecutada por esta sonda.
- Preservar historial y documentar SHA/resultado en YA/ESTADO. No reabrir otros cierres.

Las rutas/simbolos existen en la fuente comprobada. El bloque no sustituye pruebas:

```comprobar
archivo: src/app/actions/fiesta/armar-web-con-ia.actions.ts
usa: crearTresPropuestasDeWeb en src/app/(app)/fiestas/nueva/pagina-web/page.tsx
prueba: docs/evidencias/704-propuestas-datos-dialogo.cjs
```
