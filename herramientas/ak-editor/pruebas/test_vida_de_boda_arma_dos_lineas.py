# -*- coding: utf-8 -*-
"""Prueba Orden 273: Video de Vida de boda arma dos líneas en paralelo.

Con fotos de él y de ella, los cuadros del capítulo 'Él · Ella' tienen
las dos fotos lado a lado (pantalla partida), y después de 'Cuando nos conocimos'
queda una sola foto a pantalla completa.
"""

import os
import sys
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from video_de_vida import generar_cuadro_boda_paralelo, preparar_fondo_16_9


def test_vida_de_boda_arma_dos_lineas():
    ancho, alto = 1920, 1080

    # Foto de Él: marcadamente azul BGR=(220, 60, 40)
    foto_el = np.full((600, 400, 3), (220, 60, 40), dtype=np.uint8)

    # Foto de Ella: marcadamente verde BGR=(40, 220, 60)
    foto_ella = np.full((600, 400, 3), (40, 220, 60), dtype=np.uint8)

    # 1. Capítulo 'Él · Ella': Cuadro lado a lado en pantalla partida
    cuadro_paralelo = generar_cuadro_boda_paralelo(foto_el, foto_ella, ancho=ancho, alto=alto)
    assert cuadro_paralelo.shape == (alto, ancho, 3)

    mitad = ancho // 2
    # Mitad izquierda (Él) debe tener predominio azul
    mitad_izq = cuadro_paralelo[:, :mitad - 10]
    b_izq = np.mean(mitad_izq[:, :, 0])
    g_izq = np.mean(mitad_izq[:, :, 1])
    assert b_izq > 150 and g_izq < 100, "La mitad izquierda no corresponde a la foto de Él (azul)"

    # Mitad derecha (Ella) debe tener predominio verde
    mitad_der = cuadro_paralelo[:, mitad + 10:]
    b_der = np.mean(mitad_der[:, :, 0])
    g_der = np.mean(mitad_der[:, :, 1])
    assert g_der > 150 and b_der < 100, "La mitad derecha no corresponde a la foto de Ella (verde)"

    # 2. Después de 'Cuando nos conocimos' (foto juntos): una sola foto a pantalla completa
    foto_juntos = np.full((600, 800, 3), (180, 180, 20), dtype=np.uint8)
    cuadro_juntos = preparar_fondo_16_9(foto_juntos, ancho_salida=ancho, alto_salida=alto)

    # En el centro no hay línea divisoria blanca ni separación en mitades distintas
    color_centro_izq = np.mean(cuadro_juntos[:, mitad - 50 : mitad])
    color_centro_der = np.mean(cuadro_juntos[:, mitad : mitad + 50])
    assert abs(color_centro_izq - color_centro_der) < 15.0, "La foto de juntos no es continua en el centro"
