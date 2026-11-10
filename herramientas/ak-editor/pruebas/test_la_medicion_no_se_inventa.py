# -*- coding: utf-8 -*-
"""Prueba: Las mediciones no se inventan ni contienen datos simulados.

Valida que MEDICION.md en estado inicial no contenga porcentajes (%) ni
tildes (✅) ni 2,5 horas inventadas. Luego de una corrida real de análisis,
verifica que se añada una entrada con tiempos reales y memoria de psutil.
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


def test_la_medicion_no_se_inventa():
    ruta_medicion = os.path.join(DIR_HERRAMIENTA, "MEDICION.md")
    assert os.path.exists(ruta_medicion), "MEDICION.md no existe"

    with open(ruta_medicion, "r", encoding="utf-8") as f:
        contenido_inicial = f.read()

    # 1. Sin corrida real, MEDICION.md no debe contener datos inventados
    assert "%" not in contenido_inicial, "MEDICION.md contiene porcentajes simulados"
    assert "✅" not in contenido_inicial, "MEDICION.md contiene tildes de aprobación simuladas"
    assert "2.5 horas" not in contenido_inicial.lower(), "MEDICION.md contiene '2.5 horas' simuladas"
    assert "2,5 horas" not in contenido_inicial.lower(), "MEDICION.md contiene '2,5 horas' simuladas"

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            # Crear video sintético real de 3 segundos
            ruta_video = os.path.join(temp_dir, "clip_medicion.mp4")
            ancho, alto = 160, 120
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(ruta_video, fourcc, 10, (ancho, alto))
            frame = np.full((alto, ancho, 3), 120, dtype=np.uint8)
            for _ in range(30):
                writer.write(frame)
            writer.release()

            ruta_db = os.path.join(temp_dir, "proyecto.sqlite")
            almacen = Almacen(ruta_db)
            analizador = Analizador(almacen)

            # Ejecutar análisis
            analizador.analizar_carpeta(temp_dir)

            # 2. Verificar que se haya anexado la medición con datos reales
            with open(ruta_medicion, "r", encoding="utf-8") as f:
                contenido_posterior = f.read()

            assert len(contenido_posterior) > len(contenido_inicial), "No se anexó la corrida a MEDICION.md"
            assert "Medición de corrida real" in contenido_posterior or "Corrida real" in contenido_posterior
            assert "Material analizado" in contenido_posterior
            assert "Tiempo transcurrido" in contenido_posterior
            assert "Memoria RAM máxima" in contenido_posterior
            assert "sin revisar" in contenido_posterior
            assert "sin probar" in contenido_posterior

            # Asegurar que la corrida real no introduce porcentajes ni tildes inventadas
            assert "%" not in contenido_posterior
            assert "✅" not in contenido_posterior
    finally:
        with open(ruta_medicion, "w", encoding="utf-8") as f:
            f.write(contenido_inicial)
