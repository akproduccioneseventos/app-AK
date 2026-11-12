# -*- coding: utf-8 -*-
"""Prueba Orden 274: Bloque 6 — Aprender de los videos terminados del dueño.

Un video armado por la prueba con cortes cada 4 s propone una duración de toma
de 4 ± 0,5 s para config.yaml sin modificarlo automáticamente.
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

from reglas import aprender_de_mis_videos


def test_aprende_de_mis_videos():
    with tempfile.TemporaryDirectory() as temp_dir:
        ruta_video = os.path.join(temp_dir, "video_terminado_ejemplo.mp4")

        ancho, alto = 160, 120
        fps = 10
        # 16 segundos con 4 tomas de 4 segundos cada una
        duracion_toma_seg = 4
        cant_tomas = 4
        duracion_total_seg = duracion_toma_seg * cant_tomas  # 16 s

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(ruta_video, fourcc, fps, (ancho, alto))

        colores = [
            (220, 40, 40),    # Azul
            (40, 220, 40),    # Verde
            (40, 40, 220),    # Rojo
            (220, 220, 40),   # Cyan
        ]

        for toma_idx in range(cant_tomas):
            color = colores[toma_idx % len(colores)]
            frame = np.full((alto, ancho, 3), color, dtype=np.uint8)
            frames_toma = fps * duracion_toma_seg
            for _ in range(frames_toma):
                writer.write(frame)

        writer.release()

        # Analizar con la función de aprendizaje
        resultado = aprender_de_mis_videos([ruta_video])

        dur_propuesta = resultado["duracion_toma_promedio"]
        # Debe proponer 4 ± 0,5 s
        assert abs(dur_propuesta - 4.0) <= 0.5, (
            f"La duración de toma propuesta fue {dur_propuesta}s, se esperaba 4.0 ± 0.5s"
        )

        assert "propuesta_config" in resultado
        assert "edicion" in resultado["propuesta_config"]
        # Verificar que propone valores para previa, pose y baile
        ed = resultado["propuesta_config"]["edicion"]
        assert "previa" in ed
        assert "discursos_y_velas" in ed
        assert "baile" in ed
