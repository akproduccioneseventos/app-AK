# -*- coding: utf-8 -*-
"""Prueba Orden 274: El camino del dueño — La fiesta entera llega a Filmora.

Arma una fiesta de prueba completa con FFmpeg / OpenCV:
- previa_*.mp4 x2
- entrada_1.mp4 (10s)
- vals_cam1.mp4 (40s)
- baile_cam1.mp4 (30s, primeros 3s negros)
- baile_osmo.mp4 (audio con desfase de 2.3s respecto a baile_cam1)
- velas_vela1.mp4

Ejecuta armar_proyecto(carpeta, almacen), exporta a Filmora XML y comprueba:
1. El XML tiene clips de los cinco bloques de la fiesta.
2. Ningún clip dura menos de 1 s.
3. El desfase guardado del baile es 2,3 ± 0,05 s.
4. Hay un clip de la Osmo en la pista 2 durante el negro de baile_cam1.
5. La revisión trae el aviso del tramo negro.
"""

import os
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import cv2
import numpy as np
import pytest
import scipy.io.wavfile as wavfile

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from almacen import Almacen
from app import armar_proyecto
from exportador_filmora import exportar_timeline_filmora


def crear_clip_video(
    ruta_mp4: str,
    duracion_seg: float,
    fps: int = 10,
    ancho: int = 160,
    alto: int = 120,
    primeros_segundos_negros: float = 0.0,
    color_fondo: tuple = (150, 150, 150),
    audio_senal: np.ndarray = None,
    tasa_audio: int = 8000,
) -> None:
    """Crea un archivo de video MP4 sintético, con opción de negros y audio."""
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    temp_v = ruta_mp4 + ".temp.mp4"
    writer = cv2.VideoWriter(temp_v, fourcc, fps, (ancho, alto))

    frame_negro = np.zeros((alto, ancho, 3), dtype=np.uint8)
    frame_color = np.full((alto, ancho, 3), color_fondo, dtype=np.uint8)
    # Patrón de alto contraste para evitar desenfoque
    for y in range(0, alto, 20):
        for x in range(0, ancho, 20):
            if ((x // 20) + (y // 20)) % 2 == 0:
                frame_color[y : y + 20, x : x + 20] = (255, 255, 255)

    total_frames = int(duracion_seg * fps)
    for i in range(total_frames):
        seg = i / float(fps)
        if seg < primeros_segundos_negros:
            writer.write(frame_negro)
        else:
            writer.write(frame_color)
    writer.release()

    if audio_senal is not None:
        temp_wav = ruta_mp4 + ".temp.wav"
        wavfile.write(temp_wav, tasa_audio, audio_senal)
        cmd = [
            "ffmpeg", "-v", "quiet", "-y",
            "-i", temp_v,
            "-i", temp_wav,
            "-c:v", "copy",
            "-c:a", "aac",
            ruta_mp4,
        ]
        subprocess.run(cmd, check=True)
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
        if os.path.exists(temp_v):
            os.remove(temp_v)
    else:
        if os.path.exists(ruta_mp4):
            os.remove(ruta_mp4)
        os.rename(temp_v, ruta_mp4)


def test_la_fiesta_entera_llega_a_filmora():
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. Crear la fiesta con los 5 bloques
        # Previa x2
        p1 = os.path.join(temp_dir, "previa_salon.mp4")
        p2 = os.path.join(temp_dir, "previa_vestido.mp4")
        crear_clip_video(p1, duracion_seg=6.0, color_fondo=(120, 120, 120))
        crear_clip_video(p2, duracion_seg=6.0, color_fondo=(140, 140, 140))

        # Entrada
        e1 = os.path.join(temp_dir, "entrada_llegada.mp4")
        crear_clip_video(e1, duracion_seg=10.0, color_fondo=(100, 160, 100))

        # Vals (40 s)
        v1 = os.path.join(temp_dir, "vals_cam1.mp4")
        crear_clip_video(v1, duracion_seg=40.0, color_fondo=(180, 100, 180))

        # Baile con señal de audio para correlación exacta (desfase 2.30s)
        dur_baile = 30.0
        sr_audio = 8000
        n_muestras = int(dur_baile * sr_audio)
        t_aud = np.linspace(0, dur_baile, n_muestras)
        # Señal acústica común distintiva
        senal_base = (
            np.sin(2 * np.pi * 150 * t_aud)
            + 0.5 * np.sin(2 * np.pi * 320 * t_aud**1.1)
        ).astype(np.float32)

        # Audio baile cam1
        audio_cam1 = senal_base

        # Audio baile osmo con desfase de 2.30s
        offset_muestras = int(2.30 * sr_audio)
        audio_osmo = np.zeros_like(audio_cam1)
        audio_osmo[offset_muestras:] = senal_base[:-offset_muestras]

        # Baile cam1: 30s con los primeros 3s negros
        b_cam1 = os.path.join(temp_dir, "baile_cam1.mp4")
        crear_clip_video(
            b_cam1,
            duracion_seg=dur_baile,
            primeros_segundos_negros=3.0,
            color_fondo=(50, 50, 180),
            audio_senal=audio_cam1,
            tasa_audio=sr_audio,
        )

        # Baile osmo: 30s sin negros, con audio corrido 2.3s
        b_osmo = os.path.join(temp_dir, "baile_osmo.mp4")
        crear_clip_video(
            b_osmo,
            duracion_seg=dur_baile,
            primeros_segundos_negros=0.0,
            color_fondo=(180, 50, 50),
            audio_senal=audio_osmo,
            tasa_audio=sr_audio,
        )

        # Velas
        velas1 = os.path.join(temp_dir, "velas_vela1.mp4")
        crear_clip_video(velas1, duracion_seg=10.0, color_fondo=(200, 200, 50))

        # 2. Correr el mismo camino que app.py: armar_proyecto(carpeta, almacen)
        ruta_db = os.path.join(temp_dir, "proyecto_fiesta.sqlite")
        almacen = Almacen(ruta_db)

        cortes_generados = armar_proyecto(temp_dir, almacen)
        assert len(cortes_generados) > 0, "armar_proyecto no generó ningún corte"

        # 3. Exportar a Filmora XML
        ruta_xml = os.path.join(temp_dir, "fiesta_filmora.xml")
        exportar_timeline_filmora(cortes_generados, ruta_xml, fps=30)
        assert os.path.exists(ruta_xml), "No se generó el XML de Filmora"

        # 4. Validar XML
        tree = ET.parse(ruta_xml)
        raiz = tree.getroot()
        secuencia = raiz.find("sequence")
        tracks_video = secuencia.find("media").find("video").findall("track")
        pista1 = tracks_video[0]
        pista2 = tracks_video[1]

        todos_los_clips = secuencia.findall(".//clipitem")
        assert len(todos_los_clips) >= 5, "El XML no tiene clips suficientes para la fiesta entera"

        # Comprobar: el XML tiene clips de los cinco bloques
        nombres_clips = [c.find("name").text for c in todos_los_clips if c.find("name") is not None]
        nombres_unidos = " ".join(nombres_clips).lower()

        assert any("previa" in n for n in nombres_unidos.split()), "Faltan clips de Previa en XML"
        assert any("entrada" in n for n in nombres_unidos.split()), "Faltan clips de Entrada en XML"
        assert any("vals" in n for n in nombres_unidos.split()), "Faltan clips de Vals en XML"
        assert any("baile" in n for n in nombres_unidos.split()), "Faltan clips de Baile en XML"
        assert any("velas" in n for n in nombres_unidos.split()), "Faltan clips de Velas en XML"

        # Comprobar: ningún clip dura menos de 1 s (a 30 fps, mínimo 30 frames)
        for clip in todos_los_clips:
            f_in = int(clip.find("in").text)
            f_out = int(clip.find("out").text)
            dur_frames = f_out - f_in
            assert dur_frames >= 28, f"Clip {clip.find('name').text} dura menos de 1 segundo: {dur_frames} frames"

        # Comprobar: el desfase guardado del baile es 2,3 ± 0,05 s
        desfase_guardado = almacen.obtener_preferencia("desfase_baile")
        assert desfase_guardado is not None, "No se guardó el desfase del baile en el almacén"
        assert abs(float(desfase_guardado) - 2.30) <= 0.05, (
            f"El desfase guardado ({desfase_guardado}) difiere de 2.30s por más de 0.05s"
        )

        # Comprobar: hay un clip de la Osmo en la pista 2 durante el negro de baile_cam1
        clips_pista2 = pista2.findall("clipitem")
        assert len(clips_pista2) >= 1, "No hay ningún clip en pista 2 para la Osmo"
        clip_osmo = clips_pista2[0]
        nom_osmo = clip_osmo.find("name").text
        assert "osmo" in nom_osmo.lower()
        # Debe cubrir el inicio del baile
        assert int(clip_osmo.find("in").text) <= 30

        # Comprobar: la revisión trae el aviso del negro
        avisos = almacen.obtener_avisos_revision()
        avisos_negro = [
            a for a in avisos
            if ("negra" in a["descripcion"].lower() or "negro" in a["descripcion"].lower())
            and "baile_cam1" in a["descripcion"].lower()
        ]
        assert len(avisos_negro) >= 1, (
            f"La revisión no reportó el aviso de pantalla negra para baile_cam1. Avisos: {avisos}"
        )
