# -*- coding: utf-8 -*-
"""Prueba Orden 273: El cambio de foto cae en el golpe musical.

Con un audio con golpes cada 0,5 s, cada cambio de foto cae a menos de 0,05 s de un golpe.
"""

import os
import sys
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from video_de_vida import ajustar_tiempos_a_golpes, detectar_golpes_audio


def test_vida_cambia_en_el_golpe():
    tasa_muestreo = 1000
    duracion_seg = 20.0
    total_muestras = int(tasa_muestreo * duracion_seg)

    # Crear señal con pulsos de alta energía cada 0.5 segundos
    audio = np.zeros(total_muestras, dtype=np.float32)
    intervalo_golpe = 0.5
    golpes_reales = []

    t = intervalo_golpe
    while t < duracion_seg - 0.2:
        golpes_reales.append(t)
        idx = int(t * tasa_muestreo)
        # Pulso triangular pronunciado de 20 ms
        ancho_pulso = 20
        idx_ini = max(0, idx - ancho_pulso // 2)
        idx_fin = min(total_muestras, idx + ancho_pulso // 2)
        audio[idx_ini:idx_fin] = 1.0
        t += intervalo_golpe

    golpes_detectados = detectar_golpes_audio(audio, tasa_muestreo=tasa_muestreo)

    # Verificar que detecta golpes cercanos a cada 0.5s
    assert len(golpes_detectados) >= 10

    # Ajustar cambios para 5 fotos
    cambios = ajustar_tiempos_a_golpes(
        cantidad_fotos=5,
        golpes=golpes_detectados,
        duracion_min=2.5,
        duracion_max=5.0,
        duracion_deseada_media=3.5,
    )

    assert len(cambios) == 5

    # Comprobar que CADA cambio de foto cae a menos de 0,05 s de un golpe
    for t_cambio in cambios:
        distancia_minima = min(abs(t_cambio - g) for g in golpes_detectados)
        assert distancia_minima < 0.05, (
            f"El cambio en {t_cambio:.3f}s no cayó cerca de un golpe musical. "
            f"Distancia mínima fue {distancia_minima:.4f}s >= 0.05s"
        )
