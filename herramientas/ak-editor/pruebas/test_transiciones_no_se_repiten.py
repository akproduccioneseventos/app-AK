# -*- coding: utf-8 -*-
"""Prueba: Las transiciones nunca se repiten consecutivamente.

Simula 50 cortes de previa y verifica que nunca haya dos transiciones
idénticas consecutivas.
"""

import os
import sys
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from reglas import ReglasEdicion


def test_transiciones_no_se_repiten():
    reglas = ReglasEdicion()

    # Simular suficientes archivos para generar al menos 50 cortes
    archivos_simulados = []
    for i in range(25):
        archivos_simulados.append({
            "id": i + 1,
            "nombre": f"previa_toma_{i+1:02d}.mp4",
            "duracion": 15.0,
            "bloque": "previa",
            "camara": "principal",
        })

    cortes = reglas.generar_cortes_previa(archivos_simulados, hay_personas=True)
    assert len(cortes) >= 50, f"Se esperaban al menos 50 cortes, se obtuvieron {len(cortes)}"

    # Verificar que nunca haya dos transiciones idénticas consecutivas
    for i in range(1, len(cortes)):
        trans_actual = cortes[i]["transicion"]
        trans_anterior = cortes[i - 1]["transicion"]
        assert trans_actual != trans_anterior, (
            f"Transición repetida consecutivamente en los cortes {i-1} y {i}: '{trans_actual}'"
        )
