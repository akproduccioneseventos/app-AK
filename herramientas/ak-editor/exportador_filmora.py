# -*- coding: utf-8 -*-
"""Módulo de exportación XML Final Cut Pro 7 (XMEML) compatible con Filmora 16.

Genera una línea de tiempo con 4 pistas:
- Video 1: Cámara principal, intro de AK, intro con nombre y clips finales
- Video 2: Osmo de rescate / planos secundarios
- Video 3: Logo AK PNG con margen del 4% (de punta a punta menos sobre la intro de AK)
- Audio 1: Audio original de las cámaras
- Audio 2: Música continua de fondo
Soporta:
- transitionitem ('Cross Dissolve') de Filmora
- Clips de transición ya hechos (xfade)
- intro_nombre (segundo clip después de intro_ak y al final)
"""

from __future__ import annotations

import os
import urllib.parse
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional
from xml.dom import minidom


def ruta_a_url_file(ruta: str) -> str:
    """Convierte una ruta de archivo local en URL file:// válida para XMEML."""
    ruta_abs = os.path.abspath(ruta).replace("\\", "/")
    if not ruta_abs.startswith("/"):
        ruta_abs = "/" + ruta_abs
    return "file://localhost" + urllib.parse.quote(ruta_abs)


def crear_nodo_clip(
    nombre_clip: str,
    ruta_archivo: str,
    frame_in: int,
    frame_out: int,
    frame_start: int,
    frame_end: int,
    fps: int = 30,
    es_audio: bool = False,
    volumen: float = 1.0,
) -> ET.Element:
    """Crea un elemento <clipitem> compatible con XMEML."""
    clip = ET.Element("clipitem")
    ET.SubElement(clip, "name").text = nombre_clip
    ET.SubElement(clip, "in").text = str(frame_in)
    ET.SubElement(clip, "out").text = str(frame_out)
    ET.SubElement(clip, "start").text = str(frame_start)
    ET.SubElement(clip, "end").text = str(frame_end)

    rate = ET.SubElement(clip, "rate")
    ET.SubElement(rate, "timebase").text = str(fps)
    ET.SubElement(rate, "ntsc").text = "FALSE"

    file_elem = ET.SubElement(clip, "file", id=f"file-{os.path.basename(ruta_archivo)}")
    ET.SubElement(file_elem, "name").text = os.path.basename(ruta_archivo)
    ET.SubElement(file_elem, "pathurl").text = ruta_a_url_file(ruta_archivo)

    rate_file = ET.SubElement(file_elem, "rate")
    ET.SubElement(rate_file, "timebase").text = str(fps)
    ET.SubElement(rate_file, "ntsc").text = "FALSE"

    ET.SubElement(file_elem, "duration").text = str(max(frame_out, 1000))

    if volumen != 1.0:
        filter_elem = ET.SubElement(clip, "filter")
        effect_elem = ET.SubElement(filter_elem, "effect")
        ET.SubElement(effect_elem, "name").text = "Audio Volume"
        param = ET.SubElement(effect_elem, "parameter")
        ET.SubElement(param, "name").text = "Level"
        ET.SubElement(param, "value").text = str(round(volumen, 3))

    return clip


def crear_nodo_transicion(
    nombre_transicion: str = "Cross Dissolve",
    frame_start: int = 0,
    frame_end: int = 30,
    fps: int = 30,
) -> ET.Element:
    """Crea un elemento <transitionitem> compatible con Filmora 16."""
    trans = ET.Element("transitionitem")
    ET.SubElement(trans, "name").text = nombre_transicion
    ET.SubElement(trans, "start").text = str(frame_start)
    ET.SubElement(trans, "end").text = str(frame_end)
    ET.SubElement(trans, "alignment").text = "center"

    rate = ET.SubElement(trans, "rate")
    ET.SubElement(rate, "timebase").text = str(fps)
    ET.SubElement(rate, "ntsc").text = "FALSE"

    effect = ET.SubElement(trans, "effect")
    ET.SubElement(effect, "name").text = nombre_transicion
    ET.SubElement(effect, "effectid").text = nombre_transicion
    ET.SubElement(effect, "effecttype").text = "transition"
    ET.SubElement(effect, "mediatype").text = "video"
    return trans


def exportar_timeline_filmora(
    cortes: List[Dict[str, Any]],
    ruta_destino_xml: str,
    nombre_secuencia: str = "AK Producciones - Edicion Inteligente",
    fps: int = 30,
    ruta_logo_ak: Optional[str] = None,
    ruta_intro_ak: Optional[str] = None,
    ruta_intro_nombre: Optional[str] = None,
    modo_transiciones: str = "filmora",  # 'filmora' (transitionitem) o 'clips' (xfade)
) -> str:
    """Genera un archivo XML Final Cut Pro 7 (XMEML) con las 4 pistas organizadas.

    Soporta:
    - intro_nombre (segundo clip después de intro_ak y otra vez al final)
    - logo AK en pista 3 excepto sobre intro_ak
    - transitionitem 'Cross Dissolve' entre clips
    """
    xmeml = ET.Element("xmeml", version="5")
    secuencia = ET.SubElement(xmeml, "sequence")
    ET.SubElement(secuencia, "name").text = nombre_secuencia

    rate = ET.SubElement(secuencia, "rate")
    ET.SubElement(rate, "timebase").text = str(fps)
    ET.SubElement(rate, "ntsc").text = "FALSE"

    # Preparar cortes completos si se pasaron intros
    cortes_procesados = list(cortes)
    duracion_intro_ak_seg = 0.0

    if ruta_intro_ak and os.path.exists(ruta_intro_ak):
        dur_ak = 5.0
        duracion_intro_ak_seg = dur_ak
        cortes_procesados.insert(0, {
            "archivo_ruta": ruta_intro_ak,
            "archivo_nombre": os.path.basename(ruta_intro_ak),
            "entrada": 0.0,
            "salida": dur_ak,
            "duracion": dur_ak,
            "pista_video": 1,
            "pista_audio": 1,
            "bloque": "marca_ak",
        })

    if ruta_intro_nombre and os.path.exists(ruta_intro_nombre):
        dur_nom = 6.0
        idx_insert = 1 if duracion_intro_ak_seg > 0 else 0
        # Segundo clip
        cortes_procesados.insert(idx_insert, {
            "archivo_ruta": ruta_intro_nombre,
            "archivo_nombre": os.path.basename(ruta_intro_nombre),
            "entrada": 0.0,
            "salida": dur_nom,
            "duracion": dur_nom,
            "pista_video": 1,
            "pista_audio": 1,
            "bloque": "intro_nombre",
        })
        # Y al final
        cortes_procesados.append({
            "archivo_ruta": ruta_intro_nombre,
            "archivo_nombre": os.path.basename(ruta_intro_nombre),
            "entrada": 0.0,
            "salida": dur_nom,
            "duracion": dur_nom,
            "pista_video": 1,
            "pista_audio": 1,
            "bloque": "intro_nombre",
        })

    media = ET.SubElement(secuencia, "media")
    video = ET.SubElement(media, "video")
    audio = ET.SubElement(media, "audio")

    # 3 pistas de Video
    pista_v1 = ET.SubElement(video, "track")
    pista_v2 = ET.SubElement(video, "track")
    pista_v3 = ET.SubElement(video, "track")

    # 2 pistas de Audio
    pista_a1 = ET.SubElement(audio, "track")
    pista_a2 = ET.SubElement(audio, "track")

    frame_acumulado_v1 = 0
    frame_acumulado_v2 = 0
    frame_acumulado_a1 = 0
    frame_acumulado_a2 = 0

    duracion_transicion_frames = int(1.0 * fps)

    for i, c in enumerate(cortes_procesados):
        ruta = c.get("archivo_ruta") or c.get("ruta", "clip.mp4")
        nom = c.get("archivo_nombre") or os.path.basename(ruta)
        dur = c.get("duracion", max(0.1, c.get("salida", 5.0) - c.get("entrada", 0.0)))
        frames_dur = max(1, int(dur * fps))
        frame_in = int(c.get("entrada", 0.0) * fps)
        frame_out = frame_in + frames_dur

        pista_vid = c.get("pista_video", 1)
        pista_aud = c.get("pista_audio", 1)
        volumen = c.get("volumen_audio", 1.0)
        tipo = c.get("tipo", "corte_directo")

        # Video
        if pista_vid == 1:
            clip_v = crear_nodo_clip(
                nom, ruta, frame_in, frame_out, frame_acumulado_v1, frame_acumulado_v1 + frames_dur, fps
            )
            pista_v1.append(clip_v)

            # Insertar transitionitem en XMEML si corresponde
            if modo_transiciones == "filmora" and i > 0 and c.get("transicion") not in ("ninguna", "corte"):
                t_ini = max(0, frame_acumulado_v1 - duracion_transicion_frames // 2)
                t_fin = t_ini + duracion_transicion_frames
                trans_elem = crear_nodo_transicion("Cross Dissolve", t_ini, t_fin, fps)
                pista_v1.append(trans_elem)

            frame_acumulado_v1 += frames_dur
        elif pista_vid == 2:
            clip_v = crear_nodo_clip(
                f"[Osmo] {nom}", ruta, frame_in, frame_out, frame_acumulado_v2, frame_acumulado_v2 + frames_dur, fps
            )
            pista_v2.append(clip_v)
            frame_acumulado_v2 += frames_dur

        # Audio
        if pista_aud == 1 and pista_vid != 0:
            clip_a = crear_nodo_clip(
                f"[Audio Cam] {nom}", ruta, frame_in, frame_out, frame_acumulado_a1, frame_acumulado_a1 + frames_dur, fps, es_audio=True, volumen=volumen
            )
            pista_a1.append(clip_a)
            frame_acumulado_a1 += frames_dur
        elif pista_aud == 2:
            clip_a = crear_nodo_clip(
                f"[Música] {nom}", ruta, frame_in, frame_out, frame_acumulado_a2, frame_acumulado_a2 + frames_dur, fps, es_audio=True, volumen=volumen
            )
            pista_a2.append(clip_a)
            frame_acumulado_a2 += frames_dur

    duracion_total_frames = max(frame_acumulado_v1, frame_acumulado_v2, frame_acumulado_a1, frame_acumulado_a2, 30)
    ET.SubElement(secuencia, "duration").text = str(duracion_total_frames)

    # Pista 3: Logo AK de punta a punta menos sobre la intro de AK
    if ruta_logo_ak and os.path.exists(ruta_logo_ak):
        frame_inicio_logo = int(duracion_intro_ak_seg * fps)
        dur_logo_frames = max(30, duracion_total_frames - frame_inicio_logo)
        clip_logo = crear_nodo_clip(
            "Logo AK", ruta_logo_ak, 0, dur_logo_frames, frame_inicio_logo, duracion_total_frames, fps
        )
        pista_v3.append(clip_logo)

    xml_str = ET.tostring(xmeml, encoding="utf-8")
    reparsed = minidom.parseString(xml_str)
    xml_bonito = reparsed.toprettyxml(indent="  ", encoding="utf-8").decode("utf-8")

    carpeta_padre = os.path.dirname(ruta_destino_xml)
    if carpeta_padre:
        os.makedirs(carpeta_padre, exist_ok=True)

    with open(ruta_destino_xml, "w", encoding="utf-8") as f:
        f.write(xml_bonito)

    return ruta_destino_xml


def generar_xml_prueba(ruta_destino_xml: str, ruta_logo_ak: Optional[str] = None) -> str:
    """Genera un XML de prueba para Filmora 16 con dos clips, un corte,

    el logo AK, música continua, intro_nombre y una transición para validar Filmora 16.
    """
    cortes_muestra = [
        {
            "archivo_ruta": "C:/AK_Videos/prueba_intro_nombre.mp4",
            "archivo_nombre": "intro_nombre.mp4",
            "entrada": 0.0,
            "salida": 6.0,
            "duracion": 6.0,
            "pista_video": 1,
            "pista_audio": 1,
            "volumen_audio": 1.0,
            "bloque": "intro_nombre",
        },
        {
            "archivo_ruta": "C:/AK_Videos/prueba_cam1.mp4",
            "archivo_nombre": "prueba_cam1.mp4",
            "entrada": 0.0,
            "salida": 5.0,
            "duracion": 5.0,
            "pista_video": 1,
            "pista_audio": 1,
            "volumen_audio": 1.0,
            "transicion": "disolvencia",
            "bloque": "previa",
        },
        {
            "archivo_ruta": "C:/AK_Videos/transicion_corte.mp4",
            "archivo_nombre": "transicion_xfade.mp4",
            "entrada": 0.0,
            "salida": 1.0,
            "duracion": 1.0,
            "pista_video": 1,
            "pista_audio": 1,
            "volumen_audio": 0.5,
            "tipo": "transicion_hecha",
            "bloque": "previa",
        },
        {
            "archivo_ruta": "C:/AK_Videos/prueba_cam2_osmo.mp4",
            "archivo_nombre": "prueba_cam2_osmo.mp4",
            "entrada": 0.0,
            "salida": 4.0,
            "duracion": 4.0,
            "pista_video": 2,
            "pista_audio": 1,
            "volumen_audio": 0.5,
            "bloque": "baile",
        },
        {
            "archivo_ruta": "C:/AK_Videos/musica_vals.mp3",
            "archivo_nombre": "musica_vals.mp3",
            "entrada": 0.0,
            "salida": 15.0,
            "duracion": 15.0,
            "pista_video": 0,
            "pista_audio": 2,
            "volumen_audio": 0.8,
            "bloque": "vals",
        },
    ]

    return exportar_timeline_filmora(
        cortes=cortes_muestra,
        ruta_destino_xml=ruta_destino_xml,
        nombre_secuencia="AK Editor - Prueba de Importacion Filmora 16",
        fps=30,
        ruta_logo_ak=ruta_logo_ak,
        modo_transiciones="filmora",
    )
