# -*- coding: utf-8 -*-
"""Prueba Orden 273: Las fotos verticales no quedan con barras negras.

Una foto vertical da cuadros sin franjas negras a los costados: de fondo
va la misma foto agrandada y desenfocada.
"""

import os
import sys
import cv2
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from video_de_vida import preparar_fondo_16_9


def test_vida_vertical_sin_barras():
    # Crear imagen claramente vertical (alto > ancho) con contenido de color
    alto_v, ancho_v = 1000, 500
    img_vertical = np.zeros((alto_v, ancho_v, 3), dtype=np.uint8)
    # Rellenar con franjas de colores vivos
    img_vertical[: alto_v // 2, :] = (40, 120, 220)
    img_vertical[alto_v // 2 :, :] = (180, 80, 140)

    ancho_out, alto_out = 1920, 1080
    lienzo = preparar_fondo_16_9(img_vertical, ancho_salida=ancho_out, alto_salida=alto_out)

    assert lienzo.shape == (alto_out, ancho_out, 3)

    # Si hubiera barras negras a los costados, los píxeles a la izquierda y derecha serían (0,0,0).
    # Comprobar que en las franjas laterales (x=0..150 y x=1770..1919) NO hay negro:
    franja_izq = lienzo[:, :150]
    franja_der = lienzo[:, 1770:]

    brillo_izq = np.mean(franja_izq)
    brillo_der = np.mean(franja_der)

    assert brillo_izq > 20.0, f"La franja izquierda quedó negra o casi negra: brillo {brillo_izq}"
    assert brillo_der > 20.0, f"La franja derecha quedó negra o casi negra: brillo {brillo_der}"

    # Comprobar que no hay columnas con todo negro en los costados
    col_izq = lienzo[:, 20]
    assert np.any(col_izq > 15), "La columna lateral izquierda está completamente negra"
    col_der = lienzo[:, ancho_out - 20]
    assert np.any(col_der > 15), "La columna lateral derecha está completamente negra"
