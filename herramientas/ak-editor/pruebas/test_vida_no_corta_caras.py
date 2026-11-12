# -*- coding: utf-8 -*-
"""Prueba Orden 273: El encuadre de movimiento nunca corta caras.

Con una foto con una cara en una esquina, el encuadre de cada cuadro del
movimiento contiene la cara entera sin recortarla en ningún fotograma.
"""

import os
import sys
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from video_de_vida import calcular_encuadres_movimiento


def test_vida_no_corta_caras():
    ancho, alto = 1920, 1080
    # Cara ubicada deliberadamente en la esquina superior derecha
    fx, fy, fw, fh = 1450, 80, 220, 260
    cara_box = (fx, fy, fw, fh)

    # Probar tanto acercamiento como alejamiento
    for sentido in ("acercar", "alejar"):
        encuadres = calcular_encuadres_movimiento(
            ancho=ancho,
            alto=alto,
            cara_box=cara_box,
            total_cuadros=60,
            zoom_max=1.25,
            sentido=sentido,
        )

        assert len(encuadres) == 60

        for idx, (cx, cy, cw, ch) in enumerate(encuadres):
            # 1. El encuadre debe estar dentro de los límites de la imagen
            assert cx >= 0 and cy >= 0
            assert cx + cw <= ancho
            assert cy + ch <= alto

            # 2. REGLA ESTRICTA: El encuadre DEBE contener la cara completa
            assert cx <= fx, (
                f"Cuadro {idx} ({sentido}): cx={cx} corta el borde izquierdo de la cara fx={fx}"
            )
            assert cy <= fy, (
                f"Cuadro {idx} ({sentido}): cy={cy} corta el borde superior de la cara fy={fy}"
            )
            assert cx + cw >= fx + fw, (
                f"Cuadro {idx} ({sentido}): cx+cw={cx+cw} corta el borde derecho de la cara fx+fw={fx+fw}"
            )
            assert cy + ch >= fy + fh, (
                f"Cuadro {idx} ({sentido}): cy+ch={cy+ch} corta la base de la cara fy+fh={fy+fh}"
            )
