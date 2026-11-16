# -*- coding: utf-8 -*-
"""Prueba Orden 307: Reconocimiento de cara principal (la agasajada) y calificación por estrellas.

Valida:
1. En un grupo de repetidas (< 3 s, dHash similar), gana la foto donde sale la agasajada.
2. Las fotos donde sale la agasajada suben una estrella en su calificación (Rating).
3. Se reporta en el resumen 'Salen N fotos de la agasajada'.
4. Detección por foto de referencia (fotos_referencia_agasajada).
"""

import os
import sys
import tempfile
import time
import xml.etree.ElementTree as ET

import cv2
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from fotos import (
    extraer_descriptor_cara,
    procesar_seleccion_fotos,
    resolver_ruta_xmp,
    son_misma_cara,
)


def crear_foto_con_rostro(ancho: int = 320, alto: int = 240, patron_rostro: int = 1) -> np.ndarray:
    """Crea una imagen sintética con fondo nítido y un recuadro facial contrastante."""
    img = np.full((alto, ancho, 3), 160, dtype=np.uint8)
    # Fondo con textura
    for y in range(0, alto, 20):
        for x in range(0, ancho, 20):
            if (x // 20 + y // 20) % 2 == 0:
                img[y:y+20, x:x+20] = (140, 140, 140)

    # Recuadro simulando rostro centrado (x=110, y=60, w=100, h=100)
    fx, fy, fw, fh = 110, 60, 100, 100
    color_piel = (130, 150, 220)  # Tono BGR simulando piel
    cv2.rectangle(img, (fx, fy), (fx + fw, fy + fh), color_piel, -1)

    # Características internas según el patrón
    if patron_rostro == 1:
        # Rostro agasajada: ojos y sonrisa definida
        cv2.circle(img, (fx + 30, fy + 35), 8, (40, 40, 40), -1)
        cv2.circle(img, (fx + 70, fy + 35), 8, (40, 40, 40), -1)
        cv2.ellipse(img, (fx + 50, fy + 70), (25, 12), 0, 0, 180, (20, 20, 180), 3)
    else:
        # Otro rostro: ojos rasgados y línea recta
        cv2.line(img, (fx + 20, fy + 35), (fx + 40, fy + 35), (20, 20, 20), 4)
        cv2.line(img, (fx + 60, fy + 35), (fx + 80, fy + 35), (20, 20, 20), 4)
        cv2.line(img, (fx + 35, fy + 70), (fx + 65, fy + 70), (20, 20, 20), 3)

    return img


def test_fotos_cara_principal():
    with tempfile.TemporaryDirectory() as temp_dir:
        t_base = time.time()

        # 1. Crear foto de referencia de la agasajada
        ruta_ref = os.path.join(temp_dir, "referencia_agasajada.jpg")
        img_ref = crear_foto_con_rostro(patron_rostro=1)
        cv2.imwrite(ruta_ref, img_ref)

        # 2. Crear dos fotos repetidas en ráfaga (diferencia de 1 s, dHash casi idéntico)
        # Foto A: sale otra persona (patron_rostro=2)
        ruta_repetida_otra = os.path.join(temp_dir, "foto_01_repetida_otra.jpg")
        img_otra = crear_foto_con_rostro(patron_rostro=2)
        cv2.imwrite(ruta_repetida_otra, img_otra)
        os.utime(ruta_repetida_otra, (t_base, t_base))

        # Foto B: sale la agasajada (patron_rostro=1)
        ruta_repetida_agasajada = os.path.join(temp_dir, "foto_02_repetida_agasajada.jpg")
        img_agasajada = crear_foto_con_rostro(patron_rostro=1)
        cv2.imwrite(ruta_repetida_agasajada, img_agasajada)
        os.utime(ruta_repetida_agasajada, (t_base + 1.0, t_base + 1.0))

        # Detección de caras fijas para la prueba
        caja_cara = (110, 60, 100, 100)
        caras_override = {
            ruta_ref: [caja_cara],
            ruta_repetida_otra: [caja_cara],
            ruta_repetida_agasajada: [caja_cara],
        }

        # 3. Procesar ráfaga pasando la foto de referencia de la agasajada
        res = procesar_seleccion_fotos(
            rutas_fotos=[ruta_repetida_otra, ruta_repetida_agasajada],
            fotos_referencia_agasajada=[ruta_ref],
            caras_override=caras_override,
            umbral_borrosa=30.0,
        )

        assert res["total"] == 2
        assert res["elegidas"] == 1
        assert res["rechazadas"] == 1

        # En el grupo de repetidas, debe ganar la foto de la agasajada
        detalles_por_ruta = {d["ruta"]: d for d in res["detalles"]}
        assert detalles_por_ruta[ruta_repetida_agasajada]["estado"] == "elegida", (
            "La foto de la agasajada debió ganar en la ráfaga de repetidas"
        )
        assert detalles_por_ruta[ruta_repetida_otra]["estado"] == "rechazada", (
            "La foto sin la agasajada debió ser rechazada por repetida"
        )
        assert "Repetida" in detalles_por_ruta[ruta_repetida_otra]["motivo_rechazo"]

        # 4. Comprobar que en pantalla y resumen sale 'Salen N fotos de la agasajada'
        assert res["fotos_agasajada"] == 1
        assert "Salen 1 fotos de la agasajada" in res["mensaje_agasajada"]

        # 5. Comprobar que la foto donde sale la agasajada sube una estrella
        # Calificación en XMP de la elegida
        ruta_xmp = resolver_ruta_xmp(ruta_repetida_agasajada)
        tree = ET.parse(ruta_xmp)
        rating_xmp = int(tree.getroot().find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description").attrib.get(
            "{http://ns.adobe.com/xap/1.0/}Rating", "0"
        ))

        # Procesar la misma foto pero sin marcarla como agasajada para ver la estrella base
        res_sin_agasajada = procesar_seleccion_fotos(
            rutas_fotos=[ruta_repetida_agasajada],
            caras_override=caras_override,
            umbral_borrosa=30.0,
        )
        rating_base = res_sin_agasajada["detalles"][0]["rating"]

        assert rating_xmp == min(5, rating_base + 1), (
            f"La foto con agasajada debió subir una estrella: base={rating_base}, con agasajada={rating_xmp}"
        )
