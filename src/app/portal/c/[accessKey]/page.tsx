
import { notFound } from 'next/navigation';
import { getFiestaByAccessKey } from '@/app/actions/fiesta/portal.actions';
import { getCompanyInfo } from '@/app/actions/settings';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { Presupuesto } from '@/types/presupuesto';
import { toPublicGuestStatsInput } from '@/lib/client-portal/public-guest-stats';
import PublicPortalClientExperience from './PublicPortalClientExperience';

interface PageProps {
  params: Promise<{ accessKey: string }>;
}

function mapFiestaToPortalDTO(fiesta: any, routeAccessKey: string): any {
  if (!fiesta) return null;
  return {
    id: fiesta.id,
    invitacionSlug: fiesta.invitacionSlug,
    presupuestoId: fiesta.presupuestoId,
    configuracion: fiesta.configuracion ? {
      clienteId: fiesta.configuracion.clienteId,
      clienteNombre: fiesta.configuracion.clienteNombre,
      nombreEvento: fiesta.configuracion.nombreEvento,
      fechaEvento: fiesta.configuracion.fechaEvento,
      horaInicio: fiesta.configuracion.horaInicio,
      horaFin: fiesta.configuracion.horaFin,
      nombreLugar: fiesta.configuracion.nombreLugar,
      direccionLugar: fiesta.configuracion.direccionLugar,
      invitadosEstimados: fiesta.configuracion.invitadosEstimados,
      tipoCelebracion: fiesta.configuracion.tipoCelebracion,
      primaryColor: fiesta.configuracion.primaryColor,
      protagonistaFotoUrl: fiesta.configuracion.protagonistaFotoUrl,
    } : {},
    clientPortalSettings: fiesta.clientPortalSettings ? {
      enabled: fiesta.clientPortalSettings.enabled,
      accessKey: routeAccessKey,
      musica: fiesta.clientPortalSettings.musica,
      videoVida: fiesta.clientPortalSettings.videoVida,
      fotografiaYFilmacion: fiesta.clientPortalSettings.fotografiaYFilmacion,
      menu: fiesta.clientPortalSettings.menu,
      calculadoraBebidas: fiesta.clientPortalSettings.calculadoraBebidas,
      moodboard: fiesta.clientPortalSettings.moodboard,
      itinerario: fiesta.clientPortalSettings.itinerario,
      cuentasBancarias: fiesta.clientPortalSettings.cuentasBancarias,
    } : {},
    clientePortalExperience: fiesta.clientePortalExperience,
    contratoDatos: fiesta.contratoDatos ? {
      senia: fiesta.contratoDatos.senia,
      saldo: fiesta.contratoDatos.saldo,
      ajusteAnualPorcentaje: fiesta.contratoDatos.ajusteAnualPorcentaje,
      fechaFirmaContrato: fiesta.contratoDatos.fechaFirmaContrato,
      planPagos: fiesta.contratoDatos.planPagos ? {
        activo: fiesta.contratoDatos.planPagos.activo,
        fechaLimite30Porciento: fiesta.contratoDatos.planPagos.fechaLimite30Porciento,
        montoObjetivo30Porciento: fiesta.contratoDatos.planPagos.montoObjetivo30Porciento,
        cuotas: (fiesta.contratoDatos.planPagos.cuotas || []).map((c: any) => ({
          id: c.id,
          descripcion: c.descripcion,
          fechaVencimiento: c.fechaVencimiento,
          montoMinimo: c.montoMinimo,
          estado: c.estado,
          montoAcumulado: c.montoAcumulado,
        })),
      } : undefined,
    } : undefined,
    clientChecklist: fiesta.clientChecklist || [],
    clientNotes: fiesta.clientNotes || '',
    faqPortal: fiesta.faqPortal || [],
    menuSeleccionPortal: fiesta.menuSeleccionPortal || {},
    listaMusicaPortal: fiesta.listaMusicaPortal || {},
    socialGallerySettings: fiesta.socialGallerySettings ? {
      enabled: fiesta.socialGallerySettings.enabled,
      activeGame: fiesta.socialGallerySettings.activeGame,
    } : {},
    timeline: fiesta.timeline || [],
    invitados: toPublicGuestStatsInput(fiesta.invitados),
    reuniones: fiesta.reuniones || [],
    programa: fiesta.programa || [],
    videoVida: fiesta.videoVida ? {
      galleryEnabled: fiesta.videoVida.galleryEnabled,
      photoCount: fiesta.videoVida.photoCount,
    } : {},
    fotografiaYFilmacion: fiesta.fotografiaYFilmacion ? {
      notasGenerales: fiesta.fotografiaYFilmacion.notasGenerales,
    } : {},
    clientMenuChangeRequests: fiesta.clientMenuChangeRequests || [],
    clientServiceChangeRequests: fiesta.clientServiceChangeRequests || [],
    clienteDebeLlevar: fiesta.clienteDebeLlevar || [],
    contratoFirmaInfo: fiesta.contratoFirmaInfo ? {
      isSigned: fiesta.contratoFirmaInfo.isSigned,
    } : {},
    contratoServicioTexto: fiesta.contratoServicioTexto || '',
    documentos: (fiesta.documentos || []).map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName,
      nombre: doc.nombre,
      titulo: doc.titulo,
      tipo: doc.tipo,
    })),
    otrosDocumentos: (fiesta.otrosDocumentos || []).map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName,
      nombre: doc.nombre,
      titulo: doc.titulo,
      tipo: doc.tipo,
    })),
    othersDocumentos: (fiesta.othersDocumentos || []).map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName,
      nombre: doc.nombre,
      titulo: doc.titulo,
      tipo: doc.tipo,
    })),
    clientPaymentNotifications: (fiesta.clientPaymentNotifications || []).map((n: any) => ({
      id: n.id,
      monto: n.monto,
      estado: n.estado,
      timestamp: n.timestamp,
      comprobanteNombre: n.comprobanteNombre,
    })),
  };
}

import { generateBudgetToken } from '@/lib/auth/session-token';

function mapPresupuestoToPortalDTO(presupuesto: any, token?: string): any {
  if (!presupuesto) return null;
  return {
    id: presupuesto.id,
    totalConDescuento: presupuesto.totalConDescuento,
    totalFinal: presupuesto.totalFinal,
    costoTotalEstimado: presupuesto.costoTotalEstimado,
    total: presupuesto.total,
    itemsPresupuestados: presupuesto.itemsPresupuestados || [],
    pagosCliente: (presupuesto.pagosCliente || []).map((p: any) => ({
      fecha: p.fecha,
      monto: p.monto,
      metodoPago: p.metodoPago,
      referencia: p.referencia,
      estadoPago: p.estadoPago,
    })),
    invitadosCantidad: presupuesto.invitadosCantidad,
    ajusteAnualPorcentaje: presupuesto.ajusteAnualPorcentaje,
    token,
  };
}

export default async function PublicPortalPage(props: PageProps) {
  const params = await props.params;
  const { accessKey } = params;

  const [fiesta, companyInfo] = await Promise.all([
    getFiestaByAccessKey(accessKey),
    getCompanyInfo(),
  ]);

  if (!fiesta || !fiesta.clientPortalSettings?.enabled) {
    notFound();
  }

  const budgetToken = fiesta.presupuestoId ? await generateBudgetToken(fiesta.presupuestoId) : undefined;
  const [presupuesto, catalogServices] = await Promise.all([
    fiesta.presupuestoId ? getPresupuestoById(fiesta.presupuestoId, budgetToken) : Promise.resolve(null as Presupuesto | null),
    getServiciosEmpresa().then(servicios => servicios
      .filter(servicio => Number(servicio.precioVenta ?? servicio.precioBase ?? servicio.precioPorPersona ?? 0) > 0)
      .slice(0, 80)
      .map(servicio => ({
        id: servicio.id,
        nombre: servicio.nombre,
        categoria: servicio.categoria,
        subcategoria: servicio.subcategoria,
        precioVenta: servicio.precioVenta,
        calculationMethod: servicio.calculationMethod,
        precioBase: servicio.precioBase,
        precioPorPersona: servicio.precioPorPersona,
        invitadosPorUnidad: servicio.invitadosPorUnidad,
        tramosDePrecio: servicio.tramosDePrecio,
        unidad: servicio.unidad,
      }))).catch(() => []),
  ]);

  const portalFiesta = mapFiestaToPortalDTO(fiesta, accessKey);
  const portalPresupuesto = mapPresupuestoToPortalDTO(presupuesto, budgetToken);

  return (
    <PublicPortalClientExperience
      fiesta={portalFiesta}
      companyContact={companyInfo.companyContact}
      companyName={companyInfo.companyName}
      presupuesto={portalPresupuesto}
      catalogServices={catalogServices}
    />
  );
}

