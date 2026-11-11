# -*- coding: utf-8 -*-
"""Prueba: El análisis analiza los videos de verdad.

Crea un video temporal con:
- Segundos 0-3: patrón normal nítido.
- Segundos 3-5: fotogramas completamente negros.
- Segundos 5-6: patrón normal nítido.
- Segundos 6-8: imagen desenfocada (GaussianBlur fuerte).
- Segundos 8-10: patrón normal nítido.

Verifica que el analizador detecte las pantallas negras en 3-5 y
el desenfoque en 6-8, guardando las métricas en SQLite.
"""

import os
import sys
import tempfile
import cv2
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from almacen import Almacen
from analizador import Analizador


def crear_video_prueba(ruta_destino: str, fps: int = 10, duracion_seg: int = 10) -> None:
    """Genera un archivo de video con tramos nítidos, negros y desenfocados."""
    ancho, alto = 320, 240
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(ruta_destino, fourcc, fps, (ancho, alto))

    # Frame nítido con alto contraste y textura
    frame_nitido = np.zeros((alto, ancho, 3), dtype=np.uint8)
    for y in range(0, alto, 20):
        for x in range(0, ancho, 20):
            if ((x // 20) + (y // 20)) % 2 == 0:
                frame_nitido[y : y + 20, x : x + 20] = (255, 255, 255)

    # Frame completamente negro
    frame_negro = np.zeros((alto, ancho, 3), dtype=np.uint8)

    # Frame fuertemente desenfocado
    frame_borroso = cv2.GaussianBlur(frame_nitido, (51, 51), sigmaX=30)

    total_frames = fps * duracion_seg
    for i in range(total_frames):
        seg = i / float(fps)
        if 3.0 <= seg < 5.0:
            writer.write(frame_negro)
        elif 6.0 <= seg < 8.0:
            writer.write(frame_borroso)
        else:
            writer.write(frame_nitido)

    writer.release()


def test_analiza_de_verdad():
    with tempfile.TemporaryDirectory() as temp_dir:
        ruta_video = os.path.join(temp_dir, "previa_toma_real.mp4")
        crear_video_prueba(ruta_video, fps=10, duracion_seg=10)

        ruta_db = os.path.join(temp_dir, "proyecto.sqlite")
        ruta_med = os.path.join(temp_dir, "MEDICION_test.md")
        almacen = Almacen(ruta_db)
        analizador = Analizador(almacen, ruta_medicion=ruta_med)

        analizador.analizar_carpeta(temp_dir)

        archivos = almacen.obtener_archivos()
        assert len(archivos) == 1
        archivo = archivos[0]
        assert archivo["estado_analisis"] == "completado"

        metricas = almacen.obtener_analisis_segundos(archivo["id"])
        assert len(metricas) >= 9, f"Se esperaban al menos 9 segundos medidos, hay {len(metricas)}"

        dict_seg = {int(round(m["segundo"])): m for m in metricas}

        # Segundos 3 y 4 deben estar detectados como negros
        assert dict_seg[3]["es_negro"] is True, f"Segundo 3 no se detectó como negro: {dict_seg[3]}"
        assert dict_seg[4]["es_negro"] is True, f"Segundo 4 no se detectó como negro: {dict_seg[4]}"

        # Segundos 0, 1, 2, 5, 8, 9 NO deben ser negros
        for s in [0, 1, 2, 5, 8, 9]:
            if s in dict_seg:
                assert dict_seg[s]["es_negro"] is False, f"Segundo {s} falsamente marcado negro"

        # Segundos 6 y 7 deben tener desenfoque notorio (varianza de Laplaciano baja < 100)
        assert dict_seg[6]["desenfoque"] < 100.0, f"Segundo 6 no detectó desenfoque: {dict_seg[6]['desenfoque']}"
        assert dict_seg[7]["desenfoque"] < 100.0, f"Segundo 7 no detectó desenfoque: {dict_seg[7]['desenfoque']}"

        # Segundos nítidos deben tener varianza Laplaciana alta (> 300)
        for s in [0, 1, 2, 5, 8, 9]:
            if s in dict_seg:
                assert dict_seg[s]["desenfoque"] > 300.0, (
                    f"Segundo nítido {s} tuvo desenfoque inesperado: {dict_seg[s]['desenfoque']}"
                )
