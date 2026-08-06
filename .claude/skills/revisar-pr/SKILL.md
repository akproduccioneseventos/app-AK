---
name: revisar-pr
description: Revisa una o varias propuestas de cambio abiertas antes de fusionarlas, y avisa cuáles son seguras y cuáles no. Usala cuando el dueño diga "tengo PR para fusionar", "revisá las propuestas", "¿puedo mergear?" o pida el estado de las propuestas abiertas. Nunca fusiona: sólo revisa y aconseja.
---

# Revisar propuestas antes de fusionar

El dueño no es programador y no puede evaluar un cambio mirando el código. Tu
trabajo es darle un veredicto claro por cada propuesta: **se puede fusionar, o no,
y por qué en criollo**.

**Fusionás vos** cuando la propuesta pasa los siete controles de abajo (el dueño
lo autorizó el 6 de agosto de 2026). Si falla aunque sea uno, **no se fusiona**:
se lo contás en criollo y la dejás abierta. Después de fusionar, corré `/sano`
sobre la versión principal.

## Cómo dirigir esta revisión

Delegá lo mecánico a los ayudantes económicos y quedate con el criterio. En
concreto: los agentes bajan diffs, cuentan, corren el revisor de tipos y esperan;
vos confirmás los hallazgos y decidís. Lanzá los agentes en paralelo y en segundo
plano cuando no dependan entre sí.

**Verificá antes de reportar.** Los agentes se equivocan seguido. Cualquier
hallazgo que vayas a contarle al dueño, confirmalo con tus propios ojos primero.

## Los siete controles, en este orden

1. **¿Sobre qué base está?** Compará contra la versión principal actual. Si la
   propuesta arrancó de una base vieja, decilo: lo que se probó no es lo que va a
   quedar al fusionar.

2. **¿El título coincide con lo que toca?** Una propuesta llamada "limpieza de tal
   pantalla" que modifica cuarenta archivos, incluidas facturas y cálculos, es una
   señal de alarma, no un detalle. Comparalo con la cantidad de archivos tocados.

3. **Acentos rotos.** Corré `npm run check:acentos` contra la rama. Es el control
   que más veces salvó al proyecto: una propuesta metió 902 acentos rotos de una
   sola vez. Además de verse mal en pantalla, rompe comparaciones en silencio: el
   código que buscaba la palabra "niño" dejó de encontrarla y los platos de chicos
   se contaban como adultos. **Con acentos rotos no se fusiona, punto.**

4. **¿Chocan entre sí?** Si hay varias propuestas abiertas, probá fusionarlas
   juntas, no de a una. Que no haya choque marcado no alcanza: dos propuestas
   pueden encajar sin protestar y dejar el resultado roto. Ya pasó con el archivo
   de facturas, que quedó protegido dos veces y dejaba la pantalla colgada al
   guardar.

5. **¿Compila y pasan las pruebas?** Delegá a un agente económico que arme copias
   temporales de trabajo, enlace las dependencias ya instaladas en vez de
   reinstalarlas, y corra el revisor de tipos en tres escenarios: cada propuesta
   sola y las dos fusionadas. Pedile los errores textuales con archivo y línea.

6. **¿Qué cambia para el usuario?** Por cada propuesta, decí en una frase qué va a
   ver distinto el cliente o el equipo en pantalla. Si algo se saca (un cartel que
   explicaba algo, un aviso, una restricción de acceso), avisalo: sacar cosas
   también es un cambio.

7. **¿Toca plata, permisos o datos?** Facturas, cobros, descuentos, presupuestos,
   quién puede ver qué. Eso se mira línea por línea y no se delega.

## Falsos positivos conocidos: no los reportes

Son decisiones tomadas del dueño, no errores:

- El ajuste anual del 15% va siempre.
- El descuento del 50% del Salón Club Uruguay y el del presupuesto son marketing.
- La lista de compras usa los invitados del presupuesto, no los confirmados.
- Las fotos del muro se bajan con el enlace directo, a propósito.
- Se trabaja sólo en pesos uruguayos.
- Los controles rojos de GitHub son por facturación: no se investigan. Lo que vale
  es lo que verificás localmente.

## Cómo entregar el veredicto

Una sección por propuesta, corta, sin tecnicismos, sin rutas de archivo salvo que
las pida. Para cada una:

- **Qué hace**, en dos líneas.
- **Se puede fusionar / no se puede / se puede pero ojo con esto.**
- Si no se puede: **qué le pasaría al usuario en pantalla** si se fusiona igual.
- Si hay orden recomendado entre varias, decilo.

Y al cerrar, actualizá `ESTADO-ACTUAL.md` con el estado en que quedaron.
