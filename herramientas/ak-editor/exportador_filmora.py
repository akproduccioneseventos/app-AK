# -*- coding: utf-8 -*-
"""Módulo de exportación XML Final Cut Pro 7 (XMEML) compatible con Filmora 16.

Genera una línea de tiempo con 4 pistas:
- Video 1: Cámara principal
- Video 2: Osmo de rescate / planos secundarios
- Video 3: Logo AK PNG con margen del 4%
- Audio 1: Audio original de las cámaras
- Audio 2: Música continua de fondo
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


def exportar_timeline_filmora(
    cortes: List[Dict[str, Any]],
    ruta_destino_xml: str,
    nombre_secuencia: str = "AK Producciones - Edicion Inteligente",
    fps: int = 30,
    ruta_logo_ak: Optional[str] = None,
) -> str:
    """Genera un archivo XML Final Cut Pro 7 (XMEML) con las 4 pistas organizadas."""
    xmeml = ET.Element("xmeml", version="5")
    secuencia = ET.SubElement(xmeml, "sequence")
    ET.SubElement(secuencia, "name").text = nombre_secuencia

    rate = ET.SubElement(secuencia, "rate")
    ET.SubElement(rate, "timebase").text = str(fps)
    ET.SubElement(rate, "ntsc").text = "FALSE"

    # Duración total calculada a partir de los cortes
    duracion_total_seg = max([c["salida"] for c in cortes], default=60.0)
    duracion_total_frames = int(duracion_total_seg * fps)
    ET.SubElement(secuencia, "duration").text = str(duracion_total_frames)

    media = ET.SubElement(secuencia, "media")
    video = ET.SubElement(media, "video")
    audio = ET.SubElement(media, "audio")

    # Crear 3 pistas de Video:
    # 1: Principal
    # 2: Osmo
    # 3: Logo AK
    pista_v1 = ET.SubElement(video, "track")
    pista_v2 = ET.SubElement(video, "track")
    pista_v3 = ET.SubElement(video, "track")

    # Crear 2 pistas de Audio:
    # 1: Audio original/ambiente
    # 2: Música continua
    pista_a1 = ET.SubElement(audio, "track")
    pista_a2 = ET.SubElement(audio, "track")

    # Mapear cortes en las pistas
    frame_acumulado_v1 = 0
    frame_acumulado_v2 = 0
    frame_acumulado_a1 = 0
    frame_acumulado_a2 = 0

    for c in cortes:
        ruta = c.get("archivo_ruta") or c.get("ruta", "clip.mp4")
        nom = c.get("archivo_nombre") or os.path.basename(ruta)
        dur = c.get("duracion", max(0.1, c["salida"] - c["entrada"]))
        frames_dur = max(1, int(dur * fps))
        frame_in = int(c["entrada"] * fps)
        frame_out = frame_in + frames_dur

        pista_vid = c.get("pista_video", 1)
        pista_aud = c.get("pista_audio", 1)
        volumen = c.get("volumen_audio", 1.0)

        # Video
        if pista_vid == 1:
            clip_v = crear_nodo_clip(
                nom, ruta, frame_in, frame_out, frame_acumulado_v1, frame_acumulado_v1 + frames_dur, fps
            )
            pista_v1.append(clip_v)
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

    # Pista 3: Logo AK con margen 4%
    if ruta_logo_ak and os.path.exists(ruta_logo_ak):
        clip_logo = crear_nodo_clip(
            "Logo AK", ruta_logo_ak, 0, duracion_total_frames, 0, duracion_total_frames, fps
        )
        pista_v3.append(clip_logo)

    # Formatear XML con sangría
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

    el logo AK y música continua para validar importación en Filmora.
    """
    cortes_muestra = [
        {
            "archivo_ruta": "C:/AK_Videos/prueba_cam1.mp4",
            "archivo_nombre": "prueba_cam1.mp4",
            "entrada": 0.0,
            "salida": 5.0,
            "duracion": 5.0,
            "pista_video": 1,
            "pista_audio": 1,
            "volumen_audio": 1.0,
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
        },
    ]

    return exportar_timeline_filmora(
        cortes=cortes_muestra,
        ruta_destino_xml=ruta_destino_xml,
        nombre_secuencia="AK Editor - Prueba de Importacion Filmora 16",
        fps=30,
        ruta_logo_ak=ruta_logo_ak,
    )
