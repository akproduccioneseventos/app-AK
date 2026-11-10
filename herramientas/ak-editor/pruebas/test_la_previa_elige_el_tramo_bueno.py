# -*- coding: utf-8 -*-
"""Prueba: La previa elige el tramo bueno según sacudida y estabilidad.

Crea un clip con sacudida violenta entre 0 y 2 s y quieto entre 2 y 8 s.
Verifica que generar_cortes_previa seleccione una ventana que caiga
completamente adentro del tramo quieto (in_sec >= 2.0).
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
from reglas import ReglasEdicion


def crear_video_sacudida(ruta_destino: str, fps: int = 10, duracion_seg: int = 8) -> None:
    """Crea un video de 8 segundos: sacudida en 0-2 s y perfectamente estable en 2-8 s."""
    ancho_crop, alto_crop = 320, 240
    ancho_lienzo, alto_lienzo = 480, 360

    # Lienzo grande con texto y patrones para generar flujo óptico nítido
    lienzo = np.zeros((alto_lienzo, ancho_lienzo, 3), dtype=np.uint8)
    for y in range(0, alto_lienzo, 30):
        for x in range(0, ancho_lienzo, 30):
            if ((x // 30) + (y // 30)) % 2 == 0:
                lienzo[y : y + 30, x : x + 30] = (220, 220, 220)
    cv2.putText(lienzo, "AK PRODUCCIONES PREVIA", (40, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(ruta_destino, fourcc, fps, (ancho_crop, alto_crop))

    total_frames = fps * duracion_seg
    np.random.seed(42)

    cx, cy = 80, 60
    for i in range(total_frames):
        seg = i / float(fps)
        if seg < 2.0:
            # Sacudida violenta con desplazamientos erráticos grandes
            dx = int(np.random.randint(-40, 40))
            dy = int(np.random.randint(-30, 30))
        else:
            # Cámara quieta y estable
            dx, dy = 0, 0

        x_ini = max(0, min(cx + dx, ancho_lienzo - ancho_crop))
        y_ini = max(0, min(cy + dy, alto_lienzo - alto_crop))
        crop = lienzo[y_ini : y_ini + alto_crop, x_ini : x_ini + ancho_crop]
        writer.write(crop)

    writer.release()


def test_la_previa_elige_el_tramo_bueno():
    with tempfile.TemporaryDirectory() as temp_dir:
        ruta_video = os.path.join(temp_dir, "previa_sacudida.mp4")
        crear_video_sacudida(ruta_video, fps=10, duracion_seg=8)

        ruta_db = os.path.join(temp_dir, "proyecto.sqlite")
        ruta_med = os.path.join(temp_dir, "MEDICION_test.md")
        almacen = Almacen(ruta_db)
        analizador = Analizador(almacen, ruta_medicion=ruta_med)

        analizador.analizar_carpeta(temp_dir)

        archivos = almacen.obtener_archivos()
        assert len(archivos) == 1
        archivo = archivos[0]
        assert archivo["estado_analisis"] == "completado"

        # Aplicar reglas de previa
        reglas = ReglasEdicion(almacen=almacen)
        cortes = reglas.generar_cortes_previa([archivo], hay_personas=False, almacen=almacen)

        assert len(cortes) >= 1, "No se generó ningún corte para el archivo analizado"
        corte = cortes[0]

        in_sec = corte.get("in_sec", corte.get("entrada"))
        out_sec = corte.get("out_sec", corte.get("salida"))

        # El tramo con sacudida está en 0 a 2s; el corte debe caer dentro del tramo quieto (>= 2.0)
        assert in_sec >= 2.0, (
            f"El corte comenzó en {in_sec} s (debió iniciar en o después de 2.0 s para evitar la sacudida)"
        )
        assert out_sec <= 8.0, (
            f"El corte terminó en {out_sec} s (debe estar dentro de los 8 s del video)"
        )
        assert corte["duracion"] >= 3.0, (
            f"La duración ({corte['duracion']} s) no cumplió el mínimo de 3 s"
        )
