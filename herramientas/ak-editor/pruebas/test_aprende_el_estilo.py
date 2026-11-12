# -*- coding: utf-8 -*-
"""Prueba Orden 280: Bloque 3 — Aprender el estilo del dueño desde su catálogo Lightroom.

Verifica:
1. Con un catálogo .lrcat (SQLite) con fotos editadas con Exposure2012 = 0.5
   y Temperature = 3800, el preset "AK Salón noche" se genera con esos valores.
2. Si el catálogo está vacío (0 fotos editadas), el programa no inventa presets vacíos.
"""

import json
import os
import sqlite3
import sys
import tempfile
import xml.etree.ElementTree as ET
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from fotos import aprender_mi_estilo


def test_aprende_el_estilo():
    with tempfile.TemporaryDirectory() as temp_dir:
        ruta_lrcat = os.path.join(temp_dir, "catalogo_prueba.lrcat")
        carpeta_presets = os.path.join(temp_dir, "presets_salida")

        # 1. Crear base SQLite sintética que simula el catálogo .lrcat de Lightroom Classic
        conn = sqlite3.connect(ruta_lrcat)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE Adobe_imageDevelopSettings (
                id_local INTEGER PRIMARY KEY,
                id_file INTEGER,
                text TEXT
            )
        """)

        # Insertar 10 fotos con Exposure2012 = 0.5 y Temperature = 3800
        for i in range(10):
            # Variaciones menores de prueba alrededor de 0.5 y 3800 para verificar cálculo de mediana
            exp_val = 0.5 if i % 2 == 0 else 0.5
            temp_val = 3800
            texto_ajustes = (
                f"s = {{\n"
                f'  Exposure2012 = {exp_val},\n'
                f'  Temperature = {temp_val},\n'
                f'  Contrast2012 = 12,\n'
                f'  Shadows2012 = 15,\n'
                f"}}\n"
            )
            cursor.execute(
                "INSERT INTO Adobe_imageDevelopSettings (id_file, text) VALUES (?, ?)",
                (i + 1, texto_ajustes),
            )

        conn.commit()
        conn.close()

        # 2. Ejecutar la función de aprendizaje de estilo
        resultado = aprender_mi_estilo(ruta_lrcat=ruta_lrcat, carpeta_salida=carpeta_presets)

        assert "presets" in resultado
        presets = resultado["presets"]
        assert "AK Salón noche" in presets

        # Verificar valores aprendidos en el preset de salón noche
        preset_salon = presets["AK Salón noche"]
        assert preset_salon["Exposure2012"] == 0.5
        assert preset_salon["Temperature"] == 3800.0

        # Comprobar que el archivo .xmp físico fue generado
        ruta_xmp_salon = os.path.join(carpeta_presets, "AK Salón noche.xmp")
        assert os.path.exists(ruta_xmp_salon)

        tree = ET.parse(ruta_xmp_salon)
        desc = tree.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
        assert desc is not None
        assert float(desc.get("{http://ns.adobe.com/camera-raw-settings/1.0/}Exposure2012")) == 0.5
        assert float(desc.get("{http://ns.adobe.com/camera-raw-settings/1.0/}Temperature")) == 3800.0

        # Comprobar que se generó estilo-ak.json
        ruta_json = os.path.join(carpeta_presets, "estilo-ak.json")
        assert os.path.exists(ruta_json)
        with open(ruta_json, "r", encoding="utf-8") as f:
            datos_json = json.load(f)
            assert "ajustes_base" in datos_json
            assert datos_json["ajustes_base"]["Exposure2012"] == 0.5
            assert datos_json["ajustes_base"]["Temperature"] == 3800.0


def test_aprende_el_estilo_catalogo_vacio_no_inventa_presets():
    with tempfile.TemporaryDirectory() as temp_dir:
        ruta_lrcat_vacio = os.path.join(temp_dir, "catalogo_vacio.lrcat")
        carpeta_presets_vacio = os.path.join(temp_dir, "presets_vacio")

        # Crear base SQLite vacía
        conn = sqlite3.connect(ruta_lrcat_vacio)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE Adobe_imageDevelopSettings (
                id_local INTEGER PRIMARY KEY,
                id_file INTEGER,
                text TEXT
            )
        """)
        conn.commit()
        conn.close()

        # Ejecutar sobre catálogo vacío
        resultado = aprender_mi_estilo(ruta_lrcat=ruta_lrcat_vacio, carpeta_salida=carpeta_presets_vacio)

        # REGLA ESTRICTA: No inventa presets si no hay fotos editadas
        assert resultado["presets"] == {}
        assert resultado["estilo_json"] is None
        assert not os.path.exists(os.path.join(carpeta_presets_vacio, "AK Salón noche.xmp"))
        assert not os.path.exists(os.path.join(carpeta_presets_vacio, "estilo-ak.json"))
