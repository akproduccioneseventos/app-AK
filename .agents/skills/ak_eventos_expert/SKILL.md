# Habilidad Experta: Desarrollo y Diseño para AK Producciones

Esta guía de habilidades define las directrices obligatorias de diseño, desarrollo de software y lógica de negocio para la aplicación central de **AK Producciones Eventos** (Salto, Uruguay). Debe ser leída y aplicada en cada iteración del código.

---

## 1. Directrices de Diseño y Experiencia de Usuario (UI/UX)

* **Paleta de Colores Corporativa:** Exclusivamente Indigo/Slate de nivel Premium. Está prohibido el uso de la paleta roja conflictiva anterior.
* **Prohibido el uso de `!important`:** No se deben inyectar estilos CSS con `!important` que rompan la cascada y la responsividad de Radix UI / Tailwind.
* **Optimización de Media (LCP):** Está prohibido el uso de etiquetas de imagen nativas `<img>` para renderizar contenido del catálogo o de decoración. Se debe utilizar siempre el componente `<Image />` de `next/image` con tamaños (`sizes`) optimizados para dispositivos móviles (los clientes en Salto acceden mayoritariamente desde celulares).
* **Tono Local y Lenguaje:** El lenguaje debe ser directo, uruguayo, humano y profesional.
  * Usar siempre **"comida"**, nunca "catering".
  * Usar siempre **"discoteca"**, nunca "DJ".
  * Resaltar el **Club Uruguay Salto** como salón preferencial integrado con servicio completo.

---

## 2. Reglas del Motor Financiero y Operativo

* **Duración de Eventos:** Lógica simplificada:
  * Menos de 4 horas: Fiesta chica / Habilita máximo 1 entrada de comida.
  * 4 horas o más: Fiesta grande / Habilita máximo 2 entradas de comida.
* **Cálculo de Invitados por Categoría:**
  * Comida infantil/menores: Suma estricta de Niños + Adolescentes.
  * Platos adultos: Suma estricta de Adultos.
  * Servicios generales (Salón, Luces, Pantallas, Discoteca): Suma de Adultos + Niños + Adolescentes.
* **Cálculo de Ajuste Inflacionario Anual (Fórmula Continua):**
  * Prohibido calcular la diferencia en años enteros simples (`event.getFullYear() - created.getFullYear()`).
  * Debe calcularse de forma fraccionaria continua basada en la diferencia real de días entre la fecha de creación y el evento:
    ```typescript
    const timeDiff = event.getTime() - created.getTime();
    const yearsDiff = Math.max(0, timeDiff / (1000 * 60 * 60 * 24 * 365.25));
    ```
* **Validación de Pagos y Guardrails:**
  * Prohibido registrar pagos por montos mayores al saldo restante del presupuesto.
  * Los pagos pendientes o rechazados no deben sumarse a los ingresos confirmados del negocio.
  * Validar siempre contra `validatePaymentAgainstBudget()` en `financial-guardrails.ts`.

---

## 3. Arquitectura del Backend y Base de Datos

* **Escritura Dual Resistente a Fallos:**
  * Firestore es el origen de la verdad.
  * En Server Actions, si falla la comunicación de red con Firestore, el flujo no debe colapsar la experiencia del usuario final; debe registrar un warning y utilizar la colección genérica de respaldo (`json_documents`).
  * **Regla de Sincronización y Despliegue en Firebase:** Cada vez que hagas una PR nueva y antes de su confirmación, es obligatorio verificar rigurosamente que los cambios no introduzcan errores de compilación y que se pueda lanzar sin fallas en Firebase App Hosting. Cualquier llamada a `writeData`, `syncToFirestore` o funciones de persistencia debe tener manejo de errores (`try/catch` o `.catch()`) para que los fallos no afecten la usabilidad.
* **Seguridad de Sesiones:**
  * Respetar los parámetros de cifrado `scrypt` con sal (salt) y verificación contra ataques de tiempo en `simple-auth.ts`.
  * Mantener el bloqueo preventivo (`LOCKOUT_MS`) de 15 minutos tras 5 intentos fallidos de login o recuperación.

## 4. Estilo de Comunicación con el Cliente

* **Absoluta Concreción e Integridad:** Hablar siempre de forma clara, directa y concreta. Sin divagar, alucinar ni inventar datos.
* **Transparencia Total:** Si algo no está listo, tiene errores o no se puede lograr, se debe reportar explícitamente y con honestidad al cliente.
* **Sin Código en el Chat:** Está terminantemente prohibido incluir bloques de código de programación en la conversación del chat. Toda la lógica y cambios técnicos deben quedar guardados en los archivos del proyecto y explicados funcionalmente.
* **Foco en el Negocio y la Estética:** Mantener siempre el criterio de experto en estética premium (indigo/slate, transiciones fluidas, responsividad móvil) y en las necesidades reales del negocio de eventos.

---
*(Habilidad Experta cargada y activa en el sistema).*
