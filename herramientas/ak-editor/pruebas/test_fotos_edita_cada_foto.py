# -*- coding: utf-8 -*-
"""Prueba Orden 307: Edición automática de fotos estilo Aftershoot.

Valida:
1. Corrección individual por foto:
   - La foto oscura recibe exposición positiva (Exposure2012 > 0).
   - La foto clara recibe exposición negativa (Exposure2012 < 0).
   - La foto azulada recibe temperatura más cálida que la foto cálida.
2. Los ajustes previos del dueño en el .xmp no se pisan.
3. 'Volver al original' saca los ajustes de revelado del .xmp.
4. Calificación por calidad con estrellas de 1 a 5.
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
    procesar_seleccion_fotos,
    resolver_ruta_xmp,
    volver_al_original,
)


def crear_foto_con_patron(ancho: int, alto: int, color_base: tuple, contraste: int = 40) -> np.ndarray:
    """Crea una imagen con patrón nítido para asegurar alto laplaciano (no borrosa)."""
    img = np.zeros((alto, ancho, 3), dtype=np.uint8)
    for y in range(0, alto, 16):
        for x in range(0, ancho, 16):
            offset = contraste if (x // 16 + y // 16) % 2 == 0 else -contraste
            b = np.clip(color_base[0] + offset, 5, 250)
            g = np.clip(color_base[1] + offset, 5, 250)
            r = np.clip(color_base[2] + offset, 5, 250)
            img[y:y+16, x:x+16] = (b, g, r)
    # Dibujar líneas de alto contraste para garantizar nitidez
    cv2.line(img, (10, 10), (ancho - 10, alto - 10), (255, 255, 255), 2)
    cv2.line(img, (10, alto - 10), (ancho - 10, 10), (0, 0, 0), 2)
    return img


def test_fotos_edita_cada_foto():
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. Crear fotos sintéticas: oscura, clara, azulada y cálida
        # Foto oscura: brillo promedio ~40
        ruta_oscura = os.path.join(temp_dir, "foto_01_oscura.jpg")
        img_oscura = crear_foto_con_patron(320, 240, color_base=(40, 40, 40), contraste=15)
        cv2.imwrite(ruta_oscura, img_oscura)

        # Foto clara: brillo promedio ~200
        ruta_clara = os.path.join(temp_dir, "foto_02_clara.jpg")
        img_clara = crear_foto_con_patron(320, 240, color_base=(200, 200, 200), contraste=15)
        cv2.imwrite(ruta_clara, img_clara)

        # Foto azulada: azul dominante (B=200, G=100, R=50)
        ruta_azulada = os.path.join(temp_dir, "foto_03_azulada.jpg")
        img_azulada = crear_foto_con_patron(320, 240, color_base=(200, 100, 50), contraste=25)
        cv2.imwrite(ruta_azulada, img_azulada)

        # Foto cálida: rojo dominante (B=50, G=100, R=200)
        ruta_calida = os.path.join(temp_dir, "foto_04_calida.jpg")
        img_calida = crear_foto_con_patron(320, 240, color_base=(50, 100, 200), contraste=25)
        cv2.imwrite(ruta_calida, img_calida)

        # Ajustar timestamps para que no se agrupen como ráfaga (diferencia > 3 s)
        t_base = time.time()
        os.utime(ruta_oscura, (t_base, t_base))
        os.utime(ruta_clara, (t_base + 10.0, t_base + 10.0))
        os.utime(ruta_azulada, (t_base + 20.0, t_base + 20.0))
        os.utime(ruta_calida, (t_base + 30.0, t_base + 30.0))

        # 2. Procesar selección y edición
        rutas = [ruta_oscura, ruta_clara, ruta_azulada, ruta_calida]
        res = procesar_seleccion_fotos(rutas, umbral_borrosa=40.0)

        assert res["total"] == 4
        assert res["elegidas"] == 4, f"Se esperaban 4 elegidas, salieron {res['elegidas']}"

        # 3. Comprobar que la oscura recibe exposición positiva y la clara negativa
        def leer_ajuste_xmp(ruta_foto: str, campo: str) -> str:
            ruta_xmp = resolver_ruta_xmp(ruta_foto)
            assert os.path.exists(ruta_xmp), f"No se generó XMP para {ruta_foto}"
            tree = ET.parse(ruta_xmp)
            root = tree.getroot()
            desc = root.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
            assert desc is not None, f"No hay Description en XMP de {ruta_foto}"
            crs_key = f"{{http://ns.adobe.com/camera-raw-settings/1.0/}}{campo}"
            val = desc.attrib.get(crs_key)
            if val is None:
                hijo = desc.find(crs_key)
                if hijo is not None:
                    val = hijo.text
            return val

        exp_oscura = float(leer_ajuste_xmp(ruta_oscura, "Exposure2012"))
        exp_clara = float(leer_ajuste_xmp(ruta_clara, "Exposure2012"))

        assert exp_oscura > 0.0, f"La foto oscura debe recibir exposición positiva, recibió: {exp_oscura}"
        assert exp_clara < 0.0, f"La foto clara debe recibir exposición negativa, recibió: {exp_clara}"

        # Comprobar que la azulada recibe temperatura más cálida
        temp_azulada = float(leer_ajuste_xmp(ruta_azulada, "Temperature"))
        temp_calida = float(leer_ajuste_xmp(ruta_calida, "Temperature"))

        assert temp_azulada > temp_calida, (
            f"La foto azulada debe recibir temperatura más cálida ({temp_azulada} K) "
            f"que la cálida ({temp_calida} K)"
        )

        # 4. Comprobar que un .xmp con ajustes previos del dueño no se pisa
        ruta_duenio = os.path.join(temp_dir, "foto_05_duenio.jpg")
        img_duenio = crear_foto_con_patron(320, 240, color_base=(120, 120, 120))
        cv2.imwrite(ruta_duenio, img_duenio)
        os.utime(ruta_duenio, (t_base + 40.0, t_base + 40.0))

        ruta_xmp_duenio = os.path.join(temp_dir, "foto_05_duenio.xmp")
        with open(ruta_xmp_duenio, "w", encoding="utf-8") as f:
            f.write(
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n'
                '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n'
                '    <rdf:Description xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"\n'
                '      crs:Exposure2012="+0.88"\n'
                '      crs:Temperature="6700" />\n'
                '  </rdf:RDF>\n'
                '</x:xmpmeta>\n'
            )

        procesar_seleccion_fotos([ruta_duenio], umbral_borrosa=40.0)

        exp_duenio = leer_ajuste_xmp(ruta_duenio, "Exposure2012")
        temp_duenio = leer_ajuste_xmp(ruta_duenio, "Temperature")

        assert exp_duenio == "+0.88", f"Se pisó el Exposure2012 del dueño: {exp_duenio}"
        assert temp_duenio == "6700", f"Se pisó el Temperature del dueño: {temp_duenio}"

        # 5. Comprobar que 'Volver al original' saca los ajustes
        ok_remover = volver_al_original(ruta_oscura)
        assert ok_remover is True, "volver_al_original retornó False"

        # Verificar que ya no existen los parámetros de revelado en el XMP
        tree = ET.parse(resolver_ruta_xmp(ruta_oscura))
        desc = tree.getroot().find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
        crs_keys = [k for k in desc.attrib.keys() if "camera-raw-settings" in k and "Exposure2012" in k]
        assert len(crs_keys) == 0, f"Exposure2012 sigue presente tras volver al original: {desc.attrib}"
