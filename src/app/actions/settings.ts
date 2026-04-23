
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { BudgetDisplaySettings, InvoiceTemplateSettings, CompanyInfo, WhatsAppSettings, WhatsAppTemplates, ContractSettings, ContractTemplateItem, ContractType } from '@/types/settings';
import { defaultBudgetDisplaySettings, defaultInvoiceTemplateSettings, defaultCompanyInfo, defaultWhatsAppSettings, defaultWhatsAppTemplates, defaultContractSettings } from '@/types/settings';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const BUDGET_SETTINGS_FILE = 'budget-display-settings.json';
const INVOICE_SETTINGS_FILE = 'invoice-template-settings.json';
const COMPANY_INFO_FILE = 'company-info.json';
const CONTRACT_TEMPLATE_FILE = 'contract-template.json';
const CONTRACT_TEMPLATES_FILE = 'contract-templates.json';
const WHATSAPP_SETTINGS_FILE = 'whatsapp-settings.json';
const WHATSAPP_TEMPLATES_FILE = 'whatsapp-templates.json';
const CONTRACT_SETTINGS_FILE = 'contract-settings.json';

const defaultContractTemplate = `CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTOS



En la ciudad de Salto, República Oriental del Uruguay, a los {{FECHA_HOY}}, comparecen por una parte AK PRODUCCIONES EVENTOS, RUT 220372680019, Nº de Empresa 0000008898364, representada en este acto por el Tec. Alexander Knuth, C.I. 4.617.350-8, con domicilio en Gaboto 3390, Salto, Uruguay, en adelante "LA EMPRESA"; y por otra parte {{CLIENTE_NOMBRE}}, C.I. {{CLIENTE_CI}}, con domicilio en {{CLIENTE_DIRECCION}}, teléfono {{CLIENTE_TELEFONO}}, en adelante "LA CLIENTE". Ambas partes acuerdan celebrar el presente contrato, sujeto a las siguientes cláusulas: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CLÁUSULA 1 – OBJETO DEL CONTRATO: LA EMPRESA brindará a LA CLIENTE el servicio integral para la organización y realización del evento contratado, cuya fecha es el {{EVENTO_FECHA}}, con una duración máxima de siete (7) horas desde el inicio del evento. Toda hora extra tendrá un costo de $5.000 (pesos uruguayos cinco mil) por cada hora o fracción. El evento se realizará en salón a convenir, cuyo costo será asumido exclusivamente por LA CLIENTE. Los servicios incluidos serán únicamente los que figuren en el presupuesto firmado por ambas partes. Todo servicio que no figure allí se considerará adicional y deberá abonarse por separado. - - - - - - -

CLÁUSULA 2 – PRESUPUESTO VIGENTE Y AJUSTE ANUAL: a) El presupuesto vigente será el presupuesto original firmado, más cualquier cambio, agregado, reducción o adenda firmada por ambas partes y, cuando corresponda, más el ajuste anual previsto en esta cláusula. b) Sobre ese monto se calcularán saldos, multas, reintegros, pagos mínimos y cualquier otro importe previsto en este contrato. c) El ajuste anual del quince por ciento (15%) se aplicará únicamente cuando el evento sea en un año posterior al de la firma del contrato. d) Si corresponde, el ajuste se aplicará cada 1° de enero y será acumulativo y progresivo, o sea, cada nuevo ajuste se calculará sobre el monto ya ajustado del año anterior. e) Si el evento se realiza dentro del mismo año de la firma no se aplicará el aumento anual. - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CLÁUSULA 3 – PLAN DE PAGOS, PAGO MÍNIMO E INCUMPLIMIENTO: a) LA CLIENTE entregará una seña de {{SENIA}} al firmar este contrato. Esa seña forma parte del precio total del evento y, si hay cancelación, también se tomará como parte de la multa que corresponda. b) LA CLIENTE deberá completar como mínimo el treinta por ciento (30%) del presupuesto vigente dentro del plazo de doce (12) meses desde la firma del contrato. c) El resto podrá abonarse en pagos parciales, pero el total del presupuesto deberá quedar pago como mínimo treinta (30) días corridos antes del evento. d) Desde la firma del contrato y hasta la fecha del evento, en cada período de tres (3) meses LA CLIENTE deberá abonar como mínimo un total de $5.000 (pesos uruguayos cinco mil), ya sea en un solo pago o en varios pagos dentro de ese mismo período. e) Si en un período de tres meses no se alcanza ese mínimo de $5.000, o si no se completa el 30% dentro del plazo pactado, LA EMPRESA podrá intimar a LA CLIENTE para que regularice la situación dentro de quince (15) días corridos. f) Si LA CLIENTE no regulariza dentro de ese plazo, LA EMPRESA podrá dar por terminado el contrato por incumplimiento, cancelar el evento y aplicar la multa correspondiente. - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CLÁUSULA 4 – CAMBIO DE FECHA Y CANCELACIÓN: a) Si LA CLIENTE quiere cambiar la fecha del evento, deberá avisar con al menos treinta (30) días corridos de anticipación. El cambio dependerá de la disponibilidad de LA EMPRESA. b) Cada cambio de fecha tendrá una multa equivalente al diez por ciento (10%) del presupuesto vigente, que deberá abonarse al confirmar la nueva fecha. c) Si la nueva fecha pasa a otro año, además se aplicará el ajuste anual que corresponda. d) Si no hay disponibilidad o no se respeta el plazo mínimo de aviso, se aplicarán las reglas de cancelación. e) Si LA CLIENTE cancela total o parcialmente el evento, o elimina servicios ya contratados a ese año, deberá pagar una multa equivalente al treinta por ciento (30%) del presupuesto vigente ajustado al momento de la cancelación. f) Si la cancelación es total, la multa se calcula sobre el total del presupuesto ajustado a ese año. Si es parcial, sobre el valor ajustado a ese año de los servicios que se eliminan o reducen. g) La seña entregada se tomará como parte de esa multa. h) Si LA CLIENTE ya hubiera pagado más de lo que corresponde por multa, se devolverá solo la diferencia, si correspondiera. i) Si LA CLIENTE no paga esa multa, LA EMPRESA podrá intimar por medio fehaciente y darle un plazo de quince (15) días corridos para regularizar. Si no cumple, LA EMPRESA podrá iniciar las acciones legales correspondientes. - - - -

CLÁUSULA 5 – LISTA FINAL DE INVITADOS, AUMENTO O DISMINUCIÓN DE INVITADOS, MENÚS Y AJUSTES: a) Entrega de la lista final: LA CLIENTE deberá entregar a LA EMPRESA la lista final de invitados con una anticipación mínima de siete (7) días corridos al evento. En esa lista deberán incluirse todas las personas que asistirán, sin excepción, incluyendo a la persona homenajeada, familiares, acompañantes y participantes. También deberá indicarse claramente cuántos invitados corresponden a cada tipo de menú contratado, incluyendo, cuando corresponda, menú adulto y menú de adolescente y niños. Si LA CLIENTE no entrega esta lista dentro del plazo indicado, LA EMPRESA podrá tomar como válidas las cantidades y categorías informadas previamente o las que figuren en el presupuesto. LA EMPRESA podrá verificar que la lista coincida con la cantidad de invitados contratada. b) Aumento o disminución de invitados y ajustes: LA CLIENTE podrá reducir hasta un diez por ciento (10%) del total de invitados contratados, siempre que lo comunique dentro del plazo indicado en el literal anterior. En ese caso, el ajuste se hará solo sobre los importes que correspondan a servicios por persona, no correspondiendo devolución por costos fijos, personal, estructura, logística, reservas ni gastos ya comprometidos. Asimismo, LA CLIENTE podrá aumentar hasta un treinta por ciento (30%) del total de invitados contratados, sujeto a disponibilidad de LA EMPRESA, debiendo comunicarlo con una anticipación mínima de quince (15) días corridos y abonar previamente la diferencia correspondiente. Si cambia la cantidad de invitados según el tipo de menú, el presupuesto se ajustará de acuerdo con el valor de cada menú establecido en el presupuesto firmado ajustado. Si aumentara la cantidad de invitados en una categoría de mayor valor, LA CLIENTE deberá pagar la diferencia antes del evento. Si el cambio final hiciera que correspondan más invitados en una categoría de menor valor, LA EMPRESA devolverá o descontará la diferencia que corresponda. En ningún caso podrán compensarse automáticamente invitados de una categoría con otra distinta sin el correspondiente ajuste económico, ya que cada tipo de menú tiene un costo propio e independiente. Si el día del evento faltaran invitados por inasistencia o por cualquier otra razón ajena a LA EMPRESA, no corresponderá devolución de dinero por esos faltantes y el costo se mantendrá según el presupuesto vigente. Si hubiera más invitados que los contratados, o más personas de una categoría de menú que las informadas, LA CLIENTE deberá abonar la diferencia correspondiente antes del evento. Si dicho pago no se realizara, LA EMPRESA podrá limitar la prestación a la cantidad efectivamente contratada o suspender los servicios no cubiertos por falta de pago, sin que ello genere responsabilidad para LA EMPRESA. c) Personal o servicios externos contratados por LA CLIENTE: Si LA CLIENTE contrata por su cuenta personal o servicios externos ajenos a LA EMPRESA, como por ejemplo fotógrafo, show, músicos u otros similares, deberá avisar con anticipación. La comida, bebida o atención de esas personas no estará incluida dentro del servicio contratado con LA EMPRESA. Si LA CLIENTE quiere que LA EMPRESA les brinde comida o menú o alguna servicio a esas personas, deberá solicitarlo antes del evento para que se agregue al presupuesto y se abone la diferencia correspondiente. - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CLÁUSULA 6 – CONTRATO PERSONAL, PAGOS DE TERCEROS Y RECIBOS: a) Este contrato es personal e intransferible. No se puede pasar a nombre de otra persona, total ni parcialmente. b) La única responsable frente a LA EMPRESA será siempre la persona que firma este contrato, aunque otra persona ayude a organizar, pagar o decidir cosas del evento. Separaciones, conflictos familiares u otras situaciones personales no cambian esa responsabilidad. c) LA EMPRESA podrá recibir pagos hechos por terceros, pero eso no cambia quién es la responsable del contrato. d) Todos los recibos y comprobantes se emitirán a nombre de LA CLIENTE, por ser la persona firmante y responsable. e) LA EMPRESA no será responsable por préstamos, acuerdos o problemas económicos entre LA CLIENTE y las personas que colaboren con el pago. f) LA EMPRESA solo tomará como válidas las indicaciones, autorizaciones, pedidos de cambio o reclamos hechos directamente por LA CLIENTE, salvo autorización escrita de su parte. - -

CLÁUSULA 7 – MENORES, ADOLESCENTES, DAÑOS Y RESPONSABILIDAD: a) LA EMPRESA no tendrá funciones de cuidado, control, guarda ni vigilancia de menores de edad o adolescentes que asistan al evento. Esa responsabilidad será exclusivamente de LA CLIENTE, de sus padres, madres, tutores, responsables legales o de los adultos designados por ellos. b) Por eso, LA EMPRESA no será responsable por accidentes, salidas del lugar, conductas, conflictos, daños o cualquier otra situación relacionada con menores y adolescentes. c) También será responsabilidad de LA CLIENTE cualquier daño causado por ella, sus invitados o terceros vinculados al evento a instalaciones, mobiliario, decoración, vajilla, sonido, iluminación, barra, utilería u otros elementos provistos por LA EMPRESA. d) Ese daño deberá pagarse dentro de quince (15) días corridos desde que sea notificado. e) LA EMPRESA tampoco será responsable por pérdidas, hurtos, conflictos entre asistentes, problemas del local, cortes de servicios, fenómenos climáticos u otras situaciones fuera de su control directo. - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CLÁUSULA 8 – ELEMENTOS PROVISTOS: Todos los elementos usados para decoración, discoteca, barra, catering, iluminación, mobiliario, vajilla, mantelería, estructuras, utilería y demás servicios contratados pertenecen a LA EMPRESA o a quienes ella disponga para prestar el servicio. Ni LA CLIENTE ni sus invitados podrán retirarlos, quedárselos o retenerlos. Al finalizar el evento, solo se entregarán a LA CLIENTE los sobrantes de comida del catering, la porción correspondiente de torta o postres, y la bebida alcohólica y no alcohólica comprada por LA CLIENTE, siempre que sea posible según las condiciones del servicio. - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CLÁUSULA 9 – USO DE IMAGEN: LA CLIENTE autoriza a LA EMPRESA a usar fotos y videos del evento con fines promocionales y publicitarios, en redes sociales, sitio web y otros medios. Si no autoriza ese uso, deberá comunicarlo por escrito antes del evento. - - - - - - - - - - - - -

CLÁUSULA 10 – FUERZA MAYOR O CASO FORTUITO: a) Solo se considerarán casos de fuerza mayor o caso fortuito aquellos hechos extraordinarios, imprevisibles o inevitables, ajenos a la voluntad de las partes, que hagan imposible de verdad la realización del evento y que además puedan ser probados. b) Se incluyen, entre otros casos similares, desastres naturales, incendios, inundaciones, fenómenos climáticos graves, medidas de autoridad que impidan el evento, disturbios graves, el fallecimiento de LA CLIENTE o de la persona homenajeada o del titular de la empresa, o una enfermedad grave de cualquiera de ellas, siempre que se demuestre con la documentación correspondiente. c) No se considerarán fuerza mayor problemas económicos, malestares pasajeros, enfermedades leves, conflictos familiares, separaciones, arrepentimientos, cambios de opinión, falta de organización o falta de pago. d) Si lo que se invoca no se prueba, se aplicarán normalmente las reglas de cambio de fecha, cancelación y demás cláusulas del contrato. e) Si la situación realmente configura fuerza mayor y permite reprogramar, las partes procurarán acordar una nueva fecha, manteniéndose la vigencia económica del contrato con los ajustes que correspondan. - - - - - - - - - -

CLÁUSULA 11 – AGADU: Todos los pagos, permisos, declaraciones y trámites vinculados a AGADU serán responsabilidad exclusiva de LA CLIENTE. LA EMPRESA no será responsable por multas, recargos o sanciones relacionadas con ese tema. - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CLÁUSULA 12 – PRESUPUESTO FIRMADO Y MODIFICACIONES: El presupuesto firmado por ambas partes forma parte de este contrato. Cualquier cambio, agregado, reducción o modificación de servicios deberá hacerse por escrito y con firma de ambas partes. No serán válidos los cambios hechos solo de palabra o por mensajes informales. Toda modificación económica deberá quedar documentada y pasará a formar parte del presupuesto vigente. - - - - - - - - - - - - - - - - - - -

CLÁUSULA 13 – NOTIFICACIONES Y DOMICILIOS: Para este contrato, serán válidos los domicilios indicados al comienzo y el número de teléfono denunciado por LA CLIENTE. Toda notificación o intimación podrá hacerse por telegrama colacionado, carta documento, acta notarial u otro medio fehaciente. Si LA CLIENTE cambia de domicilio o de número de teléfono, deberá comunicarlo formalmente. Si no lo hace, serán válidas las notificaciones enviadas a los datos anteriores. - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CLÁUSULA 14 – JURISDICCIÓN: Para cualquier conflicto derivado de este contrato, las partes acuerdan someterse a la competencia de los Juzgados Letrados de Salto, renunciando a cualquier otro fuero o jurisdicción. - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CLÁUSULA 15 – ACEPTACIÓN FINAL: Leído el presente contrato, las partes manifiestan comprenderlo y aceptarlo en todos sus términos, firmando dos ejemplares del mismo tenor en el lugar y fecha indicados. - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -




______________________________

POR AK PRODUCCIONES EVENTOS

Tec. Alexander Knuth

C.I. 4.617.350-8




______________________________

LA CLIENTE

{{CLIENTE_NOMBRE}}

C.I. {{CLIENTE_CI}}`;

const DEFAULT_CONTRACT_TEMPLATE_DATE = '2026-01-01T00:00:00.000Z';

const DEFAULT_CONTRACT_TEMPLATES: ContractTemplateItem[] = [
  {
    id: 'default-servicios',
    type: 'servicios',
    name: 'Contrato de Servicios',
    template: defaultContractTemplate,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
  {
    id: 'default-cancelacion',
    type: 'cancelacion',
    name: 'Constancia de Cancelación',
    template: `CONSTANCIA DE CANCELACIÓN DE CONTRATO

En la ciudad de Salto, a los {{FECHA_HOY}}, comparecen {{EMPRESA_NOMBRE}} y {{CLIENTE_NOMBRE}}, dejando constancia de la cancelación del contrato correspondiente al evento del {{EVENTO_FECHA}} en {{EVENTO_SALON}}.

MOTIVO DE CANCELACIÓN: {{MOTIVO_CANCELACION}}.

Presupuesto total pactado: {{PRESUPUESTO_TOTAL}}.
Penalización aplicable: {{PENALIZACION_PORCENTAJE}} del total.
Monto de seña/anticipo registrado: {{SENIA}}.

Las partes acuerdan que, con la firma de la presente constancia, quedan documentadas las condiciones económicas y legales de la cancelación, sin perjuicio de los derechos y obligaciones ya devengados.

Firma empresa: __________________________
Firma cliente: __________________________`,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
  {
    id: 'default-cancelacion-servicios',
    type: 'cancelacion-servicios',
    name: 'Cancelación de uno o más servicios',
    template: `ADENDA DE CANCELACIÓN PARCIAL DE SERVICIOS

En la ciudad de Salto, a los {{FECHA_HOY}}, {{EMPRESA_NOMBRE}} y {{CLIENTE_NOMBRE}} acuerdan la cancelación parcial de uno o más servicios vinculados al evento del {{EVENTO_FECHA}}.

Detalle de la modificación/cancelación: {{MOTIVO_CANCELACION}}.
Penalización aplicable sobre servicios afectados: {{PENALIZACION_PORCENTAJE}}.

El resto del contrato principal permanece vigente en todos sus términos, salvo las modificaciones expresamente establecidas en esta adenda.

Firma empresa: __________________________
Firma cliente: __________________________`,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
  {
    id: 'default-cambio-fecha',
    type: 'cambio-fecha',
    name: 'Cambio de Fecha',
    template: `CONSTANCIA DE CAMBIO DE FECHA

En la ciudad de Salto, a los {{FECHA_HOY}}, {{EMPRESA_NOMBRE}} y {{CLIENTE_NOMBRE}} acuerdan modificar la fecha del evento originalmente prevista para {{EVENTO_FECHA}}.

Nueva fecha acordada: {{NUEVA_FECHA}}.
Motivo del cambio: {{MOTIVO_CANCELACION}}.
Penalización por cambio (si corresponde): {{PENALIZACION_PORCENTAJE}}.

Se deja constancia de que el contrato principal continúa vigente en todas las cláusulas no modificadas por la presente.

Firma empresa: __________________________
Firma cliente: __________________________`,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
  {
    id: 'default-salon',
    type: 'salon',
    name: 'Contrato de Salón',
    template: `CONTRATO DE SALÓN

En la ciudad de Salto, a los {{FECHA_HOY}}, comparecen {{EMPRESA_NOMBRE}} y {{CLIENTE_NOMBRE}} para acordar el arrendamiento y uso del salón {{NOMBRE_SALON}} con fecha {{EVENTO_FECHA}}.

Condiciones económicas:
- Monto total: {{PRESUPUESTO_TOTAL}}
- Seña: {{SENIA}}

Si corresponde cancelación o cambio, se aplicará una penalización de {{PENALIZACION_PORCENTAJE}} sobre los montos definidos contractualmente.

Las partes firman en conformidad.

Firma empresa: __________________________
Firma cliente: __________________________`,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
];


// --- Company Info ---
export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const data = await readData<Partial<CompanyInfo>>(COMPANY_INFO_FILE, {});
    return { ...defaultCompanyInfo, ...data };
  } catch {
    return { ...defaultCompanyInfo };
  }
}

export async function saveCompanyInfo(
  settings: Partial<CompanyInfo>
): Promise<{ success: boolean; data?: CompanyInfo; error?: string }> {
  try {
    const currentSettings = await getCompanyInfo();
    const settingsToSave = { ...currentSettings, ...settings };
    await writeData(COMPANY_INFO_FILE, settingsToSave);
    return { success: true, data: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la información de la empresa." };
  }
}

// --- Contract Template ---
function mergeContractTemplates(saved: ContractTemplateItem[], fallbackServiciosTemplate: string): ContractTemplateItem[] {
  const defaultsById = new Map(DEFAULT_CONTRACT_TEMPLATES.map(t => [t.id, t]));
  const defaultTypeToId = new Map(DEFAULT_CONTRACT_TEMPLATES.map(t => [t.type, t.id]));
  const defaultMerged = DEFAULT_CONTRACT_TEMPLATES.map((d) => {
    const byId = saved.find(s => s.id === d.id);
    const byType = saved.find(s => s.type === d.type && s.isDefault !== false);
    const stored = byId || byType;
    if (!stored) {
      if (d.type === 'servicios') return { ...d, template: fallbackServiciosTemplate };
      return d;
    }
    return {
      ...d,
      ...stored,
      id: d.id,
      type: d.type,
      isDefault: true,
      name: stored.name || d.name,
      template: stored.template || d.template,
      createdAt: stored.createdAt || d.createdAt,
      updatedAt: stored.updatedAt || d.updatedAt,
    };
  });

  const customTemplates = saved.filter((item) => {
    if (item.isDefault) return false;
    if (defaultsById.has(item.id)) return false;
    const maybeDefaultId = defaultTypeToId.get(item.type);
    return !maybeDefaultId;
  });

  return [...defaultMerged, ...customTemplates];
}

export async function getContractTemplates(): Promise<ContractTemplateItem[]> {
  try {
    const [savedTemplates, legacyServiciosTemplate] = await Promise.all([
      readData<ContractTemplateItem[]>(CONTRACT_TEMPLATES_FILE, []),
      readData<string>(CONTRACT_TEMPLATE_FILE, defaultContractTemplate),
    ]);
    return mergeContractTemplates(savedTemplates, legacyServiciosTemplate || defaultContractTemplate);
  } catch {
    return [...DEFAULT_CONTRACT_TEMPLATES];
  }
}

export async function getContractTemplate(): Promise<string> {
  try {
    const templates = await getContractTemplates();
    const servicios = templates.find(t => t.type === 'servicios') || DEFAULT_CONTRACT_TEMPLATES[0];
    return servicios.template;
  } catch {
    return defaultContractTemplate;
  }
}

export async function saveContractTemplate(input: string | ContractTemplateItem): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const templates = await getContractTemplates();

    if (typeof input === 'string') {
      const servicios = templates.find(t => t.type === 'servicios') || DEFAULT_CONTRACT_TEMPLATES[0];
      const updatedServicios: ContractTemplateItem = { ...servicios, template: input, updatedAt: now, isDefault: true };
      const nextTemplates = templates.map(t => (t.id === updatedServicios.id ? updatedServicios : t));
      await Promise.all([
        writeData(CONTRACT_TEMPLATES_FILE, nextTemplates),
        writeData(CONTRACT_TEMPLATE_FILE, input),
      ]);
      return { success: true };
    }

    const isDefaultType = DEFAULT_CONTRACT_TEMPLATES.some(t => t.type === input.type);
    const normalizedItem: ContractTemplateItem = {
      ...input,
      id: input.id || `contract-template-${Date.now()}`,
      name: input.name?.trim() || 'Plantilla personalizada',
      template: input.template || '',
      isDefault: isDefaultType ? true : !!input.isDefault,
      createdAt: input.createdAt || now,
      updatedAt: now,
    };

    const nextTemplates = templates.filter(t => {
      if (normalizedItem.isDefault && t.type === normalizedItem.type) return false;
      return t.id !== normalizedItem.id;
    });
    nextTemplates.push(normalizedItem);
    await writeData(CONTRACT_TEMPLATES_FILE, nextTemplates);

    if (normalizedItem.type === 'servicios') {
      await writeData(CONTRACT_TEMPLATE_FILE, normalizedItem.template);
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteContractTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const templates = await getContractTemplates();
    const target = templates.find(t => t.id === id);
    if (!target) return { success: false, error: 'Plantilla no encontrada.' };
    if (target.isDefault) return { success: false, error: 'No se pueden eliminar plantillas por defecto.' };
    const nextTemplates = templates.filter(t => t.id !== id);
    await writeData(CONTRACT_TEMPLATES_FILE, nextTemplates);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getContractTemplateByType(type: ContractType): Promise<ContractTemplateItem> {
  const templates = await getContractTemplates();
  const found = templates.find(t => t.type === type);
  if (found) return found;
  return DEFAULT_CONTRACT_TEMPLATES[0];
}

// --- Budget Display Settings ---
export async function getBudgetDisplaySettings(): Promise<BudgetDisplaySettings> {
  try {
    const data = await readData<Partial<BudgetDisplaySettings>>(BUDGET_SETTINGS_FILE, {});
    return { ...defaultBudgetDisplaySettings, ...data };
  } catch {
    return { ...defaultBudgetDisplaySettings };
  }
}

export async function saveBudgetDisplaySettings(
  settings: BudgetDisplaySettings
): Promise<{ success: boolean; settings?: BudgetDisplaySettings; error?: string }> {
  try {
    const settingsToSave: BudgetDisplaySettings = {
        ...defaultBudgetDisplaySettings, 
        ...settings, 
        annualAdjustmentPercentage: Number(settings.annualAdjustmentPercentage) || 0,
        promotionalDiscounts: Array.isArray(settings.promotionalDiscounts) 
          ? settings.promotionalDiscounts.map(d => ({
              ...d,
              value: Number(d.value) || 0,
            })) 
          : [],
    };
    await writeData(BUDGET_SETTINGS_FILE, settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la configuración." };
  }
}

// --- Invoice Template Settings ---
export async function getInvoiceTemplateSettings(): Promise<InvoiceTemplateSettings> {
  try {
    const data = await readData<Partial<InvoiceTemplateSettings>>(INVOICE_SETTINGS_FILE, {});
    return { ...defaultInvoiceTemplateSettings, ...data };
  } catch {
    return { ...defaultInvoiceTemplateSettings };
  }
}

export async function saveInvoiceTemplateSettings(
  settings: Partial<InvoiceTemplateSettings>
): Promise<{ success: boolean; settings?: InvoiceTemplateSettings; error?: string }> {
  try {
    const currentSettings = await getInvoiceTemplateSettings();
    const settingsToSave: InvoiceTemplateSettings = {
      ...currentSettings,
      ...settings,
    };
    await writeData(INVOICE_SETTINGS_FILE, settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la plantilla de factura." };
  }
}

// --- WhatsApp Settings ---
export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  try {
    const data = await readData<Partial<WhatsAppSettings>>(WHATSAPP_SETTINGS_FILE, {});
    return { ...defaultWhatsAppSettings, ...data };
  } catch {
    return { ...defaultWhatsAppSettings };
  }
}

export async function saveWhatsAppSettings(
  settings: Partial<WhatsAppSettings>
): Promise<{ success: boolean; settings?: WhatsAppSettings; error?: string }> {
  try {
    const currentSettings = await getWhatsAppSettings();
    const settingsToSave: WhatsAppSettings = { ...currentSettings, ...settings };
    await writeData(WHATSAPP_SETTINGS_FILE, settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la configuración de WhatsApp." };
  }
}

// --- Contract Settings ---
export async function getContractSettings(): Promise<ContractSettings> {
  try {
    const data = await readData<Partial<ContractSettings>>(CONTRACT_SETTINGS_FILE, {});
    return { ...defaultContractSettings, ...data, clauses: data.clauses?.length ? data.clauses : defaultContractSettings.clauses };
  } catch {
    return { ...defaultContractSettings };
  }
}

export async function saveContractSettings(settings: ContractSettings): Promise<{ success: boolean; error?: string }> {
  try {
    await writeData(CONTRACT_SETTINGS_FILE, settings);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// --- WhatsApp Templates ---
export async function getWhatsAppTemplates(): Promise<WhatsAppTemplates> {
  try {
    const data = await readData<Partial<WhatsAppTemplates>>(WHATSAPP_TEMPLATES_FILE, {});
    return { ...defaultWhatsAppTemplates, ...data };
  } catch {
    return { ...defaultWhatsAppTemplates };
  }
}

export async function saveWhatsAppTemplates(
  templates: Partial<WhatsAppTemplates>
): Promise<{ success: boolean; templates?: WhatsAppTemplates; error?: string }> {
  try {
    const currentTemplates = await getWhatsAppTemplates();
    const templatesToSave: WhatsAppTemplates = { ...currentTemplates, ...templates };
    await writeData(WHATSAPP_TEMPLATES_FILE, templatesToSave);
    return { success: true, templates: templatesToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar las plantillas de WhatsApp." };
  }
}

// ── AI Assistant Settings ──────────────────────────────────────────────────

const AI_ASSISTANT_SETTINGS_FILE = 'ai-assistant-settings.json';
const AI_ASSISTANT_DOCUMENT_MAX_CHARS = 12000; // Protects storage/prompt size for assistant context.
const AI_ASSISTANT_TEXT_MAX_CHARS = 20000;
const AI_ASSISTANT_APP_SCAN_MAX_ROUTES = 200;

export interface AiAssistantSettings {
  customInstructions: string;
  operationalInstructions: string;
  salesMarketingInstructions: string;
  dynamicBusinessRules: string;
  lessonsLearned: string;
  appFunctionalityContext: string;
  knowledgeDocuments: Array<{
    id: string;
    name: string;
    type: string;
    content: string;
    updatedAt: string;
  }>;
  updatedAt: string;
}

const defaultAiAssistantSettings: AiAssistantSettings = {
  customInstructions: '',
  operationalInstructions: '',
  salesMarketingInstructions: '',
  dynamicBusinessRules: '',
  lessonsLearned: '',
  appFunctionalityContext: '',
  knowledgeDocuments: [],
  updatedAt: '',
};

export async function getAiAssistantSettings(): Promise<AiAssistantSettings> {
  const data = await readData<Partial<AiAssistantSettings>>(AI_ASSISTANT_SETTINGS_FILE, {});
  return { ...defaultAiAssistantSettings, ...data };
}

export async function saveAiAssistantSettings(
  settings: Pick<
    AiAssistantSettings,
    | 'customInstructions'
    | 'operationalInstructions'
    | 'salesMarketingInstructions'
    | 'dynamicBusinessRules'
    | 'lessonsLearned'
    | 'appFunctionalityContext'
    | 'knowledgeDocuments'
  >
): Promise<{ success: boolean; error?: string }> {
  try {
    const sanitizedKnowledgeDocuments = Array.isArray(settings.knowledgeDocuments)
      ? settings.knowledgeDocuments
          .map(doc => ({
            id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: doc.name || 'Documento',
            type: doc.type || 'text/plain',
            content: (doc.content || '').slice(0, AI_ASSISTANT_DOCUMENT_MAX_CHARS),
            updatedAt: doc.updatedAt || new Date().toISOString(),
          }))
      : [];

    const toSave: AiAssistantSettings = {
      customInstructions: (settings.customInstructions || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      operationalInstructions: (settings.operationalInstructions || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      salesMarketingInstructions: (settings.salesMarketingInstructions || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      dynamicBusinessRules: (settings.dynamicBusinessRules || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      lessonsLearned: (settings.lessonsLearned || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      appFunctionalityContext: (settings.appFunctionalityContext || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      knowledgeDocuments: sanitizedKnowledgeDocuments,
      updatedAt: new Date().toISOString(),
    };
    await writeData(AI_ASSISTANT_SETTINGS_FILE, toSave);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Convierte una ruta absoluta de un archivo `page.tsx` dentro de `src/app`
 * en su URL de App Router.
 * Remueve route groups `(group)` para exponer la ruta pública real.
 */
function buildRouteFromPagePath(absolutePagePath: string, appDir: string): string {
  const rel = path.relative(appDir, absolutePagePath).replace(/\\/g, '/');
  const withoutPage = rel.replace(/\/page\.tsx$/, '');
  const segments = withoutPage
    .split('/')
    .filter(Boolean)
    .filter((segment) => !/^\(.*\)$/.test(segment)); // ignore route groups

  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}

/**
 * Recorre recursivamente `src/app` para encontrar archivos `page.tsx`
 * y agrega cada ruta URL normalizada al array recibido.
 */
async function collectPageRoutes(dir: string, appDir: string, routes: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectPageRoutes(fullPath, appDir, routes);
      continue;
    }

    if (entry.isFile() && entry.name === 'page.tsx') {
      const route = buildRouteFromPagePath(fullPath, appDir);
      routes.push(route);
    }
  }
}

export async function scanAiAssistantAppContext(): Promise<{ success: boolean; context?: string; error?: string }> {
  try {
    const appDir = path.join(process.cwd(), 'src', 'app');
    const routes: string[] = [];
    await collectPageRoutes(appDir, appDir, routes);

    const uniqueRoutes = Array.from(new Set(routes)).sort();
    const listedRoutes = uniqueRoutes.slice(0, AI_ASSISTANT_APP_SCAN_MAX_ROUTES);

    const context = [
      'Escaneo automático de rutas funcionales de la app (src/app):',
      ...listedRoutes.map((route) => `- ${route}`),
      uniqueRoutes.length > listedRoutes.length
        ? `- ... y ${uniqueRoutes.length - listedRoutes.length} rutas adicionales (omitidas por límite)`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    return { success: true, context };
  } catch (error: any) {
    return { success: false, error: error?.message || 'No se pudo escanear la app.' };
  }
}

const GEMINI_CONNECTION_TIMEOUT_MS = 15000;

export async function testGeminiConnection(): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: 'La API key de Gemini no está configurada en el servidor. Verificá que el secreto "google-api-key" esté creado en Firebase y que el backend tenga acceso a él.',
    };
  }
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respondé solo la palabra: ok' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: AbortSignal.timeout(GEMINI_CONNECTION_TIMEOUT_MS),
      }
    );
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      const msg = (errData as any)?.error?.message || `HTTP ${resp.status}`;
      return { ok: false, error: `Gemini respondió con error: ${msg}` };
    }
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message || String(error) };
  }
}
