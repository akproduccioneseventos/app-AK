# -*- coding: utf-8 -*-
"""Prueba Orden 280: Bloque 1 — Selección automática de fotos sin tocar originales.

Crea fotos sintéticas:
- Una foto nítida.
- Una foto borrosa.
- Dos fotos repetidas sacadas con 1 s de diferencia.
- Una foto negra/oscura.

Verifica:
1. Rechazo de la borrosa, de la negra y de la peor repetida.
2. Selección con 5 estrellas de la nítida y de la mejor repetida.
3. Preservación absoluta de la huella SHA256 de todos los originales (no se tocan).
4. Preservación de metadatos existentes en un .xmp previo del usuario.
"""

import hashlib
import os
import sys
import tempfile
import time
from datetime import datetime, timedelta
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
    calcular_sha256,
    procesar_seleccion_fotos,
    resolver_ruta_xmp,
)


def crear_imagen_nitida(ancho: int = 400, alto: int = 300) -> np.ndarray:
    """Genera una imagen sintética nítida con alto contraste y bordes definidos."""
    img = np.full((alto, ancho, 3), 128, dtype=np.uint8)
    # Patrón de tablero y líneas de alto contraste
    for y in range(0, alto, 30):
        for x in range(0, ancho, 30):
            if (x // 30 + y // 30) % 2 == 0:
                img[y:y+30, x:x+30] = (220, 220, 220)
            else:
                img[y:y+30, x:x+30] = (30, 30, 30)
    # Dibujar círculos y líneas nítidas
    cv2.circle(img, (ancho // 2, alto // 2), 60, (0, 0, 255), 3)
    cv2.line(img, (10, 10), (ancho - 10, alto - 10), (255, 255, 0), 2)
    return img


def test_fotos_elige():
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. Crear foto nítida
        ruta_nitida = os.path.join(temp_dir, "foto_01_nitida.jpg")
        img_nitida = crear_imagen_nitida()
        cv2.imwrite(ruta_nitida, img_nitida)

        # 2. Crear foto borrosa (desenfoque fuerte sobre la nítida)
        ruta_borrosa = os.path.join(temp_dir, "foto_02_borrosa.jpg")
        img_borrosa = cv2.GaussianBlur(img_nitida, (45, 45), 20.0)
        cv2.imwrite(ruta_borrosa, img_borrosa)

        # 3. Crear dos fotos repetidas (mismo encuadre base) con 1 s de diferencia temporal
        ruta_rep_1 = os.path.join(temp_dir, "foto_03_repetida_mejor.jpg")
        ruta_rep_2 = os.path.join(temp_dir, "foto_04_repetida_peor.jpg")

        img_rep = crear_imagen_nitida()
        # Repetida 1: muy nítida
        cv2.imwrite(ruta_rep_1, img_rep)
        # Repetida 2: ligeramente más suave/desenfocada
        img_rep_peor = cv2.GaussianBlur(img_rep, (9, 9), 3.0)
        cv2.imwrite(ruta_rep_2, img_rep_peor)

        # 4. Crear foto negra/oscura
        ruta_negra = os.path.join(temp_dir, "foto_05_negra.jpg")
        img_negra = np.zeros((300, 400, 3), dtype=np.uint8)
        cv2.imwrite(ruta_negra, img_negra)

        # Ajustar timestamps de archivo:
        # foto_nitida, foto_borrosa y foto_negra están distantes (> 10s) para no agruparse por ráfaga
        # foto_rep_1 y foto_rep_2 están a exactamente 1 s de diferencia (< 3s) para agruparse como ráfaga
        tiempo_base = time.time()
        os.utime(ruta_nitida, (tiempo_base - 100.0, tiempo_base - 100.0))
        os.utime(ruta_borrosa, (tiempo_base - 50.0, tiempo_base - 50.0))
        os.utime(ruta_rep_1, (tiempo_base, tiempo_base))
        os.utime(ruta_rep_2, (tiempo_base + 1.0, tiempo_base + 1.0))
        os.utime(ruta_negra, (tiempo_base + 50.0, tiempo_base + 50.0))

        # 5. Crear un archivo .xmp previo del dueño para foto_01_nitida
        ruta_xmp_previo = os.path.join(temp_dir, "foto_01_nitida.xmp")
        xmp_previo_contenido = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n'
            ' <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n'
            '  <rdf:Description rdf:about=""\n'
            '    xmlns:xmp="http://ns.adobe.com/xap/1.0/"\n'
            '    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"\n'
            '    xmp:CreatorTool="Nikon D750 Firmware 1.2"\n'
            '    crs:NotaDelDuenio="FotoClaveEvento">\n'
            '  </rdf:Description>\n'
            ' </rdf:RDF>\n'
            '</x:xmpmeta>'
        )
        with open(ruta_xmp_previo, "w", encoding="utf-8") as f:
            f.write(xmp_previo_contenido)

        # 6. Guardar huellas SHA256 originales de todos los archivos de imagen
        rutas_totales = [ruta_nitida, ruta_borrosa, ruta_rep_1, ruta_rep_2, ruta_negra]
        hashes_iniciales = {r: calcular_sha256(r) for r in rutas_totales}

        # 7. Ejecutar la selección automática
        resultado = procesar_seleccion_fotos(rutas_totales, umbral_borrosa=100.0)

        assert resultado["total"] == 5
        detalles_map = {d["ruta"]: d for d in resultado["detalles"]}

        # Comprobar decisiones
        # Foto nítida: elegida
        assert detalles_map[ruta_nitida]["estado"] == "elegida"

        # Foto borrosa: rechazada
        assert detalles_map[ruta_borrosa]["estado"] == "rechazada"
        assert "Borrosa" in detalles_map[ruta_borrosa]["motivo_rechazo"]

        # Foto negra: rechazada
        assert detalles_map[ruta_negra]["estado"] == "rechazada"
        assert "oscura" in detalles_map[ruta_negra]["motivo_rechazo"].lower()

        # Fotos repetidas: la mejor elegida, la peor rechazada
        assert detalles_map[ruta_rep_1]["estado"] == "elegida"
        assert detalles_map[ruta_rep_2]["estado"] == "rechazada"
        assert "repetida" in detalles_map[ruta_rep_2]["motivo_rechazo"].lower()

        # 8. REGLA ESTRICTA: Ningún archivo original fue alterado ni un solo byte
        for r in rutas_totales:
            hash_actual = calcular_sha256(r)
            assert hash_actual == hashes_iniciales[r], (
                f"La foto original {os.path.basename(r)} fue modificada. "
                f"Esperado: {hashes_iniciales[r]} | Actual: {hash_actual}"
            )

        # 9. Verificar que los .xmp fueron creados y contienen las etiquetas correctas
        for r in rutas_totales:
            ruta_xmp = resolver_ruta_xmp(r)
            assert os.path.exists(ruta_xmp), f"No se generó el .xmp para {os.path.basename(r)}"

            tree = ET.parse(ruta_xmp)
            desc = tree.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
            assert desc is not None

            rating = desc.get("{http://ns.adobe.com/xap/1.0/}Rating")
            label = desc.get("{http://ns.adobe.com/xap/1.0/}Label")

            if detalles_map[r]["estado"] == "elegida":
                assert rating == "5", f"Foto elegida {os.path.basename(r)} no tiene Rating 5"
                assert label != "Rechazada"
            else:
                assert rating == "0", f"Foto rechazada {os.path.basename(r)} no tiene Rating 0"
                assert label == "Rechazada", f"Foto rechazada {os.path.basename(r)} no tiene Label Rechazada"

        # 10. REGLA DE PRESERVACIÓN: El .xmp previo no perdió los datos del dueño
        tree_previo = ET.parse(ruta_xmp_previo)
        desc_previo = tree_previo.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
        assert desc_previo.get("{http://ns.adobe.com/xap/1.0/}CreatorTool") == "Nikon D750 Firmware 1.2"
        assert desc_previo.get("{http://ns.adobe.com/camera-raw-settings/1.0/}NotaDelDuenio") == "FotoClaveEvento"
        # Y se le sumaron los nuevos campos
        assert desc_previo.get("{http://ns.adobe.com/xap/1.0/}Rating") == "5"
