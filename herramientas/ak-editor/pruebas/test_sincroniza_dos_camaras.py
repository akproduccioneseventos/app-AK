# -*- coding: utf-8 -*-
"""Prueba: Sincronización de audio de dos cámaras.

Genera dos audios sintéticos con un desfase de 2.30s y comprueba
que la correlación detecta el offset de 2.30s (±0.02s).
"""

import os
import sys
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from analizador import sincronizar_dos_camaras


def test_sincroniza_dos_camaras():
    tasa_muestreo = 1000  # 1000 muestras por segundo (precisión de 1 ms)
    duracion_segundos = 10.0
    desfase_real_segundos = 2.30

    # Crear una señal base con patrón distintivo (ruido coloreado + ráfagas)
    np.random.seed(42)
    n_muestras_base = int(duracion_segundos * tasa_muestreo)
    tiempo = np.linspace(0, duracion_segundos, n_muestras_base)

    # Señal acústica común: chirp y tonos armónicos de música
    senal_comun = (
        np.sin(2 * np.pi * 50 * tiempo)
        + 0.5 * np.sin(2 * np.pi * 120 * tiempo**1.2)
        + np.random.normal(0, 0.2, n_muestras_base)
    )

    # Cámara 1 recibe la señal desde t = 0
    audio_cam1 = senal_comun

    # Cámara 2 empieza a grabar más tarde (desfase de 2.30s)
    # Por tanto, en el tiempo de la cámara 2, la señal común aparece retrasada en 2.30s
    muestras_offset = int(desfase_real_segundos * tasa_muestreo)
    audio_cam2 = np.zeros_like(audio_cam1)
    audio_cam2[muestras_offset:] = senal_comun[:-muestras_offset]
    # Agregar algo de ruido independiente en cada cámara
    audio_cam1 = audio_cam1 + np.random.normal(0, 0.05, len(audio_cam1))
    audio_cam2 = audio_cam2 + np.random.normal(0, 0.05, len(audio_cam2))

    offset_detectado = sincronizar_dos_camaras(audio_cam1, audio_cam2, tasa_muestreo=tasa_muestreo)

    diferencia = abs(abs(offset_detectado) - desfase_real_segundos)
    assert diferencia <= 0.02, (
        f"El offset detectado ({offset_detectado:.4f}s) difiere del real "
        f"({desfase_real_segundos}s) por más del margen tolerado (0.02s). Dif: {diferencia:.4f}s"
    )
