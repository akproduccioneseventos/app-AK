import 'server-only';

import { readData } from '@/lib/data-service';
import { decidir } from '@/lib/ai/decisiones';
import { extractWhatsAppRefCode, normalizeUruguayPhone } from '@/lib/commercial/contact';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { createNotification } from '@/lib/notifications/create-notification';
import { esOrigenDePublicidad, type ReferenciaDeOrigen } from '@/lib/whatsapp/vino-de-la-publicidad';
import type { CrmLead } from '@/types/crm';
import type { Customer } from '@/types/customer';
import type { Empleado } from '@/types/empleado';
import type { Presupuesto } from '@/types/presupuesto';
import type { Proveedor } from '@/types/proveedor';
import type { WhatsAppConfig } from '@/types/whatsapp';

const WHATSAPP_CONFIG_FILE = 'whatsapp-config.json';
const WHATSAPP_SETTINGS_FILE = 'whatsapp-settings.json';
const PERSONAL_NUMBERS_FILE = 'whatsapp-numeros-personales.json';
const KNOWN_CONTACTS_FILE = 'whatsapp-contactos-conocidos.json';
const GOOGLE_CONTACTS_FILE = 'google-contacts.json';
const AD_CONVERSATIONS_FILE = 'whatsapp-conversaciones-de-publicidad.json';
const CRM_LEADS_FILE = 'crm-leads.json';
const CUSTOMERS_FILE = 'customers.json';
const PRESUPUESTOS_FILE = 'presupuestos.json';
const EMPLEADOS_FILE = 'empleados.json';
const PROVEEDORES_FILE = 'proveedores.json';
const ASISTENTE_SETTINGS_FILE = 'asistente-settings.json';

const AD_MEMORY_DAYS = 7;

export type MotivoProspectoWhatsApp =
  | 'anuncio'
  | 'crm_existente'
  | 'marca_ak'
  | 'llego_solo'
  | 'dudoso_ia';

export interface EvaluacionProspectoWhatsApp {
  esProspecto: boolean;
  motivo: MotivoProspectoWhatsApp | null;
  rechazadoPor?:
    | 'interruptor_apagado'
    | 'numero_personal'
    | 'cliente_con_fiesta'
    | 'contacto_conocido'
    | 'ia_descartado'
    | 'sin_puerta';
  esDudoso?: boolean;
  notaIA?: number;
  refCodigo?: string;
  leadCoincidente?: CrmLead;
  leadsDuplicados?: CrmLead[];
}

function samePhone(a?: string | null, b?: string | null): boolean {
  const normA = normalizeUruguayPhone(a);
  const normB = normalizeUruguayPhone(b);
  if (normA && normB && normA === normB) return true;
  const digitsA = String(a || '').replace(/\D/g, '');
  const digitsB = String(b || '').replace(/\D/g, '');
  if (digitsA.length >= 7 && digitsB.length >= 7 && digitsA === digitsB) return true;
  return false;
}

function hasActiveAdConversation(
  records: Array<{ telefono?: string; desde?: string }> | undefined,
  telefono: string,
  ahora: Date,
): boolean {
  if (!Array.isArray(records) || records.length === 0) return false;
  const ahoraMs = ahora.getTime();
  const maxAgeMs = AD_MEMORY_DAYS * 24 * 60 * 60 * 1000;
  return records.some((item) => {
    if (!item?.telefono || !samePhone(item.telefono, telefono)) return false;
    const desdeMs = item.desde ? new Date(item.desde).getTime() : NaN;
    return Number.isFinite(desdeMs) && ahoraMs - desdeMs < maxAgeMs;
  });
}

async function estaHabilitadoLlevarAlCrm(): Promise<boolean> {
  const [config, settings] = await Promise.all([
    readData<Partial<WhatsAppConfig>>(WHATSAPP_CONFIG_FILE, {}).catch(() => ({} as Partial<WhatsAppConfig>)),
    readData<{ llevarWhatsAppProspectosAlCrm?: boolean }>(WHATSAPP_SETTINGS_FILE, {}).catch(
      () => ({} as { llevarWhatsAppProspectosAlCrm?: boolean }),
    ),
  ]);
  if (config?.llevarWhatsAppProspectosAlCrm !== undefined) {
    return Boolean(config.llevarWhatsAppProspectosAlCrm);
  }
  return Boolean(settings?.llevarWhatsAppProspectosAlCrm);
}

async function estaEnNumerosPersonales(telefono: string): Promise<boolean> {
  const [config, extraNumbers] = await Promise.all([
    readData<Partial<WhatsAppConfig>>(WHATSAPP_CONFIG_FILE, {}).catch(() => ({} as Partial<WhatsAppConfig>)),
    readData<string[]>(PERSONAL_NUMBERS_FILE, []).catch(() => [] as string[]),
  ]);
  const lista = [
    ...(Array.isArray(config?.numerosPersonales) ? config.numerosPersonales : []),
    ...(Array.isArray(extraNumbers) ? extraNumbers : []),
  ];
  return lista.some((numero) => samePhone(numero, telefono));
}

async function esClienteConFiesta(telefono: string): Promise<boolean> {
  const [customers, presupuestos, fiestas] = await Promise.all([
    readData<Customer[]>(CUSTOMERS_FILE, []).catch(() => []),
    readData<Presupuesto[]>(PRESUPUESTOS_FILE, []).catch(() => []),
    leerFiestasCrudas(true).catch(() => []),
  ]);

  const customerIdsConTelefono = new Set<string>();
  for (const c of Array.isArray(customers) ? customers : []) {
    if (!samePhone(c?.phone, telefono)) continue;
    if (c.id) customerIdsConTelefono.add(c.id);
    if (c.estadoCliente === 'Actual' || c.partyDate || c.presupuestoId) {
      return true;
    }
  }

  const presupuestoIdsConTelefono = new Set<string>();
  for (const p of Array.isArray(presupuestos) ? presupuestos : []) {
    if (!samePhone(p?.clienteContacto, telefono)) continue;
    if (p.id) presupuestoIdsConTelefono.add(p.id);
    if (p.estado === 'Aceptado' || p.estado === 'Facturado') {
      return true;
    }
  }

  for (const f of Array.isArray(fiestas) ? fiestas : []) {
    const clienteId = f?.configuracion?.clienteId;
    if (clienteId && customerIdsConTelefono.has(clienteId)) return true;
    if (f?.presupuestoId && presupuestoIdsConTelefono.has(f.presupuestoId)) return true;
  }

  return false;
}

async function estaEnContactosConocidos(telefono: string): Promise<boolean> {
  const [empleados, proveedores, asistenteSettings, conocidos, googleContacts] = await Promise.all([
    readData<Empleado[]>(EMPLEADOS_FILE, []).catch(() => []),
    readData<Proveedor[]>(PROVEEDORES_FILE, []).catch(() => []),
    readData<{ numerosEquipo?: Array<{ telefono?: string }> }>(ASISTENTE_SETTINGS_FILE, {}).catch(
      () => ({} as { numerosEquipo?: Array<{ telefono?: string }> }),
    ),
    readData<Array<string | { phone?: string; telefono?: string }>>(KNOWN_CONTACTS_FILE, []).catch(() => []),
    readData<Array<{ phone?: string; telefono?: string; phoneNumbers?: Array<{ value?: string }> }>>(
      GOOGLE_CONTACTS_FILE,
      [],
    ).catch(() => []),
  ]);

  const phones: Array<string | undefined> = [
    ...(Array.isArray(empleados) ? empleados.map((e) => e?.telefono) : []),
    ...(Array.isArray(proveedores) ? proveedores.map((p) => p?.telefono) : []),
    ...(Array.isArray(asistenteSettings?.numerosEquipo)
      ? asistenteSettings.numerosEquipo.map((e) => e?.telefono)
      : []),
    ...(Array.isArray(conocidos)
      ? conocidos.map((c) => (typeof c === 'string' ? c : c?.phone || c?.telefono))
      : []),
    ...(Array.isArray(googleContacts)
      ? googleContacts.flatMap((c) => [
          c?.phone,
          c?.telefono,
          ...(Array.isArray(c?.phoneNumbers) ? c.phoneNumbers.map((p) => p?.value) : []),
        ])
      : []),
  ];

  return phones.some((p) => p && samePhone(p, telefono));
}

function sortLeadsMostRecentFirst(leads: CrmLead[]): CrmLead[] {
  return [...leads].sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
    return tb - ta;
  });
}

/**
 * Evalúa si un mensaje entrante de WhatsApp debe entrar al CRM y por qué puerta.
 */
export async function evaluarProspectoDeWhatsApp(params: {
  telefono: string;
  referencia?: ReferenciaDeOrigen | null;
  texto?: string;
  ahora?: Date;
}): Promise<EvaluacionProspectoWhatsApp> {
  const { telefono, referencia, texto = '', ahora = new Date() } = params;

  // Interruptor general en Ajustes WhatsApp (apagado por defecto)
  if (!(await estaHabilitadoLlevarAlCrm())) {
    return { esProspecto: false, motivo: null, rechazadoPor: 'interruptor_apagado' };
  }

  // Números personales ganan sobre TODAS las puertas
  if (await estaEnNumerosPersonales(telefono)) {
    return { esProspecto: false, motivo: null, rechazadoPor: 'numero_personal' };
  }

  // Clientes que ya tienen fiesta nunca entran como prospecto nuevo
  if (await esClienteConFiesta(telefono)) {
    return { esProspecto: false, motivo: null, rechazadoPor: 'cliente_con_fiesta' };
  }

  const leads = await readData<CrmLead[]>(CRM_LEADS_FILE, []).catch(() => []);
  const leadsCoincidentes = sortLeadsMostRecentFirst(
    (Array.isArray(leads) ? leads : []).filter((l) => l?.phone && samePhone(l.phone, telefono)),
  );

  // Puerta 1: viene de anuncio o charla de anuncio vigente
  const adRecord = await readData<{ conversaciones?: Array<{ telefono?: string; desde?: string }> }>(
    AD_CONVERSATIONS_FILE,
    {},
  ).catch(() => ({} as { conversaciones?: Array<{ telefono?: string; desde?: string }> }));
  if (esOrigenDePublicidad(referencia) || hasActiveAdConversation(adRecord?.conversaciones, telefono, ahora)) {
    return {
      esProspecto: true,
      motivo: 'anuncio',
      leadCoincidente: leadsCoincidentes[0],
    };
  }

  // Puerta 2: coincide por normalizeUruguayPhone con phone de un prospecto del CRM
  if (leadsCoincidentes.length > 0) {
    const leadPrincipal = leadsCoincidentes[0];
    if (leadsCoincidentes.length > 1) {
      const notifRes = await createNotification({
        titulo: 'Teléfono repetido en el CRM',
        mensaje: `Entró un WhatsApp de ${telefono} y hay ${leadsCoincidentes.length} fichas con ese número. Se usó la más reciente (${leadPrincipal.name}).`,
        href: `/contabilidad/crm?leadId=${encodeURIComponent(leadPrincipal.id)}`,
        tipo: 'aviso',
        icono: 'AlertTriangle',
        entidadRelacionadaId: leadPrincipal.id,
        rolDestino: 'admin',
      }).catch(() => ({ success: false, error: 'Error creando notificación' }));
      if (!notifRes.success) {
        console.warn('[QuienEsProspecto] No se pudo crear notificación:', notifRes.error);
      }
    }
    return {
      esProspecto: true,
      motivo: 'crm_existente',
      leadCoincidente: leadPrincipal,
      leadsDuplicados: leadsCoincidentes.length > 1 ? leadsCoincidentes : undefined,
    };
  }

  // Puerta 3: trae marca (ref AK-...)
  const refCodigo = extractWhatsAppRefCode(texto);
  if (refCodigo) {
    const leadPorRef = (Array.isArray(leads) ? leads : []).find(
      (l) => l.id === refCodigo || l.id.endsWith(refCodigo),
    );
    return {
      esProspecto: true,
      motivo: 'marca_ak',
      refCodigo,
      leadCoincidente: leadPorRef,
    };
  }

  // Puerta 4 (Bloque 6): primer mensaje de desconocido
  if (await estaEnContactosConocidos(telefono)) {
    return { esProspecto: false, motivo: null, rechazadoPor: 'contacto_conocido' };
  }

  const textoLimpio = String(texto || '').trim();
  if (!textoLimpio) {
    return { esProspecto: false, motivo: null, rechazadoPor: 'sin_puerta' };
  }

  const decision = await decidir({
    entradas: [textoLimpio],
    preguntas: {
      consulta_de_evento: {
        tipo: 'si_no',
        instruccion:
          '¿Este mensaje de WhatsApp es una consulta comercial sobre fiestas, eventos, cumpleaños, bodas, 15 años, presupuestos, fechas, salones o servicios de AK Producciones (y no un mensaje personal, familiar, spam o de proveedor)?',
      },
      seguridad: {
        tipo: 'nota',
        instruccion:
          'Del 1 al 3, ¿qué tan seguro estás de que quien escribe es un potencial cliente consultando por un evento?',
        escala: {
          '1': 'Muy dudoso: apenas parece consulta comercial',
          '2': 'Posible consulta comercial de evento, algo ambigua',
          '3': 'Totalmente seguro: es una consulta clara por fiesta o presupuesto',
        },
      },
    },
    funcion: 'decisiones',
  }).catch(() => null);

  if (!decision || decision.consulta_de_evento?.siNo !== true) {
    return { esProspecto: false, motivo: null, rechazadoPor: 'ia_descartado' };
  }

  const notaRaw = decision.seguridad?.nota;
  const notaIA = notaRaw === 3 ? 3 : notaRaw === 2 ? 2 : 1;

  if (notaIA === 3) {
    return {
      esProspecto: true,
      motivo: 'llego_solo',
      esDudoso: false,
      notaIA: 3,
    };
  }

  return {
    esProspecto: true,
    motivo: 'dudoso_ia',
    esDudoso: true,
    notaIA,
  };
}

/**
 * Devuelve el motivo por el que un WhatsApp entra al CRM o `null` si no corresponde guardarlo.
 */
export async function esProspectoDeWhatsApp(
  telefono: string,
  referencia?: ReferenciaDeOrigen | null,
  texto?: string,
): Promise<MotivoProspectoWhatsApp | null> {
  const evaluacion = await evaluarProspectoDeWhatsApp({ telefono, referencia, texto });
  return evaluacion.motivo;
}
