# -*- coding: utf-8 -*-
"""Prueba: Prohibido cortar mientras alguien habla por micrófono.

Genera audio con voz activa entre el segundo 10 y 25 y comprueba
que ningún punto de corte caiga en ese intervalo.
"""

import os
import sys
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from analizador import detectar_voz_activa
from reglas import ReglasEdicion


def test_no_corta_mientras_hablan():
    tasa_muestreo = 1000
    duracion_total = 40.0
    total_muestras = int(duracion_total * tasa_muestreo)

    # 1. Crear audio con silencio o sonido bajo, y voz activa entre segundo 10 y 25
    audio = np.random.normal(0, 0.005, total_muestras)

    inicio_voz = 10.0
    fin_voz = 25.0
    idx_inicio = int(inicio_voz * tasa_muestreo)
    idx_fin = int(fin_voz * tasa_muestreo)

    tiempo_voz = np.linspace(0, fin_voz - inicio_voz, idx_fin - idx_inicio)
    audio[idx_inicio:idx_fin] += 0.5 * np.sin(2 * np.pi * 200 * tiempo_voz)

    # 2. Detectar voz activa
    intervalos = detectar_voz_activa(audio, tasa_muestreo=tasa_muestreo, umbral_rms=0.03)
    assert len(intervalos) > 0, "No se detectó ningún intervalo de voz"

    # Verificar que el intervalo detectado cubre de 10 a 25 aproximadamente
    primer_tramo = intervalos[0]
    assert abs(primer_tramo[0] - inicio_voz) <= 0.5
    assert abs(primer_tramo[1] - fin_voz) <= 0.5

    # 3. Aplicar reglas de discursos y velas
    reglas = ReglasEdicion()
    archivo = {
        "id": 1,
        "nombre": "discurso_padrino.mp4",
        "duracion": duracion_total,
        "bloque": "discursos_y_velas",
        "camara": "principal",
    }

    # Probar con varios momentos candidatos donde el editor intentaría cortar
    momentos_candidatos = [5.0, 15.0, 20.0, 32.0]
    cortes = reglas.generar_cortes_discursos_y_velas(
        archivo=archivo,
        intervalos_voz=intervalos,
        momentos_vela=momentos_candidatos,
    )

    # 4. Validar que NINGÚN punto de corte (entrada o salida) caiga dentro del intervalo de voz [10, 25]
    for c in cortes:
        entrada = c["entrada"]
        salida = c["salida"]

        # Si el corte no cubre todo el intervalo de voz, ningún borde debe caer dentro de (10.0, 25.0)
        corta_en_medio = (10.0 < entrada < 25.0) or (10.0 < salida < 25.0)
        assert not corta_en_medio, (
            f"El corte [{entrada}s - {salida}s] corta en medio del discurso ({inicio_voz}s - {fin_voz}s)"
        )
