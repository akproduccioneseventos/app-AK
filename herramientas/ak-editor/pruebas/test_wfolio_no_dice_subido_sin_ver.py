# -*- coding: utf-8 -*-
"""Prueba unitaria: Wfolio no marca 'subido' sin comprobar el archivo en la carpeta remota (Orden 288 Bloque 4).

Valida que:
1. Con un servidor simulado que no muestra el archivo en la carpeta remota (o no se puede comprobar):
   - El estado en SQLite queda 'pendiente' con su motivo.
   - La foto NO figura como 'subida'.
   - El mensaje final dice cuántas se comprobaron (0) y NO dice 'completó'.
   - 'exito' es False.
2. Con el servidor simulado que sí muestra el archivo (con nombre y tamaño):
   - El estado en SQLite queda 'subido'.
   - La foto figura en 'subidas' y el mensaje final dice cuántas se comprobaron.
"""

import http.server
import json
import os
import sqlite3
import sys
import tempfile
import threading
from typing import Dict, List
import pytest
from PIL import Image

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from wfolio import subir_a_wfolio


def _crear_foto(ruta: str) -> str:
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    img = Image.new("RGB", (60, 60), color=(120, 180, 240))
    img.save(ruta)
    return ruta


def test_wfolio_no_dice_subido_sin_ver_con_servidor_simulado():
    """Valida que si el servidor simulado no muestra el archivo en la carpeta remota, queda pendiente."""
    with tempfile.TemporaryDirectory() as temp_dir:
        carpetas_root = os.path.join(temp_dir, "entrega")
        carpeta_fiesta = os.path.join(carpetas_root, "Fiesta")
        ruta_db = os.path.join(temp_dir, "wfolio_checkpoint.sqlite")
        os.makedirs(carpeta_fiesta, exist_ok=True)

        foto_path = os.path.join(carpeta_fiesta, "foto_01.jpg")
        _crear_foto(foto_path)
        nombre_arch = "foto_01.jpg"

        fiesta_nombre = "XV_Sofia"

        # Servidor HTTP simulado que acepta la subida pero NO muestra el archivo en la carpeta remota
        archivos_en_servidor: List[Dict[str, any]] = []

        class HandlerSimulado(http.server.BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                return

            def do_POST(self):
                # Acepta el POST de subida
                content_len = int(self.headers.get("Content-Length", 0))
                _ = self.rfile.read(content_len)
                # Responde OK pero NO agrega el archivo a la lista remota
                cuerpo = json.dumps({
                    "status": "ok",
                    "url": "https://wfolio.com/my/disk/privado/xv-sofia",
                    "archivos_en_carpeta": archivos_en_servidor,  # Vacío
                }).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(cuerpo)))
                self.end_headers()
                self.wfile.write(cuerpo)

            def do_GET(self):
                # Consulta GET para listar archivos de la carpeta
                cuerpo = json.dumps({
                    "status": "ok",
                    "archivos": archivos_en_servidor,  # Vacío
                }).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(cuerpo)))
                self.end_headers()
                self.wfile.write(cuerpo)

        httpd = http.server.HTTPServer(("127.0.0.1", 0), HandlerSimulado)
        puerto = httpd.server_address[1]
        server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        server_thread.start()

        endpoint_url = f"http://127.0.0.1:{puerto}/subir"

        try:
            # 1. Primera corrida: el servidor NO muestra el archivo en la carpeta remota
            resumen = subir_a_wfolio(
                ruta_carpetas=carpetas_root,
                fiesta_nombre=fiesta_nombre,
                endpoint_simulado=endpoint_url,
                ruta_db=ruta_db,
            )

            # Validar que NO dice 'completó' ni 'completo'
            mensaje = resumen.get("mensaje", "")
            assert "completó" not in mensaje.lower(), f"El mensaje no debe decir 'completó', dijo: {mensaje}"
            assert "completo" not in mensaje.lower(), f"El mensaje no debe decir 'completo', dijo: {mensaje}"

            # El mensaje final debe decir cuántas se comprobaron (0)
            assert "0 fotos" in mensaje or "Se comprobaron 0" in mensaje, (
                f"El mensaje debe indicar que se comprobaron 0 fotos, dijo: {mensaje}"
            )

            # Validar resultados en el diccionario de resumen
            assert resumen["exito"] is False, "El resultado general no debe ser éxito"
            assert resumen["total_subidas"] == 0, "No debe contabilizar subidas si no se comprobaron"
            assert resumen["total_comprobadas"] == 0, "Las comprobadas deben ser 0"
            assert len(resumen["subidas"]) == 0, "La lista de subidas debe estar vacía"

            # La foto debe estar registrada en pendientes
            nombres_pendientes = [p["nombre"] for p in resumen["pendientes"]]
            assert nombre_arch in nombres_pendientes, (
                f"La foto {nombre_arch} debe figurar en pendientes, pendientes: {resumen['pendientes']}"
            )

            # Validar en la base de datos SQLite directamente
            con = sqlite3.connect(ruta_db)
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(
                "SELECT estado, error FROM wfolio_subidas WHERE fiesta_nombre = ? AND nombre_archivo = ?",
                (fiesta_nombre, nombre_arch),
            )
            fila = cur.fetchone()
            con.close()

            assert fila is not None, "Debe existir registro en SQLite"
            assert fila["estado"] == "pendiente", f"El estado debe ser 'pendiente', pero fue: {fila['estado']}"
            assert len(fila["error"]) > 0, "Debe contener el motivo por el cual quedó pendiente"

            # 2. Segunda corrida: ahora el servidor SÍ muestra el archivo con su nombre y tamaño
            tamano_real = os.path.getsize(foto_path)
            archivos_en_servidor.append({
                "nombre": nombre_arch,
                "tamano": tamano_real,
            })

            resumen_2 = subir_a_wfolio(
                ruta_carpetas=carpetas_root,
                fiesta_nombre=fiesta_nombre,
                endpoint_simulado=endpoint_url,
                ruta_db=ruta_db,
            )

            # Ahora sí se comprobó
            assert resumen_2["exito"] is True
            assert resumen_2["total_subidas"] == 1
            assert resumen_2["total_comprobadas"] == 1
            assert len(resumen_2["subidas"]) == 1
            assert resumen_2["subidas"][0]["nombre"] == nombre_arch
            assert "Se comprobaron 1 fotos" in resumen_2["mensaje"]

            # Verificar que en SQLite se actualizó a 'subido'
            con = sqlite3.connect(ruta_db)
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(
                "SELECT estado FROM wfolio_subidas WHERE fiesta_nombre = ? AND nombre_archivo = ?",
                (fiesta_nombre, nombre_arch),
            )
            fila_2 = cur.fetchone()
            con.close()
            assert fila_2["estado"] == "subido"

        finally:
            httpd.shutdown()
            httpd.server_close()

