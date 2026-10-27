# Orden251 - Claude: coherencia contractual y revision legal diferenciada

27/10/2026. Codex revisa/documenta; Claude conserva dinero, condiciones, permisos,
validacion/compilacion y fusion. No alterar contratos ya firmados ni reglas del dueno.
Una causa de copia reproducida; riesgos legales aparte, NO sentencias de invalidez.

Fuente0abe9199ddb7281a945fd0f000a1a89f25b8fa8e. Cincofuentes identicas enClaude
89a263b1df4d8fd7d2217a684daf54cafaa0ad83 yPR1368-0929; ver738-contraste-contratos.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Contrastar HEAD antes de actuar.
No repetir243saldo5vs30dias ni247/249/250 ni reabrir216/219 ya cerradas por alcance.

## L1 / P2 - AK-CODEX-737-FAQ-AJUSTE-SALDO

src/data/preguntas-frecuentes-contrato.ts: respuesta sobre evento el ano siguiente
promete15% sobre lo que falte. CONTRACT_TEMPLATE clausula2 y motor vigente ajustan
el presupuesto base, y luego restan los pagos confirmados.
Sonda737: base100000/firma2026/evento2027/pagado50000 ->motor115000total/65000saldo;
lo que diceFAQ se interpreta como57500saldo, diferencia7500. Control sinajustePASS.
3criterios2PASS1FAIL, sin navegar/cobrar datos reales. Formula SIcoincide con base
contractual; NO es orden para cambiar el motor ni ajustar solo el saldo.

Corregir respuesta y comprobar sus consumidores (portal cliente y FAQ), con
ejemplo sencillo y sin prometer que adelantar pagos evita el ajuste cuando no es
la regla aprobada. Si se desea cambiar la politica, pedir decision expresa; no
modificar contratos guardados/firmados ni migrar condiciones de clientes existentes.

## Revision legal - propuestas sujetas a asesoramiento, NO cambios automaticos

- Contratacion a distancia: el contrato base revisado no desarrolla el derecho
  de retracto por canal. Revisar aplicabilidad de Ley17250art16 a la modalidad real
  de venta deAK. A27/10/2026 la norma consultada contempla5dias habiles; no asumir
  que toda cancelacion lleva30% si se ejerce un derecho legal aplicable.
- Ley20531art108 modifica el regimen (10dias corridos y acceso destacado de
  arrepentimiento). Art2 fija vigencia general1/1/2027. Preparar transicion, no
  imponer retroactivamente la regla nueva ni reutilizar plazos sin fecha/canal.
- Clausulas4,7,10y13: abogado debe contrastar penalidades, reembolsos, remedios
  ante incumplimiento y exclusiones con Ley17250arts31/33. No declarar nulo todo
  contrato por esta auditoria ni borrar condiciones aprobadas automaticamente.
- Imagen: opcionAUTORIZO/NOAUTORIZO de clausula12 es positiva, pero no presupone
  representacion de cada invitado/menor. Revisar titular/representante, finalidad,
  prueba y retiro segun Ley18331art9. No publicar material por un checkbox global
  sin una base aplicable; NO se demostro uso indebido de una foto concreta.
- Firma: conservar huella/texto visto/constancia y papel obligatorio por decision
  operativa deldueno. No decir que una constancia es firma avanzada acreditada,
  ni que toda firma electronica carece de validez: Ley18600distingue sus efectos.
- Comprobantes: no presentar un PDFinterno comoCFE aprobado. No se comprobo
  habilitacionDGI ni emisionfiscal en esta tanda. Si se integraCFE, definir alcance
  segun regimen tributario con contador; no inventar IVA, tasas ni otra moneda.

Fuentes oficiales y vigencia en738-legal-contratos-dictamen.md. La aprobacion
juridica y decisiones comerciales no se sustituyen por tests de palabras.
No registrar al cliente como contrario a sus derechos ni esconder condiciones
materiales hasta despues de firma/pago. Cambios del texto ya firmado van poradenda.

## Evidencia y entrega

736:13suites70PASS/exit0 sobrefuente0abe; cubren texto,marcadores,fecha,hora,
papel/constancia,permisos,firma concurrente/huella y controles de privacidad.
NO es dictamen juridico, SDKnuevo/HTTP/PDF/identidad autenticada real acreditada.
7372PASS1FAIL es L1; no cambiar aserciones para ocultarlo. Corregir copia, mantener
formula, fechar revision y registrarSHA/evidencia. Claude valida/fusiona, Codexno.
La prueba de cierre siguiente es PROPUESTA/PENDIENTE, no ejecutada.

```comprobar
archivo: src/data/preguntas-frecuentes-contrato.ts
usa: PREGUNTAS_FRECUENTES_DEL_CONTRATO en src/app/portal-cliente/[id]/page.tsx
prueba: src/__tests__/faq-ajuste-anual-coincide-con-contrato.test.ts
```
