# -*- coding: utf-8 -*-
"""Prueba Orden 280: Bloque 2 — Enderezado y recorte automático sin cortar caras.

Verifica:
1. Con una línea inclinada a 2°, se detecta un ángulo crs:CropAngle ≈ 2° (± 0.3°).
2. El recorte en proporción 3:2 contiene la cara completa sin cortar ningún borde.
3. Se garantiza margen superior (aire arriba de la cabeza).
"""

import math
import os
import sys
import tempfile
import xml.etree.ElementTree as ET

import cv2
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from fotos import (
    actualizar_o_crear_xmp,
    calcular_recorte_3_2,
    detectar_angulo_enderezado,
    procesar_seleccion_fotos,
    resolver_ruta_xmp,
)


def test_fotos_endereza_sin_cortar_caras():
    ancho, alto = 1200, 800
    img = np.full((alto, ancho, 3), 230, dtype=np.uint8)

    # 1. Dibujar una línea larga recta inclinada exactamente a 2.0 grados
    angulo_grados = 2.0
    angulo_rad = math.radians(angulo_grados)
    x1, y1 = 150, 600
    longitud = 700
    x2 = int(x1 + longitud * math.cos(angulo_rad))
    y2 = int(y1 + longitud * math.sin(angulo_rad))
    cv2.line(img, (x1, y1), (x2, y2), (20, 20, 20), 4)

    # 2. Ubicar una cara en la escena: (fx, fy, fw, fh)
    fx, fy, fw, fh = 500, 180, 160, 200
    cara_box = (fx, fy, fw, fh)

    # Dibujar la cara con tono de piel y rasgos para validación visual/algorítmica
    cv2.rectangle(img, (fx, fy), (fx + fw, fy + fh), (180, 205, 235), -1)
    # Ojos y boca
    cv2.circle(img, (fx + 45, fy + 70), 12, (50, 40, 30), -1)
    cv2.circle(img, (fx + 115, fy + 70), 12, (50, 40, 30), -1)
    cv2.line(img, (fx + 50, fy + 140), (fx + 110, fy + 140), (60, 60, 180), 4)

    # 3. Comprobar detección de ángulo de enderezado
    angulo_detectado = detectar_angulo_enderezado(img)
    assert angulo_detectado is not None, "No se detectó el ángulo de la línea inclinada"
    assert abs(angulo_detectado - 2.0) <= 0.3, (
        f"Se esperaba CropAngle ≈ 2.0 (±0.3), pero se obtuvo {angulo_detectado}"
    )

    # 4. Comprobar cálculo de recorte en proporción 3:2 conteniendo la cara
    crop = calcular_recorte_3_2(ancho, alto, [cara_box], proporcion=1.5)

    assert "CropLeft" in crop
    assert "CropTop" in crop
    assert "CropRight" in crop
    assert "CropBottom" in crop

    # Convertir coordenadas normalizadas a píxeles
    crop_x = int(crop["CropLeft"] * ancho)
    crop_y = int(crop["CropTop"] * alto)
    crop_w = int((crop["CropRight"] - crop["CropLeft"]) * ancho)
    crop_h = int((crop["CropBottom"] - crop["CropTop"]) * alto)

    # REGLA ESTRICTA: El recorte DEBE contener la cara completa
    assert crop_x <= fx, f"El recorte corta el lado izquierdo de la cara: {crop_x} > {fx}"
    assert crop_y <= fy, f"El recorte corta la parte superior de la cara: {crop_y} > {fy}"
    assert crop_x + crop_w >= fx + fw, f"El recorte corta el lado derecho: {crop_x + crop_w} < {fx + fw}"
    assert crop_y + crop_h >= fy + fh, f"El recorte corta la base de la cara: {crop_y + crop_h} < {fy + fh}"

    # REGLA DE COMPOSICIÓN: Aire arriba de la cabeza
    assert fy - crop_y >= 20, f"Debe quedar margen de aire arriba de la cabeza. Margen: {fy - crop_y} px"

    # REGLA DE PROPORCIÓN: Proporción 3:2 (1.5)
    proporcion_calculada = float(crop_w) / float(crop_h)
    assert abs(proporcion_calculada - 1.5) <= 0.05, (
        f"La proporción del recorte debe ser 3:2 (~1.5), pero es {proporcion_calculada:.2f}"
    )

    # 5. Probar ciclo completo con guardado en .xmp
    with tempfile.TemporaryDirectory() as temp_dir:
        ruta_foto = os.path.join(temp_dir, "evento_novios.jpg")
        cv2.imwrite(ruta_foto, img)

        ruta_xmp = actualizar_o_crear_xmp(
            ruta_foto=ruta_foto,
            rating=5,
            label="",
            tiene_personas=True,
            crop_angle=angulo_detectado,
            crop_data=crop,
        )

        assert os.path.exists(ruta_xmp)
        tree = ET.parse(ruta_xmp)
        desc = tree.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")

        val_crop_angle = float(desc.get("{http://ns.adobe.com/camera-raw-settings/1.0/}CropAngle"))
        assert abs(val_crop_angle - 2.0) <= 0.3
        assert desc.get("{http://ns.adobe.com/camera-raw-settings/1.0/}HasCrop") == "True"

        # Verificar palabra clave con personas
        bag = desc.find(".//{http://purl.org/dc/elements/1.1/}subject/{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Bag")
        palabras = [li.text for li in bag.findall("{http://www.w3.org/1999/02/22-rdf-syntax-ns#}li")]
        assert "con personas" in palabras
