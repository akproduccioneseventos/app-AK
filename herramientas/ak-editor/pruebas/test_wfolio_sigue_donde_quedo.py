# -*- coding: utf-8 -*-
"""Prueba unitaria: Persistencia y reanudación ('sigue donde quedó') en Wfolio (Orden 281).

Valida que:
1. Con un endpoint/mock local que simula fallo en la foto 3 de 5:
   - En la primera pasada sube 1 y 2, y falla en 3.
   - El resumen no dice 'subido' para las que fallaron.
2. En la segunda pasada, reanuda donde quedó y sólo intenta subir la 3, 4 y 5.
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

from wfolio import subir_a_wfolio


def _crear_foto(ruta: str) -> str:
    """Crea una imagen válida en disco."""
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    img = Image.new("RGB", (40, 40), color=(100, 150, 200))
    img.save(ruta)
    return ruta


def test_wfolio_sigue_donde_quedo_tras_fallo():
    with tempfile.TemporaryDirectory() as temp_dir:
        carpetas_root = os.path.join(temp_dir, "entrega")
        carpeta_fiesta = os.path.join(carpetas_root, "Fiesta")
        ruta_db = os.path.join(temp_dir, "wfolio_checkpoint.sqlite")
        os.makedirs(carpeta_fiesta, exist_ok=True)

        # Crear 5 fotos sintéticas ordenadas
        nombres = [f"foto_{i:02d}.jpg" for i in range(1, 6)]
        for nombre in nombres:
            _crear_foto(os.path.join(carpeta_fiesta, nombre))

        fiesta_nombre = "Fiesta_15_Martina"

        # --- PRIMERA PASADA ---
        # Simula fallo de conexión en la foto 3
        intentos_pasada_1 = []

        def mock_endpoint_pasada_1(foto_path, carpeta, fiesta):
            nombre = os.path.basename(foto_path)
            intentos_pasada_1.append(nombre)
            if nombre == "foto_03.jpg":
                # Simular corte o error de red
                raise ConnectionError("Fallo simulado de conexión en foto_03.jpg")
            return {
                "status": "ok",
                "url": f"https://wfolio.com/my/disk/privado/fiesta-15-martina",
            }

        resumen_1 = subir_a_wfolio(
            ruta_carpetas=carpetas_root,
            fiesta_nombre=fiesta_nombre,
            endpoint_simulado=mock_endpoint_pasada_1,
            ruta_db=ruta_db,
        )

        # Validaciones de la pasada 1:
        # Intentó 1, 2 y 3
        assert intentos_pasada_1 == ["foto_01.jpg", "foto_02.jpg", "foto_03.jpg"], (
            f"Se esperaba intento en 1, 2 y 3, pero se intentó: {intentos_pasada_1}"
        )

        nombres_subidos_1 = [s["nombre"] for s in resumen_1["subidas"]]
        nombres_fallidos_1 = [f["nombre"] for f in resumen_1["fallidas"]]

        # Sube 1 y 2
        assert "foto_01.jpg" in nombres_subidos_1
        assert "foto_02.jpg" in nombres_subidos_1

        # Falla en 3
        assert "foto_03.jpg" in nombres_fallidos_1

        # El resumen NO debe decir 'subido' para las que fallaron o no se subieron
        assert "foto_03.jpg" not in nombres_subidos_1, "La foto 3 falló y no debe figurar como subida"
        assert "foto_04.jpg" not in nombres_subidos_1, "La foto 4 no fue subida y no debe figurar en subidas"
        assert "foto_05.jpg" not in nombres_subidos_1, "La foto 5 no fue subida y no debe figurar en subidas"

        assert resumen_1["total_subidas"] == 2
        assert resumen_1["total_fallidas"] >= 1
        assert resumen_1["exito"] is False
        assert "https://wfolio.com/my/disk/privado/fiesta-15-martina" in resumen_1["enlace_privado"]

        # --- SEGUNDA PASADA ---
        # Conexión restaurada; ahora debe reanudar y solo intentar 3, 4 y 5
        intentos_pasada_2 = []

        def mock_endpoint_pasada_2(foto_path, carpeta, fiesta):
            nombre = os.path.basename(foto_path)
            intentos_pasada_2.append(nombre)
            return {
                "status": "ok",
                "url": f"https://wfolio.com/my/disk/privado/fiesta-15-martina",
            }

        resumen_2 = subir_a_wfolio(
            ruta_carpetas=carpetas_root,
            fiesta_nombre=fiesta_nombre,
            endpoint_simulado=mock_endpoint_pasada_2,
            ruta_db=ruta_db,
        )

        # Validar que NO re-sube la 1 ni la 2
        assert "foto_01.jpg" not in intentos_pasada_2, "foto_01.jpg ya estaba subida y no debe reintentarse"
        assert "foto_02.jpg" not in intentos_pasada_2, "foto_02.jpg ya estaba subida y no debe reintentarse"

        # Solo intenta subir la 3, 4 y 5
        assert intentos_pasada_2 == ["foto_03.jpg", "foto_04.jpg", "foto_05.jpg"], (
            f"La segunda pasada debió intentar exactamente ['foto_03.jpg', 'foto_04.jpg', 'foto_05.jpg'], "
            f"pero intentó: {intentos_pasada_2}"
        )

        # Resumen final de la segunda corrida
        nombres_subidos_2 = [s["nombre"] for s in resumen_2["subidas"]]
        assert "foto_03.jpg" in nombres_subidos_2
        assert "foto_04.jpg" in nombres_subidos_2
        assert "foto_05.jpg" in nombres_subidos_2

        assert resumen_2["total_subidas"] == 5, "Al finalizar la segunda corrida deben estar las 5 subidas"
        assert resumen_2["total_fallidas"] == 0, "No deben quedar fotos fallidas"
        assert resumen_2["exito"] is True
