# -*- coding: utf-8 -*-
"""Prueba unitaria: Reparto de fotos en carpetas de entrega (Orden 281).

Valida que:
1. Fotos sintéticas con distintas horas y escenas caigan en las carpetas correctas:
   'Exterior', 'Fiesta' y 'Torta y velas'.
2. Un archivo JPG exportado con el mismo nombre base que el original caiga en la
   carpeta asignada a su original.
"""

import os
import sys
import tempfile
import pytest
from PIL import Image

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from wfolio import repartir_en_carpetas


def _crear_foto_sintetica(ruta: str, color=(200, 200, 200), tamanio=(80, 60)) -> str:
    """Crea una imagen sintética en disco (compatible con crudos y JPGs)."""
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    ext = os.path.splitext(ruta)[1].lower()
    if ext in (".jpg", ".jpeg", ".png"):
        img = Image.new("RGB", tamanio, color=color)
        img.save(ruta)
    else:
        # Para crudos como .nef, simulamos un archivo de cámara
        with open(ruta, "wb") as f:
            f.write(b"RAW_NIKON_SIMULADO_" + bytes([color[0], color[1], color[2]]) * 50)
    return ruta


def test_reparte_en_carpetas_escenas_y_mapeo_exportado():
    with tempfile.TemporaryDirectory() as temp_dir:
        origen_dir = os.path.join(temp_dir, "origen")
        destino_dir = os.path.join(temp_dir, "entrega")
        ruta_db = os.path.join(temp_dir, "test_evento.sqlite")
        os.makedirs(origen_dir, exist_ok=True)
        os.makedirs(destino_dir, exist_ok=True)

        # 1. Crear fotos sintéticas con horas y características distintas
        # Exterior: luz de día sin flash a las 17:30
        ruta_ext_nef = os.path.join(origen_dir, "DSC_1001.nef")
        _crear_foto_sintetica(ruta_ext_nef, color=(180, 220, 255))

        # Fiesta: tanda de baile a las 23:45
        ruta_fiesta_nef = os.path.join(origen_dir, "DSC_2002.nef")
        _crear_foto_sintetica(ruta_fiesta_nef, color=(255, 100, 150))

        # Torta y velas: baja luz y velas a las 03:30
        ruta_torta_nef = os.path.join(origen_dir, "DSC_3003.nef")
        _crear_foto_sintetica(ruta_torta_nef, color=(40, 20, 10))

        # JPG exportado con el mismo nombre base que el original de exterior
        ruta_ext_jpg = os.path.join(origen_dir, "DSC_1001.jpg")
        _crear_foto_sintetica(ruta_ext_jpg, color=(180, 220, 255))

        # Metadatos para las fotos de prueba
        fotos_input = [
            {
                "ruta": ruta_ext_nef,
                "nombre": "DSC_1001.nef",
                "hora": "17:30",
                "flash": False,
                "luminosidad": 140.0,
            },
            {
                "ruta": ruta_fiesta_nef,
                "nombre": "DSC_2002.nef",
                "hora": "23:45",
                "flash": True,
                "luminosidad": 95.0,
            },
            {
                "ruta": ruta_torta_nef,
                "nombre": "DSC_3003.nef",
                "hora": "03:30",
                "flash": False,
                "luminosidad": 35.0,
            },
            {
                "ruta": ruta_ext_jpg,
                "nombre": "DSC_1001.jpg",
                # Sin metadatos para validar que hereda la carpeta de su original DSC_1001
            },
        ]

        # 2. Ejecutar repartir_en_carpetas
        resultado = repartir_en_carpetas(
            fotos=fotos_input,
            ruta_destino=destino_dir,
            fiesta_nombre="Fiesta_15_Sofi",
            ruta_db=ruta_db,
        )

        # 3. Verificar que caigan en "Exterior", "Fiesta" y "Torta y velas"
        assert len(resultado["Exterior"]) >= 1, "Debe existir al menos una foto en Exterior"
        assert len(resultado["Fiesta"]) >= 1, "Debe existir al menos una foto en Fiesta"
        assert len(resultado["Torta y velas"]) >= 1, "Debe existir al menos una foto en Torta y velas"

        # Verificar físicamente los archivos en las subcarpetas del destino
        archivo_ext_nef_dest = os.path.join(destino_dir, "Exterior", "DSC_1001.nef")
        archivo_fiesta_dest = os.path.join(destino_dir, "Fiesta", "DSC_2002.nef")
        archivo_torta_dest = os.path.join(destino_dir, "Torta y velas", "DSC_3003.nef")

        assert os.path.exists(archivo_ext_nef_dest), "El original de exterior no fue copiado a Exterior"
        assert os.path.exists(archivo_fiesta_dest), "El archivo de fiesta no fue copiado a Fiesta"
        assert os.path.exists(archivo_torta_dest), "El archivo de torta no fue copiado a Torta y velas"

        # 4. Verificar que el JPG exportado (DSC_1001.jpg) caiga en la misma carpeta que su original (Exterior)
        archivo_ext_jpg_dest = os.path.join(destino_dir, "Exterior", "DSC_1001.jpg")
        assert os.path.exists(archivo_ext_jpg_dest), (
            f"El JPG exportado con nombre base DSC_1001 no cayó en Exterior. "
            f"Archivos en Exterior: {os.listdir(os.path.join(destino_dir, 'Exterior'))}"
        )

        nombres_exterior = [os.path.basename(p) for p in resultado["Exterior"]]
        assert "DSC_1001.nef" in nombres_exterior
        assert "DSC_1001.jpg" in nombres_exterior


def test_reparte_en_carpetas_exportados_posteriores_a_traves_de_db():
    """Valida que si se procesan los originales primero y luego los exportados, se respete la carpeta."""
    with tempfile.TemporaryDirectory() as temp_dir:
        origen_dir = os.path.join(temp_dir, "crudos")
        exportados_dir = os.path.join(temp_dir, "exportados")
        destino_dir = os.path.join(temp_dir, "entrega")
        ruta_db = os.path.join(temp_dir, "evento_continuado.sqlite")

        # Original de torta
        torta_crudo = os.path.join(origen_dir, "FOTO_888.nef")
        _crear_foto_sintetica(torta_crudo, color=(30, 20, 10))

        # Pasada 1: Clasificar original
        repartir_en_carpetas(
            fotos=[{"ruta": torta_crudo, "nombre": "FOTO_888.nef", "escena": "torta y velas"}],
            ruta_destino=destino_dir,
            fiesta_nombre="Boda_Ana_y_Leo",
            ruta_db=ruta_db,
        )

        # Pasada 2: Llega el exportado JPG desde Lightroom a la carpeta de exportados
        torta_jpg = os.path.join(exportados_dir, "FOTO_888.jpg")
        _crear_foto_sintetica(torta_jpg, color=(30, 20, 10))

        resultado_2 = repartir_en_carpetas(
            fotos=[torta_jpg],
            ruta_destino=destino_dir,
            fiesta_nombre="Boda_Ana_y_Leo",
            ruta_db=ruta_db,
        )

        assert os.path.exists(os.path.join(destino_dir, "Torta y velas", "FOTO_888.jpg")), (
            "El JPG exportado posterior debe caer en 'Torta y velas' siguiendo el mapeo en SQLite del original"
        )
        assert "FOTO_888.jpg" in [os.path.basename(p) for p in resultado_2["Torta y velas"]]
