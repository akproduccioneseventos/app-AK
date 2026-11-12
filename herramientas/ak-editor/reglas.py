# -*- coding: utf-8 -*-
"""Módulo de reglas de edición para AK Editor Inteligente.

Aplica las reglas configuradas en config.yaml para cada bloque de la fiesta:
- Previa (rotación de transiciones sin repetir consecutivas y regla 'la pose')
- Entrada (ducking de música con voz de locutor)
- Vals (música continua sin interrupciones)
- Baile multicámara (cámara principal + Osmo de rescate ante errores, o corte de 0.2s sin Osmo)
- Discursos y velas (nunca cortar mientras hablan por micrófono)
- Marca AK (márgenes y posición del logo)
- Aprender de mis videos (analiza videos terminados y propone parámetros para config.yaml)
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional, Tuple
import cv2
import numpy as np
import yaml


TRANSICIONES_PREVIA = [
    "disolvencia",
    "fundido_a_negro",
    "desplazamiento_izq",
    "desplazamiento_der",
    "zoom_in",
    "desenfoque",
]

CONFIG_DEFECTO = {
    "edicion": {
        "previa": {
            "duracion_min_segundos_con_personas": 3.5,
            "duracion_max_segundos_con_personas": 6.0,
            "duracion_min_segundos_sin_personas": 3.0,
            "duracion_max_segundos_sin_personas": 5.0,
            "volumen_audio_ambiente": 0.05,
            "duracion_transicion_segundos": 1.0,
        },
        "entrada": {
            "atenuacion_musica_al_hablar": 0.15,
        },
        "vals": {
            "musica_continua": True,
            "duracion_fundido_segundos": 0.8,
        },
        "baile": {
            "max_segundos_sin_corte": 50.0,
            "duracion_osmo_rescate_segundos": 5.0,
            "duracion_min_corte_segundos": 4.0,
            "duracion_max_corte_segundos": 8.0,
        },
        "discursos_y_velas": {
            "margen_antes_de_llegar_segundos": 1.5,
            "duracion_pose_segundos": 3.5,
            "cortar_mientras_hablan": False,
        },
        "marca": {
            "margen_pantalla_porcentaje": 4,
            "color_primario": "#d71920",
        },
    }
}


def cargar_configuracion(ruta_yaml: Optional[str] = None) -> Dict[str, Any]:
    """Carga config.yaml o devuelve la configuración por defecto si no existe."""
    if ruta_yaml is None:
        directorio_actual = os.path.dirname(os.path.abspath(__file__))
        ruta_yaml = os.path.join(directorio_actual, "config.yaml")

    if os.path.exists(ruta_yaml):
        try:
            with open(ruta_yaml, "r", encoding="utf-8") as f:
                c = yaml.safe_load(f)
                if isinstance(c, dict) and "edicion" in c:
                    return c
        except Exception:
            pass

    return CONFIG_DEFECTO


class ReglasEdicion:
    """Aplica las reglas de negocio de edición según config.yaml."""

    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        almacen: Optional[Any] = None,
    ):
        self.config = config or cargar_configuracion()
        self.almacen = almacen
        self.cfg_edicion = self.config.get("edicion", CONFIG_DEFECTO["edicion"])
        self._ultima_transicion = ""

    def elegir_transicion_sin_repetir(self) -> str:
        """Elige una transición de la lista asegurando que NUNCA sea idéntica a la anterior."""
        candidatos = [t for t in TRANSICIONES_PREVIA if t != self._ultima_transicion]
        elegida = candidatos[0] if candidatos else TRANSICIONES_PREVIA[0]
        TRANSICIONES_PREVIA.append(TRANSICIONES_PREVIA.pop(0))
        self._ultima_transicion = elegida
        return elegida

    def generar_cortes_previa(
        self,
        archivos: List[Dict[str, Any]],
        hay_personas: bool = True,
        almacen: Optional[Any] = None,
    ) -> List[Dict[str, Any]]:
        """Genera cortes para la previa con duraciones cuidadas y transiciones alternadas."""
        cfg = self.cfg_edicion.get("previa", CONFIG_DEFECTO["edicion"]["previa"])
        dur_min_personas = cfg.get("duracion_min_segundos_con_personas", 3.5)
        dur_max_personas = cfg.get("duracion_max_segundos_con_personas", 6.0)
        dur_min_sin = cfg.get("duracion_min_segundos_sin_personas", 3.0)
        dur_max_sin = cfg.get("duracion_max_segundos_sin_personas", 5.0)
        volumen_audio = cfg.get("volumen_audio_ambiente", 0.05)

        alm = almacen or getattr(self, "almacen", None)
        cortes = []

        for arch in archivos:
            archivo_id = arch.get("id")
            dur_total = float(arch.get("duracion", 10.0))

            # 1. Obtener análisis del archivo
            metricas = []
            if "analisis" in arch and isinstance(arch["analisis"], list):
                metricas = arch["analisis"]
            elif "metricas" in arch and isinstance(arch["metricas"], list):
                metricas = arch["metricas"]
            elif alm is not None and archivo_id:
                metricas = alm.obtener_analisis_segundos(archivo_id)

            # 2. Manejo cuando no hay análisis
            if not metricas:
                if alm is not None or "estado_analisis" in arch:
                    cortes.append({
                        "archivo_id": archivo_id,
                        "bloque": "previa",
                        "entrada": 0.0,
                        "salida": 0.0,
                        "duracion": 0.0,
                        "in_sec": 0.0,
                        "out_sec": 0.0,
                        "tipo": "sin_analizar",
                        "transicion": "ninguna",
                        "regla_aplicada": "sin analizar",
                        "camara": arch.get("camara", "principal"),
                        "pista_video": 1,
                        "pista_audio": 1,
                    })
                    continue

                # Fallback para pruebas unitarias tradicionales sin BD ni análisis sintético
                dur_min = dur_min_personas if hay_personas else dur_min_sin
                dur_max = dur_max_personas if hay_personas else dur_max_sin
                margen_inicio = 1.0 if dur_total >= (dur_min + 2.0) else 0.0
                margen_fin = 1.0 if dur_total >= (dur_min + 2.0) else 0.0

                tiempo_actual = margen_inicio
                while tiempo_actual + dur_min <= (dur_total - margen_fin + 0.1):
                    dur_toma = min(dur_max, dur_total - margen_fin - tiempo_actual)
                    if dur_toma < dur_min:
                        dur_toma = dur_min

                    entrada = round(tiempo_actual, 2)
                    salida = round(min(tiempo_actual + dur_toma, dur_total), 2)
                    duracion_real = round(salida - entrada, 2)

                    trans = self.elegir_transicion_sin_repetir()
                    cortes.append({
                        "archivo_id": archivo_id,
                        "bloque": "previa",
                        "entrada": entrada,
                        "salida": salida,
                        "duracion": duracion_real,
                        "in_sec": entrada,
                        "out_sec": salida,
                        "tipo": "transicion",
                        "transicion": trans,
                        "regla_aplicada": f"previa_personas_{hay_personas}",
                        "camara": arch.get("camara", "principal"),
                        "pista_video": 1,
                        "pista_audio": 1,
                        "volumen_audio": volumen_audio,
                    })
                    tiempo_actual = salida
                    if salida >= (dur_total - margen_fin - 0.5):
                        break
                continue

            # 3. Selección del mejor tramo cuando SÍ hay análisis
            tiene_caras = any(m.get("tiene_cara") for m in metricas)
            busca_caras = hay_personas and tiene_caras

            dur_min = dur_min_personas if busca_caras else dur_min_sin
            dur_max = dur_max_personas if busca_caras else dur_max_sin

            total_segundos = len(metricas)
            ventana_duracion = min(dur_max, max(dur_min, float(total_segundos)))

            mejor_ventana = None
            mejor_puntaje = float("inf")

            dict_seg = {int(round(m["segundo"])): m for m in metricas}
            paso_seg = int(round(ventana_duracion))
            limite_inicio = max(0, total_segundos - paso_seg + 1)

            for t_ini in range(limite_inicio):
                t_fin = t_ini + paso_seg
                tramo = [dict_seg.get(s) for s in range(t_ini, t_fin) if dict_seg.get(s) is not None]
                if len(tramo) < paso_seg:
                    continue

                hay_negro = any(s.get("es_negro") for s in tramo)
                hay_desenfoque = any((not s.get("es_negro") and s.get("desenfoque", 500.0) < 100.0) for s in tramo)
                hay_sacudida_fuerte = any(s.get("sacudida", 0.0) > 2.5 for s in tramo)

                if hay_negro or hay_desenfoque or hay_sacudida_fuerte:
                    continue

                sacudida_media = sum(s.get("sacudida", 0.0) for s in tramo) / len(tramo)

                if busca_caras:
                    caras_quietas = sum(1 for s in tramo if s.get("cara_quieta"))
                    puntaje = - (caras_quietas * 10.0) + sacudida_media
                else:
                    puntaje = sacudida_media

                if puntaje < mejor_puntaje:
                    mejor_puntaje = puntaje
                    mejor_ventana = (float(t_ini), float(t_fin))

            # Fallback si ninguna ventana fue 100% limpia
            if mejor_ventana is None:
                for t_ini in range(limite_inicio):
                    t_fin = t_ini + paso_seg
                    tramo = [dict_seg.get(s) for s in range(t_ini, t_fin) if dict_seg.get(s) is not None]
                    if len(tramo) < paso_seg:
                        continue
                    if any(s.get("es_negro") for s in tramo):
                        continue
                    sac_media = sum(s.get("sacudida", 0.0) for s in tramo) / len(tramo)
                    if sac_media < mejor_puntaje:
                        mejor_puntaje = sac_media
                        mejor_ventana = (float(t_ini), float(t_fin))

            if mejor_ventana is not None:
                ent, sal = mejor_ventana
                trans = self.elegir_transicion_sin_repetir()
                cortes.append({
                    "archivo_id": archivo_id,
                    "bloque": "previa",
                    "entrada": round(ent, 2),
                    "salida": round(sal, 2),
                    "duracion": round(sal - ent, 2),
                    "in_sec": round(ent, 2),
                    "out_sec": round(sal, 2),
                    "tipo": "transicion",
                    "transicion": trans,
                    "regla_aplicada": "previa_rostros_quietos" if busca_caras else "previa_movimiento_suave",
                    "camara": arch.get("camara", "principal"),
                    "pista_video": 1,
                    "pista_audio": 1,
                    "volumen_audio": volumen_audio,
                })
            else:
                cortes.append({
                    "archivo_id": archivo_id,
                    "bloque": "previa",
                    "entrada": 0.0,
                    "salida": 0.0,
                    "duracion": 0.0,
                    "in_sec": 0.0,
                    "out_sec": 0.0,
                    "tipo": "descartado",
                    "transicion": "ninguna",
                    "regla_aplicada": "descartado_por_defectos",
                    "camara": arch.get("camara", "principal"),
                    "pista_video": 1,
                    "pista_audio": 1,
                })

        return cortes

    def generar_pistas_vals(
        self,
        archivo_musica: Dict[str, Any],
        archivos_video: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Asegura que en el bloque de vals la música sea una sola pieza continua."""
        duracion_musica = archivo_musica.get("duracion", 180.0)

        corte_musica = {
            "archivo_id": archivo_musica.get("id"),
            "bloque": "vals",
            "entrada": 0.0,
            "salida": round(duracion_musica, 2),
            "duracion": round(duracion_musica, 2),
            "tipo": "musica_continua",
            "transicion": "ninguna",
            "regla_aplicada": "vals_musica_continua",
            "camara": "audio_master",
            "pista_video": 0,
            "pista_audio": 2,
        }

        cortes_video = []
        tiempo_video_acumulado = 0.0

        for arch in archivos_video:
            if tiempo_video_acumulado >= duracion_musica:
                break
            dur = arch.get("duracion", 30.0)
            restante = duracion_musica - tiempo_video_acumulado
            dur_a_tomar = min(dur, restante)

            cortes_video.append({
                "archivo_id": arch.get("id"),
                "bloque": "vals",
                "entrada": 0.0,
                "salida": round(dur_a_tomar, 2),
                "duracion": round(dur_a_tomar, 2),
                "tipo": "corte_directo",
                "transicion": "disolvencia",
                "regla_aplicada": "vals_video_acompanamiento",
                "camara": arch.get("camara", "principal"),
                "pista_video": 1,
                "pista_audio": 1,
            })
            tiempo_video_acumulado += dur_a_tomar

        return {
            "pista_musica": corte_musica,
            "cortes_video": cortes_video,
        }

    def generar_cortes_discursos_y_velas(
        self,
        archivo: Dict[str, Any],
        intervalos_voz: List[Tuple[float, float]],
        momentos_vela: Optional[List[float]] = None,
    ) -> List[Dict[str, Any]]:
        """Genera cortes en discursos y velas respetando estrictamente la regla de

        NUNCA cortar mientras alguien habla por micrófono.
        """
        cfg = self.cfg_edicion.get("discursos_y_velas", CONFIG_DEFECTO["edicion"]["discursos_y_velas"])
        cortar_mientras_hablan = cfg.get("cortar_mientras_hablan", False)
        margen_llegada = cfg.get("margen_antes_de_llegar_segundos", 1.5)
        duracion_pose = cfg.get("duracion_pose_segundos", 3.5)

        dur_total = archivo.get("duracion", 60.0)
        archivo_id = archivo.get("id")

        cortes = []

        if momentos_vela:
            for momento in momentos_vela:
                ent = max(0.0, momento - margen_llegada)
                sal = min(dur_total, momento + duracion_pose)

                if not cortar_mientras_hablan:
                    for v_ini, v_fin in intervalos_voz:
                        if v_ini <= ent <= v_fin:
                            ent = max(0.0, v_ini - 0.2)
                        if v_ini <= sal <= v_fin:
                            sal = min(dur_total, v_fin + 0.2)

                cortes.append({
                    "archivo_id": archivo_id,
                    "bloque": "discursos_y_velas",
                    "entrada": round(ent, 2),
                    "salida": round(sal, 2),
                    "duracion": round(sal - ent, 2),
                    "tipo": "pose_vela",
                    "transicion": "disolvencia",
                    "regla_aplicada": "pose_vela_con_margen",
                    "camara": archivo.get("camara", "principal"),
                    "pista_video": 1,
                    "pista_audio": 1,
                })
        else:
            if not intervalos_voz:
                cortes.append({
                    "archivo_id": archivo_id,
                    "bloque": "discursos_y_velas",
                    "entrada": 0.0,
                    "salida": round(dur_total, 2),
                    "duracion": round(dur_total, 2),
                    "tipo": "discurso_completo",
                    "transicion": "disolvencia",
                    "regla_aplicada": "sin_voz_detectada",
                    "camara": archivo.get("camara", "principal"),
                    "pista_video": 1,
                    "pista_audio": 1,
                })
            else:
                for v_ini, v_fin in intervalos_voz:
                    ent = max(0.0, v_ini - 0.5)
                    sal = min(dur_total, v_fin + 0.5)
                    cortes.append({
                        "archivo_id": archivo_id,
                        "bloque": "discursos_y_velas",
                        "entrada": round(ent, 2),
                        "salida": round(sal, 2),
                        "duracion": round(sal - ent, 2),
                        "tipo": "discurso_voz",
                        "transicion": "disolvencia",
                        "regla_aplicada": "respetar_microfono",
                        "camara": archivo.get("camara", "principal"),
                        "pista_video": 1,
                        "pista_audio": 1,
                    })

        return cortes

    def generar_cortes_baile_multicamara(
        self,
        archivo_principal: Dict[str, Any],
        archivo_osmo: Optional[Dict[str, Any]],
        errores_principal: Optional[List[Tuple[float, float]]] = None,
        almacen: Optional[Any] = None,
    ) -> List[Dict[str, Any]]:
        """Edición multicámara de tanda de baile.

        - Máximo 50s sin corte.
        - Si hay error en la principal (sacudida, desenfoque, negro):
          - Con Osmo: entra Osmo en Video 2.
          - Sin Osmo: se corta el tramo malo con fundido de 0,2s.
        """
        cfg = self.cfg_edicion.get("baile", CONFIG_DEFECTO["edicion"]["baile"])
        max_sin_corte = cfg.get("max_segundos_sin_corte", 50.0)
        dur_osmo_rescate = cfg.get("duracion_osmo_rescate_segundos", 5.0)

        dur_total = archivo_principal.get("duracion", 180.0)
        cortes = []

        alm = almacen or getattr(self, "almacen", None)
        tiempo_actual = 0.0

        if errores_principal is None:
            metricas_prin = []
            if "analisis" in archivo_principal and isinstance(archivo_principal["analisis"], list):
                metricas_prin = archivo_principal["analisis"]
            elif alm is not None and archivo_principal.get("id"):
                metricas_prin = alm.obtener_analisis_segundos(archivo_principal["id"])

            errores_detectados: List[Tuple[float, float]] = []
            segundos_error = [
                m["segundo"]
                for m in metricas_prin
                if m.get("es_negro")
                or m.get("sacudida", 0.0) > 2.5
                or (not m.get("es_negro") and m.get("desenfoque", 500.0) < 100.0)
            ]

            if segundos_error:
                segundos_error.sort()
                ini_err = segundos_error[0]
                prev_s = ini_err
                for s in segundos_error[1:]:
                    if s <= prev_s + 1.5:
                        prev_s = s
                    else:
                        errores_detectados.append((round(ini_err, 2), round(prev_s + 1.0, 2)))
                        ini_err = s
                        prev_s = s
                errores_detectados.append((round(ini_err, 2), round(prev_s + 1.0, 2)))

            errores = errores_detectados
        else:
            errores = errores_principal

        while tiempo_actual < dur_total:
            error_proximo = next((e for e in errores if e[0] >= tiempo_actual and e[0] < tiempo_actual + max_sin_corte), None)

            if error_proximo and archivo_osmo:
                e_ini, e_fin = error_proximo
                salida_prin = max(tiempo_actual, e_ini - 0.5)
                if salida_prin - tiempo_actual >= 1.0:
                    cortes.append({
                        "archivo_id": archivo_principal.get("id"),
                        "bloque": "baile",
                        "entrada": round(tiempo_actual, 2),
                        "salida": round(salida_prin, 2),
                        "duracion": round(salida_prin - tiempo_actual, 2),
                        "tipo": "corte_directo",
                        "transicion": "corte",
                        "regla_aplicada": "baile_principal",
                        "camara": "principal",
                        "pista_video": 1,
                        "pista_audio": 1,
                    })

                ent_osmo = max(0.0, e_ini - 0.5) if e_ini > 0.5 else 0.0
                sal_osmo = min(dur_total, e_fin + 1.0)
                dur_osmo = sal_osmo - ent_osmo
                if dur_osmo < 4.0:
                    sal_osmo = min(dur_total, ent_osmo + 4.0)

                cortes.append({
                    "archivo_id": archivo_osmo.get("id"),
                    "bloque": "baile",
                    "entrada": round(ent_osmo, 2),
                    "salida": round(sal_osmo, 2),
                    "duracion": round(sal_osmo - ent_osmo, 2),
                    "tipo": "osmo_rescate",
                    "transicion": "corte",
                    "regla_aplicada": "rescate_error_principal",
                    "camara": "osmo",
                    "pista_video": 2,
                    "pista_audio": 1,
                })
                tiempo_actual = sal_osmo
            elif error_proximo and not archivo_osmo:
                e_ini, e_fin = error_proximo
                salida_prin = max(tiempo_actual, e_ini - 0.2)
                if salida_prin - tiempo_actual >= 1.0:
                    cortes.append({
                        "archivo_id": archivo_principal.get("id"),
                        "bloque": "baile",
                        "entrada": round(tiempo_actual, 2),
                        "salida": round(salida_prin, 2),
                        "duracion": round(salida_prin - tiempo_actual, 2),
                        "tipo": "corte_directo",
                        "transicion": "fundido",
                        "duracion_transicion": 0.2,
                        "regla_aplicada": "corte_defecto_sin_osmo",
                        "camara": "principal",
                        "pista_video": 1,
                        "pista_audio": 1,
                    })
                tiempo_actual = min(dur_total, e_fin + 0.2)
            else:
                salida_prin = min(dur_total, tiempo_actual + max_sin_corte)
                if salida_prin - tiempo_actual >= 1.0:
                    cortes.append({
                        "archivo_id": archivo_principal.get("id"),
                        "bloque": "baile",
                        "entrada": round(tiempo_actual, 2),
                        "salida": round(salida_prin, 2),
                        "duracion": round(salida_prin - tiempo_actual, 2),
                        "tipo": "corte_directo",
                        "transicion": "corte",
                        "regla_aplicada": "baile_principal_ritmo",
                        "camara": "principal",
                        "pista_video": 1,
                        "pista_audio": 1,
                    })
                tiempo_actual = salida_prin

                if tiempo_actual < dur_total and archivo_osmo:
                    sal_osmo = min(dur_total, tiempo_actual + dur_osmo_rescate)
                    if sal_osmo - tiempo_actual >= 1.0:
                        cortes.append({
                            "archivo_id": archivo_osmo.get("id"),
                            "bloque": "baile",
                            "entrada": round(tiempo_actual, 2),
                            "salida": round(sal_osmo, 2),
                            "duracion": round(sal_osmo - tiempo_actual, 2),
                            "tipo": "osmo_dinamismo",
                            "transicion": "corte",
                            "regla_aplicada": "baile_dinamismo_osmo",
                            "camara": "osmo",
                            "pista_video": 2,
                            "pista_audio": 1,
                        })
                    tiempo_actual = sal_osmo

        return cortes

    def generar_cortes_pose(
        self,
        archivo: Dict[str, Any],
        metricas: Optional[List[Dict[str, Any]]] = None,
        almacen: Optional[Any] = None,
        tipo: str = "pose",
    ) -> List[Dict[str, Any]]:
        """Regla 'la pose' para previa, recepción, firmas y fotos con la torta.

        - Busca tramos con caras quietas y cámara quieta.
        - Se queda con poses de 3 a 6 s, empezando 0,3 s después de quedarse quietos.
        - Corta entrada y salida (cuando se mueven o se van).
        - Si la cara se mueve todo el tiempo, no hay corte de pose.
        - Para firmas en libro: tramo de menos movimiento de 3 a 5 s.
        """
        alm = almacen or getattr(self, "almacen", None)
        archivo_id = archivo.get("id")
        dur_total = float(archivo.get("duracion", 10.0))

        if metricas is None:
            if "analisis" in archivo and isinstance(archivo["analisis"], list):
                metricas = archivo["analisis"]
            elif alm is not None and archivo_id:
                metricas = alm.obtener_analisis_segundos(archivo_id)
            else:
                metricas = []

        if not metricas:
            return []

        cortes: List[Dict[str, Any]] = []

        if tipo == "firmas":
            dur_objetivo = 4.0
            n_seg = len(metricas)
            ventana = int(min(dur_objetivo, n_seg))
            if ventana < 3:
                return []
            mejor_inicio = 0
            menor_movimiento = float("inf")
            for i in range(n_seg - ventana + 1):
                tramo = metricas[i : i + ventana]
                mov = sum(m.get("sacudida", 0.0) for m in tramo)
                if mov < menor_movimiento:
                    menor_movimiento = mov
                    mejor_inicio = i
            ent = float(mejor_inicio)
            sal = float(mejor_inicio + ventana)
            cortes.append({
                "archivo_id": archivo_id,
                "bloque": archivo.get("bloque", "previa"),
                "entrada": round(ent, 2),
                "salida": round(sal, 2),
                "duracion": round(sal - ent, 2),
                "tipo": "pose_firmas",
                "transicion": "disolvencia",
                "regla_aplicada": "pose_libro_firmas",
                "camara": archivo.get("camara", "principal"),
                "pista_video": 1,
                "pista_audio": 1,
            })
            return cortes

        segundos_quietos = []
        for m in metricas:
            s = float(m["segundo"])
            tiene_cara = bool(m.get("tiene_cara"))
            cara_quieta = bool(m.get("cara_quieta"))
            sacudida = float(m.get("sacudida", 0.0))
            es_negro = bool(m.get("es_negro"))

            if tiene_cara and cara_quieta and sacudida < 2.0 and not es_negro:
                segundos_quietos.append(s)

        if not segundos_quietos:
            return []

        intervalos: List[Tuple[float, float]] = []
        segundos_quietos.sort()

        ini = segundos_quietos[0]
        prev = ini
        for s in segundos_quietos[1:]:
            if s <= prev + 1.2:
                prev = s
            else:
                intervalos.append((ini, prev + 1.0))
                ini = s
                prev = s
        intervalos.append((ini, prev + 1.0))

        for t_ini, t_fin in intervalos:
            dur_intervalo = t_fin - t_ini
            if dur_intervalo >= 3.0:
                ent = round(t_ini + 0.3, 2)
                dur_pose = min(6.0, max(3.0, dur_intervalo - 0.3))
                sal = round(min(t_fin, ent + dur_pose), 2)

                if sal > ent:
                    cortes.append({
                        "archivo_id": archivo_id,
                        "bloque": archivo.get("bloque", "previa"),
                        "entrada": ent,
                        "salida": sal,
                        "duracion": round(sal - ent, 2),
                        "tipo": "pose",
                        "transicion": self.elegir_transicion_sin_repetir(),
                        "regla_aplicada": "pose_rostros_quietos",
                        "camara": archivo.get("camara", "principal"),
                        "pista_video": 1,
                        "pista_audio": 1,
                    })

                    if alm is not None and archivo_id:
                        if ent > 0.5:
                            alm.agregar_aviso_revision({
                                "tipo_aviso": "pose_recorte_entrada",
                                "archivo_id": archivo_id,
                                "segundo_inicio": 0.0,
                                "segundo_fin": ent,
                                "severidad": "info",
                                "descripcion": f"Se recortaron {ent:.1f}s iniciales de movimiento al acomodarse",
                            })
                        if dur_total - sal > 0.5:
                            alm.agregar_aviso_revision({
                                "tipo_aviso": "pose_recorte_salida",
                                "archivo_id": archivo_id,
                                "segundo_inicio": sal,
                                "segundo_fin": dur_total,
                                "severidad": "info",
                                "descripcion": f"Se recortaron {dur_total - sal:.1f}s finales al retirarse",
                            })

        return cortes


def aprender_de_mis_videos(
    rutas_videos: List[str],
    config_actual: Optional[Dict[str, Any]] = None,
    almacen: Optional[Any] = None,
) -> Dict[str, Any]:
    """Analiza videos terminados del dueño y propone parámetros para config.yaml.

    Detecta cambios de escena/cortes con OpenCV, mide duración de tomas,
    frecuencia de transiciones y propone valores de edición sin aplicarlos automáticamente.
    """
    cfg_base = config_actual or cargar_configuracion()
    duraciones_tomas: List[float] = []

    for ruta in rutas_videos:
        if not os.path.exists(ruta):
            continue

        cap = cv2.VideoCapture(ruta)
        if not cap.isOpened():
            continue

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duracion_video = total_frames / fps if total_frames > 0 else 0.0

        salto = max(1, int(round(fps / 5.0)))  # 5 muestras por segundo
        cortes_detectados = [0.0]

        prev_frame_peque = None
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            if frame_idx % salto != 0:
                frame_idx += 1
                continue

            seg = frame_idx / fps
            peque = cv2.resize(frame, (80, 45), interpolation=cv2.INTER_AREA)

            if prev_frame_peque is not None:
                dif = float(np.mean(np.abs(peque.astype(np.float32) - prev_frame_peque.astype(np.float32))))
                if dif > 30.0:
                    if seg - cortes_detectados[-1] >= 1.0:
                        cortes_detectados.append(round(seg, 2))

            prev_frame_peque = peque
            frame_idx += 1

        cap.release()

        if duracion_video > cortes_detectados[-1] + 1.0:
            cortes_detectados.append(round(duracion_video, 2))

        for i in range(1, len(cortes_detectados)):
            dur_toma = cortes_detectados[i] - cortes_detectados[i - 1]
            if dur_toma >= 0.8:
                duraciones_tomas.append(dur_toma)

    if duraciones_tomas:
        media_toma = float(np.mean(duraciones_tomas))
    else:
        media_toma = 4.0

    media_toma_redondeada = round(media_toma, 1)

    propuesta = {
        "duracion_toma_promedio": media_toma_redondeada,
        "total_tomas_analizadas": len(duraciones_tomas),
        "propuesta_config": {
            "edicion": {
                "previa": {
                    "duracion_min_segundos_con_personas": round(max(2.0, media_toma_redondeada - 1.0), 1),
                    "duracion_max_segundos_con_personas": round(media_toma_redondeada + 1.5, 1),
                },
                "discursos_y_velas": {
                    "duracion_pose_segundos": media_toma_redondeada,
                },
                "baile": {
                    "duracion_min_corte_segundos": round(max(2.0, media_toma_redondeada - 1.0), 1),
                    "duracion_max_corte_segundos": round(media_toma_redondeada + 2.5, 1),
                },
            }
        },
        "antes": cfg_base,
    }

    if almacen is not None:
        almacen.guardar_preferencia("aprendizaje_videos_propuesta", propuesta)

    return propuesta
