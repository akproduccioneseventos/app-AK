# -*- coding: utf-8 -*-
"""Módulo de reglas de edición para AK Editor Inteligente.

Aplica las reglas configuradas en config.yaml para cada bloque de la fiesta:
- Previa (rotación de transiciones sin repetir consecutivas)
- Entrada (ducking de música con voz de locutor)
- Vals (música continua sin interrupciones)
- Baile multicámara (cámara principal + Osmo de rescate ante errores)
- Discursos y velas (nunca cortar mientras hablan por micrófono)
- Marca AK (márgenes y posición del logo)
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional, Tuple
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

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or cargar_configuracion()
        self.cfg_edicion = self.config.get("edicion", CONFIG_DEFECTO["edicion"])
        self._ultima_transicion = ""

    def elegir_transicion_sin_repetir(self) -> str:
        """Elige una transición de la lista asegurando que NUNCA sea idéntica a la anterior."""
        candidatos = [t for t in TRANSICIONES_PREVIA if t != self._ultima_transicion]
        # Selección determinista rotativa
        elegida = candidatos[0] if candidatos else TRANSICIONES_PREVIA[0]
        # Rotar la lista para la próxima
        TRANSICIONES_PREVIA.append(TRANSICIONES_PREVIA.pop(0))
        self._ultima_transicion = elegida
        return elegida

    def generar_cortes_previa(
        self,
        archivos: List[Dict[str, Any]],
        hay_personas: bool = True,
    ) -> List[Dict[str, Any]]:
        """Genera cortes para la previa con duraciones cuidadas y transiciones alternadas."""
        cfg = self.cfg_edicion.get("previa", CONFIG_DEFECTO["edicion"]["previa"])
        dur_min = (
            cfg.get("duracion_min_segundos_con_personas", 3.5)
            if hay_personas
            else cfg.get("duracion_min_segundos_sin_personas", 3.0)
        )
        dur_max = (
            cfg.get("duracion_max_segundos_con_personas", 6.0)
            if hay_personas
            else cfg.get("duracion_max_segundos_sin_personas", 5.0)
        )
        volumen_audio = cfg.get("volumen_audio_ambiente", 0.05)

        cortes = []
        for arch in archivos:
            dur_total = arch.get("duracion", 10.0)
            archivo_id = arch.get("id")

            # Quitar sacudida inicial (1.0s) y final (1.0s) si hay suficiente duración
            margen_inicio = 1.0 if dur_total >= (dur_min + 2.0) else 0.0
            margen_fin = 1.0 if dur_total >= (dur_min + 2.0) else 0.0
            tiempo_util = max(dur_total - margen_inicio - margen_fin, dur_min)

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

        return cortes

    def generar_pistas_vals(
        self,
        archivo_musica: Dict[str, Any],
        archivos_video: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Asegura que en el bloque de vals la música sea una sola pieza continua."""
        duracion_musica = archivo_musica.get("duracion", 180.0)

        # Pista de audio del vals: un único bloque continuo
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

        # Pistas de video del vals
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
            # Procesar momentos de velas
            for momento in momentos_vela:
                ent = max(0.0, momento - margen_llegada)
                sal = min(dur_total, momento + duracion_pose)

                # Si no se puede cortar mientras hablan, expandir si se superpone con voz
                if not cortar_mientras_hablan:
                    for v_ini, v_fin in intervalos_voz:
                        # Si ent cae adentro del intervalo de voz, mover ent al inicio de la voz
                        if v_ini <= ent <= v_fin:
                            ent = max(0.0, v_ini - 0.2)
                        # Si sal cae adentro del intervalo de voz, mover sal al fin de la voz
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
            # Si no hay lista de velas sino un discurso corrido:
            # Conservar íntegros todos los tramos de voz con un margen de 0.5s
            if not intervalos_voz:
                # No hay voz: corte completo
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
    ) -> List[Dict[str, Any]]:
        """Edición multicámara de tanda de baile.

        - Máximo 50s sin corte.
        - Si hay error en la principal (sacudida, desenfoque), entra Osmo en Video 2.
        """
        cfg = self.cfg_edicion.get("baile", CONFIG_DEFECTO["edicion"]["baile"])
        max_sin_corte = cfg.get("max_segundos_sin_corte", 50.0)
        dur_osmo_rescate = cfg.get("duracion_osmo_rescate_segundos", 5.0)

        dur_total = archivo_principal.get("duracion", 180.0)
        cortes = []

        tiempo_actual = 0.0
        errores = errores_principal or []

        while tiempo_actual < dur_total:
            # Revisar si hay un error próximo
            error_proximo = next((e for e in errores if e[0] >= tiempo_actual and e[0] < tiempo_actual + max_sin_corte), None)

            if error_proximo and archivo_osmo:
                e_ini, e_fin = error_proximo
                # Tomar toma principal hasta 0.5s antes del error
                salida_prin = max(tiempo_actual, e_ini - 0.5)
                if salida_prin > tiempo_actual:
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

                # Insertar Osmo para cubrir error (pista video 2)
                ent_osmo = max(0.0, e_ini - 0.5)
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
            else:
                # Si no hay errores, cortar cada max_sin_corte con un toque de Osmo si existe
                salida_prin = min(dur_total, tiempo_actual + max_sin_corte)
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

                # Si todavía queda video y tenemos Osmo, meter 5s de Osmo para dinamismo
                if tiempo_actual < dur_total and archivo_osmo:
                    sal_osmo = min(dur_total, tiempo_actual + dur_osmo_rescate)
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
