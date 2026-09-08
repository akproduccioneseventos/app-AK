# Devolución — la rama de acceso administrativo NO se puede fusionar

**Revisada el 5 de septiembre de 2026 sobre `fix/acceso-administrativo`.** El problema no es
cómo está escrito: es lo que deja abierto.

---

## 1. Cualquiera podría entrar al panel como administrador

En `src/lib/auth/session-token.ts`, cuando no hay una llave de firma configurada, ahora se
**deriva una** de este orden:

```
FIREBASE_PRIVATE_KEY  ||  APP_PASSWORD  ||  NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

**El tercero es público por diseño.** Todo lo que empieza con `NEXT_PUBLIC_` viaja al navegador
de cualquiera que abra el sitio —de hecho se usa en `src/lib/firebase/config.ts:23`, que es el
código que corre en el navegador del visitante—.

Con ese valor a la vista, cualquiera calcula la misma llave, **se firma su propia sesión de
administrador y entra a todo**: presupuestos, clientes, cobros, la lista entera. Sin contraseña
y sin dejar rastro de un intento fallido, porque para la app es una sesión legítima.

**Y no hace falta que las otras dos variables falten**: alcanza con que en el servidor donde
corre la app estén vacías o mal escritas para caer en la tercera.

## 2. La app dejó de fallar cuando falta la seguridad

Antes, en producción, sin llave configurada **la app se negaba a arrancar la firma y avisaba**.
Ahora nunca falla: siempre inventa algo. **Un error visible se convirtió en un agujero
silencioso.** Es peor que el problema que venía a resolver.

## 3. Una puerta de emergencia con contraseña maestra

En `src/app/actions/auth.ts` se agrega una entrada con una contraseña maestra
(`APP_PASSWORD`) que, además de dejar entrar, **crea un usuario administrador en la base** si no
existe, y funciona *"incluso si la base no contesta"*.

Eso es un segundo camino de entrada al panel que no pasa por los usuarios ni por sus permisos. Si
esa contraseña se filtra o es corta, se entra igual. Y como crea el usuario sola, después queda
adentro para siempre.

---

## Lo que sí hay que hacer

**Entiendo el motivo** —que el dueño no se quede afuera de su propio panel— y es un problema real.
Pero se arregla configurando bien una vez, no dejando una puerta.

1. **Volver a fallar cuando falta la llave, en producción.** Es correcto: sin llave no se pueden
   firmar sesiones de forma segura.
2. **Derivar SÓLO de un valor que sea secreto de verdad** (la clave privada del servidor). **Nunca
   de un `NEXT_PUBLIC_*`**, que es público por definición.
3. **Sacar la puerta de emergencia con contraseña maestra.** Si hace falta recuperar el acceso, se
   hace desde el servidor, una vez, y no queda un camino abierto.
4. **Lo que sí conviene conservar de esta rama:** el aviso claro en pantalla cuando el acceso
   falla, para que se entienda qué configurar en vez de quedar mirando una pantalla que no deja
   entrar.

---

## Cómo se comprueba

```comprobar
usa: throw new Error en src/lib/auth/session-token.ts
prueba: src/__tests__/session-token.test.ts
```

Y la prueba tiene que comprobar **lo que no debe pasar**: que con la llave sin configurar y sólo
los valores públicos disponibles, **la firma no se genera**. Una prueba que sólo comprueba que
"se genera una llave" daría verde con el agujero puesto.
