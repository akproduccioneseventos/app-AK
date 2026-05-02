export type ImportedBudgetService = {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  categoria?: string;
  servicioCatalogoId?: string;
  coincidenciaCatalogo?: 'exacta' | 'probable' | 'sin_coincidencia';
  requiereRevision?: boolean;
  notaRevision?: string;
};

const DIALOGUE_STARTERS = [
  'aqui',
  'aca',
  'claro',
  'por supuesto',
  'entendido',
  'perfecto',
  'voy a',
  'te paso',
  'te dejo',
  'a continuacion',
  'como asistente',
  'puedo ayudarte',
];

const NON_SERVICE_KEYWORDS = [
  'total',
  'subtotal',
  'descuento',
  'saldo',
  'sena',
  'iva',
  'cliente',
  'fecha',
  'evento',
  'presupuesto',
  'cotizacion',
  'observacion',
];

export function normalizeAssistantText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function isLikelyDialogueInsteadOfService(value: unknown): boolean {
  const raw = String(value ?? '').trim();
  if (!raw) return true;
  const normalized = normalizeAssistantText(raw);

  if (raw.length > 80) return true;
  if ((raw.match(/[.!?]/g) || []).length >= 2) return true;
  if (DIALOGUE_STARTERS.some(starter => normalized.startsWith(starter))) return true;
  if (/\b(te|le|les|nos)\s+(puedo|voy|dejo|paso|genero|creo)\b/i.test(raw)) return true;
  if (/\b(presupuesto|cliente|evento)\s+(listo|creado|generado)\b/i.test(raw)) return true;

  return false;
}

export function isNonServiceBudgetLine(value: unknown): boolean {
  const normalized = normalizeAssistantText(value);
  if (!normalized) return true;
  return NON_SERVICE_KEYWORDS.some(keyword => normalized === keyword || normalized.startsWith(`${keyword}:`) || normalized.startsWith(`${keyword} `));
}

export function sanitizeImportedBudgetServices(rawServices: unknown[]): ImportedBudgetService[] {
  return rawServices
    .map((item: any) => {
      const nombre = String(item?.nombre ?? item?.name ?? item?.descripcion ?? '').trim();
      const cantidad = Math.max(1, Number(item?.cantidad ?? item?.quantity ?? 1) || 1);
      const precioUnitario = Number(item?.precioUnitario ?? item?.precio ?? item?.unitPrice ?? item?.monto ?? 0) || 0;
      const categoria = String(item?.categoria ?? item?.category ?? 'Servicios importados').trim();
      const servicioCatalogoId = item?.servicioCatalogoId ?? item?.serviceId;
      const coincidenciaCatalogo = item?.coincidenciaCatalogo ?? item?.catalogMatch ?? (servicioCatalogoId ? 'probable' : 'sin_coincidencia');
      const requiereRevision = Boolean(item?.requiereRevision ?? !servicioCatalogoId);
      const notaRevision = item?.notaRevision ?? (requiereRevision ? 'Servicio importado desde archivo; revisar coincidencia con catalogo.' : undefined);

      return {
        nombre,
        cantidad,
        precioUnitario,
        categoria,
        servicioCatalogoId,
        coincidenciaCatalogo,
        requiereRevision,
        notaRevision,
      } as ImportedBudgetService;
    })
    .filter(service => service.nombre.length > 0)
    .filter(service => service.precioUnitario > 0)
    .filter(service => !isLikelyDialogueInsteadOfService(service.nombre))
    .filter(service => !isNonServiceBudgetLine(service.nombre));
}

export function buildOperativeBudgetExtractionPrompt(): string {
  return `
## MOTOR OPERATIVO PARA IMPORTAR PRESUPUESTOS DESDE IMAGEN/PDF
Cuando el operador adjunte una imagen o PDF con presupuesto, cotizacion, lista de servicios o captura con precios, el asistente operativo debe crear un presupuesto real usando action.type = import_budget_from_image.

### Reglas obligatorias
1. Nunca metas frases conversacionales dentro de servicios.
   Incorrecto: {"nombre":"Aqui te dejo el presupuesto creado para Maria..."}
   Correcto: {"nombre":"Discoteca","cantidad":1,"precioUnitario":18000,"categoria":"Servicios importados"}

2. action.data.servicios debe ser siempre un array de objetos limpios:
   [{"nombre":"...","cantidad":1,"precioUnitario":12345,"categoria":"...","servicioCatalogoId":"...","coincidenciaCatalogo":"exacta|probable|sin_coincidencia","requiereRevision":false}]

3. Usa el catalogo real que aparece en CONTEXTO -> SERVICIOS DE EMPRESA.
   - Si el nombre del archivo coincide claramente con un servicio del catalogo, copia el nombre del catalogo y agrega servicioCatalogoId.
   - Si parece parecido pero no seguro, usa coincidenciaCatalogo = "probable" y requiereRevision = true.
   - Si no coincide, dejalo como "sin_coincidencia", categoria "Servicios importados" y requiereRevision = true.

4. No inventes servicios que no esten escritos o visibles en el archivo.
5. No uses totales, descuentos, senas, saldos, datos de cliente ni observaciones como servicios.
6. Si el archivo tiene solo una foto decorativa o no hay precios, no crees presupuesto: usa action.type = none o navigate a Presupuestos y explica que dato falta.
7. Si hay total final pero no items individuales, crea un solo item "Servicio integral importado" con requiereRevision = true y notaRevision.
8. Si el cliente, fecha o invitados no aparece, no inventes: deja el campo vacio o undefined, pero igual crea el presupuesto si hay servicios y precios.
9. Si hay formato uruguayo de dinero, interpreta 5.000 como 5000 y 67.660,50 como 67660.5.
10. La respuesta textual debe ser corta. El backend es quien confirma si quedo guardado.
`;
}
