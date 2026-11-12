# -*- coding: utf-8 -*-
"""Prueba Orden 274: Regla 'la pose' corta cuando entran y cuando se van.

Un clip con una cara que entra moviéndose (0-2 s), queda quieta (2-6 s)
y se va (6-8 s). El corte cae adentro de 2-6 s.
Si la cara se mueve todo el tiempo, no hay corte de pose.
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

from reglas import ReglasEdicion


def test_corta_cuando_se_van():
    reglas = ReglasEdicion()

    # 1. Caso 1: Cara entrando moviéndose (0-2s), quieta (2-6s), yéndose (6-8s)
    metricas_pose = [
        {"segundo": 0.0, "tiene_cara": True, "cara_quieta": False, "sacudida": 3.5, "es_negro": False},
        {"segundo": 1.0, "tiene_cara": True, "cara_quieta": False, "sacudida": 3.0, "es_negro": False},
        {"segundo": 2.0, "tiene_cara": True, "cara_quieta": True, "sacudida": 0.2, "es_negro": False},
        {"segundo": 3.0, "tiene_cara": True, "cara_quieta": True, "sacudida": 0.1, "es_negro": False},
        {"segundo": 4.0, "tiene_cara": True, "cara_quieta": True, "sacudida": 0.1, "es_negro": False},
        {"segundo": 5.0, "tiene_cara": True, "cara_quieta": True, "sacudida": 0.2, "es_negro": False},
        {"segundo": 6.0, "tiene_cara": True, "cara_quieta": False, "sacudida": 3.2, "es_negro": False},
        {"segundo": 7.0, "tiene_cara": True, "cara_quieta": False, "sacudida": 4.0, "es_negro": False},
    ]

    archivo_pose = {
        "id": 101,
        "nombre": "recepcion_pose.mp4",
        "bloque": "previa",
        "duracion": 8.0,
        "analisis": metricas_pose,
    }

    cortes = reglas.generar_cortes_pose(archivo_pose, metricas=metricas_pose)
    assert len(cortes) == 1, f"Se esperaba exactamente 1 corte de pose, se obtuvieron {len(cortes)}"

    corte = cortes[0]
    ent = corte["entrada"]
    sal = corte["salida"]

    # El corte debe caer adentro del tramo quieto (2 a 6 s)
    assert ent >= 2.0, f"La entrada {ent}s cayó antes del momento en que se quedaron quietos (2s)"
    assert sal <= 6.0, f"La salida {sal}s cayó después del momento en que empezaron a moverse o irse (6s)"
    assert corte["duracion"] >= 3.0, f"La pose debe durar al menos 3s, duró {corte['duracion']}s"

    # 2. Caso 2: La cara se mueve todo el tiempo (0 a 8 s sin quietud)
    metricas_en_movimiento = [
        {"segundo": float(s), "tiene_cara": True, "cara_quieta": False, "sacudida": 3.5, "es_negro": False}
        for s in range(8)
    ]

    archivo_mov = {
        "id": 102,
        "nombre": "gente_caminando.mp4",
        "bloque": "previa",
        "duracion": 8.0,
        "analisis": metricas_en_movimiento,
    }

    cortes_mov = reglas.generar_cortes_pose(archivo_mov, metricas=metricas_en_movimiento)
    # Si la cara se mueve todo el tiempo, no hay corte de pose
    assert len(cortes_mov) == 0, f"No debía generarse corte de pose cuando se mueven todo el tiempo: {cortes_mov}"
