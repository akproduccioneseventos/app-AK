# -*- coding: utf-8 -*-
"""Pruebas unitarias Orden 329 — Wfolio estaciones, portada, límite 2000, video > 500 MB y redes."""

import json
import os
import sys
import tempfile
import unittest
import zipfile

import cv2
import numpy as np
from PIL import Image

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from exportador_video import LIMITE_VIDEO_WFOLIO_BYTES, comprimir_video_para_wfolio
from wfolio import (
    MENSAJE_LIMITE_CARAS_2000,
    MENSAJE_WFOLIO_NO_ACEPTA_VIDEO,
    subir_a_wfolio,
)


def _crear_imagen_jpg(ruta: str, nitida: bool = True, color=(140, 180, 220)) -> str:
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    if nitida:
        # Patrón de alto contraste (tablero) para alta varianza del Laplaciano
        arr = np.zeros((120, 120, 3), dtype=np.uint8)
        for y in range(0, 120, 12):
            for x in range(0, 120, 12):
                if ((x // 12) + (y // 12)) % 2 == 0:
                    arr[y : y + 12, x : x + 12] = color
                else:
                    arr[y : y + 12, x : x + 12] = (30, 30, 30)
        cv2.imwrite(ruta, arr)
    else:
        img = Image.new("RGB", (120, 120), color=color)
        img.save(ruta)
    return ruta


class WfolioSimuladoEndpoint:
    """Endpoint simulado para probar configuración de proyecto, carpetas, subida y verificación."""

    def __init__(self, fallar_en: str = "", acepta_videos: bool = True):
        self.proyecto = None
        self.archivos_por_carpeta = {}
        self.intentos = []
        self.fallar_en = fallar_en
        self.acepta_videos = acepta_videos

    def configurar_proyecto(self, config):
        self.proyecto = config
        return {
            "url": f"https://wfolio.com/my/disk/privado/{config.get('fiesta_nombre', 'album').lower()}",
            "acepta_videos": self.acepta_videos,
        }

    def subir(self, foto_path, carpeta, fiesta_nombre):
        nombre = os.path.basename(foto_path)
        self.intentos.append((carpeta, nombre, foto_path))
        if self.fallar_en and nombre == self.fallar_en:
            raise ConnectionError(f"Corte simulado en {nombre}")
        tam = os.path.getsize(foto_path) if os.path.exists(foto_path) else 0
        self.archivos_por_carpeta.setdefault(carpeta, {})[nombre] = tam
        return {
            "status": "ok",
            "comprobado": True,
            "url": f"https://wfolio.com/my/disk/privado/album-{fiesta_nombre.lower()}",
        }

    def listar_carpeta(self, carpeta, fiesta_nombre):
        return self.archivos_por_carpeta.get(carpeta, {})


class TestWfolioEstacionesOrden329(unittest.TestCase):
    def test_bloque2_zip_estaciones_mismo_album_sin_carpetas_vacias_y_reanudacion(self):
        with tempfile.TemporaryDirectory() as tmp:
            carpeta_album = os.path.join(tmp, "album")
            ruta_db = os.path.join(tmp, "proyecto.sqlite")

            # Carpetas del fotógrafo + una vacía que NO debe crearse en el proyecto
            _crear_imagen_jpg(os.path.join(carpeta_album, "Exterior", "ext_01.jpg"))
            _crear_imagen_jpg(os.path.join(carpeta_album, "Fiesta", "fiesta_01.jpg"))
            os.makedirs(os.path.join(carpeta_album, "Entrada y vals"), exist_ok=True)  # vacía

            # ZIP de estaciones en subcarpeta estaciones/
            dir_estaciones = os.path.join(carpeta_album, "estaciones")
            os.makedirs(dir_estaciones, exist_ok=True)
            zip_path = os.path.join(dir_estaciones, "estaciones.zip")

            src_tmp = os.path.join(tmp, "src_zip")
            f_cab = _crear_imagen_jpg(os.path.join(src_tmp, "cabina.jpg"))
            f_inv = _crear_imagen_jpg(os.path.join(src_tmp, "invitado.jpg"))
            v_360 = os.path.join(src_tmp, "clip360.mp4")
            with open(v_360, "wb") as f:
                f.write(b"VIDEO_360_SMALL")

            with zipfile.ZipFile(zip_path, "w") as zf:
                zf.write(f_cab, "Fotocabina/cabina.jpg")
                zf.write(v_360, "Plataforma 360/clip360.mp4")
                zf.write(f_inv, "Fotos de los invitados/invitado.jpg")
                # Intento de path traversal debe ignorarse de forma segura
                zf.writestr("../escape.jpg", b"MALICIOSO")

            # Pasada 1: falla en el archivo 3 de 5 (fiesta_01.jpg)
            # Orden esperado: Exterior (ext_01.jpg), Fiesta (fiesta_01.jpg), Fotocabina, Plataforma 360, Fotos de los invitados
            sim_1 = WfolioSimuladoEndpoint(fallar_en="fiesta_01.jpg")
            res_1 = subir_a_wfolio(
                ruta_carpetas=carpeta_album,
                fiesta_nombre="Valentina",
                endpoint_simulado=sim_1,
                ruta_db=ruta_db,
            )

            self.assertFalse(res_1["exito"])
            self.assertIn("Fotocabina", res_1["carpetas_creadas"])
            self.assertIn("Plataforma 360", res_1["carpetas_creadas"])
            self.assertIn("Fotos de los invitados", res_1["carpetas_creadas"])
            self.assertNotIn("Entrada y vals", res_1["carpetas_creadas"])
            self.assertFalse(os.path.exists(os.path.join(tmp, "escape.jpg")))

            # Sólo ext_01.jpg quedó subida antes del corte en fiesta_01.jpg
            self.assertEqual(res_1["total_subidas"], 1)
            self.assertEqual([i[1] for i in sim_1.intentos], ["ext_01.jpg", "fiesta_01.jpg"])

            # Pasada 2: reanuda sin re-subir ext_01.jpg
            sim_2 = WfolioSimuladoEndpoint()
            res_2 = subir_a_wfolio(
                ruta_carpetas=carpeta_album,
                fiesta_nombre="Valentina",
                endpoint_simulado=sim_2,
                ruta_db=ruta_db,
            )

            self.assertTrue(res_2["exito"])
            self.assertEqual(res_2["total_subidas"], 5)
            nombres_pasada_2 = [i[1] for i in sim_2.intentos]
            self.assertNotIn("ext_01.jpg", nombres_pasada_2)
            self.assertEqual(
                set(nombres_pasada_2),
                {"fiesta_01.jpg", "cabina.jpg", "clip360.mp4", "invitado.jpg"},
            )

    def test_bloque2_avisa_si_wfolio_no_acepta_videos(self):
        with tempfile.TemporaryDirectory() as tmp:
            carpeta_album = os.path.join(tmp, "album")
            ruta_db = os.path.join(tmp, "proyecto.sqlite")
            _crear_imagen_jpg(os.path.join(carpeta_album, "Exterior", "ext_01.jpg"))
            ruta_360 = os.path.join(carpeta_album, "Plataforma 360", "clip_360.mp4")
            os.makedirs(os.path.dirname(ruta_360), exist_ok=True)
            with open(ruta_360, "wb") as f:
                f.write(b"MP4_TEST")

            sim = WfolioSimuladoEndpoint(acepta_videos=False)
            res = subir_a_wfolio(
                ruta_carpetas=carpeta_album,
                fiesta_nombre="Camila",
                endpoint_simulado=sim,
                ruta_db=ruta_db,
            )

            self.assertTrue(res["exito"])
            self.assertEqual(res["total_subidas"], 1)
            self.assertIn(ruta_360, res["videos_locales"])
            self.assertIn(MENSAJE_WFOLIO_NO_ACEPTA_VIDEO, res["mensaje"])
            self.assertTrue(os.path.exists(ruta_360))

    def test_bloque3_redes_respeta_permiso_y_mezcla_carpetas(self):
        with tempfile.TemporaryDirectory() as tmp:
            carpeta_album = os.path.join(tmp, "album")
            _crear_imagen_jpg(os.path.join(carpeta_album, "Exterior", "ext_01.jpg"), nitida=True)
            _crear_imagen_jpg(os.path.join(carpeta_album, "Fotocabina", "cab_01.jpg"), nitida=True)
            _crear_imagen_jpg(os.path.join(carpeta_album, "Fotos de los invitados", "inv_01.jpg"), nitida=True)

            # 1. Sin permiso de promoción: NO arma publicación
            salida_sin = os.path.join(tmp, "redes_sin_permiso")
            sim_sin = WfolioSimuladoEndpoint()
            res_sin = subir_a_wfolio(
                ruta_carpetas=carpeta_album,
                fiesta_nombre="LuciaPerez",
                endpoint_simulado=sim_sin,
                ruta_db=os.path.join(tmp, "sin_permiso.sqlite"),
                permiso_promocion=False,
                generar_redes=True,
                carpeta_salida_redes=salida_sin,
            )

            self.assertFalse(res_sin["redes"]["publicacion_armada"])
            self.assertIsNone(res_sin["redes"]["borrador"])
            self.assertFalse(os.path.exists(os.path.join(salida_sin, "borrador_redes.json")))
            self.assertIn("Sin permiso de promoción", res_sin["mensaje"])

            # 2. Con permiso de promoción: mezcla al menos 2 carpetas y crea borrador seguro
            salida_con = os.path.join(tmp, "redes_con_permiso")
            sim_con = WfolioSimuladoEndpoint()
            res_con = subir_a_wfolio(
                ruta_carpetas=carpeta_album,
                fiesta_nombre="Lucia",
                tipo_fiesta="15 años",
                fecha_evento="14/03/2027",
                endpoint_simulado=sim_con,
                ruta_db=os.path.join(tmp, "con_permiso.sqlite"),
                permiso_promocion=True,
                generar_redes=True,
                carpeta_salida_redes=salida_con,
                duracion_redes_seg=2.0,
                fps_redes=6,
            )

            self.assertTrue(res_con["redes"]["publicacion_armada"])
            carpetas_mezcladas = set(res_con["redes"]["carpetas_mezcladas"])
            self.assertGreaterEqual(len(carpetas_mezcladas), 2)

            ruta_borrador = res_con["redes"]["borrador_json"]
            self.assertTrue(os.path.exists(ruta_borrador))
            with open(ruta_borrador, "r", encoding="utf-8") as f:
                borrador = json.load(f)
            texto = borrador["texto"].lower()
            self.assertNotIn("garantía", texto)
            self.assertNotIn("garantizado", texto)
            self.assertNotIn("$", texto)
            self.assertTrue(os.path.exists(res_con["redes"]["redes_json"]))

    def test_bloque4_proyecto_portada_limite_2000_y_video_mayor_500mb(self):
        with tempfile.TemporaryDirectory() as tmp:
            # 1. Proyecto, portada preferida Exterior con mejor nota, privado y sin venta/selección
            carpeta_album = os.path.join(tmp, "album_portada")
            borrosa_ext = _crear_imagen_jpg(os.path.join(carpeta_album, "Exterior", "ext_borrosa.jpg"), nitida=False)
            nitida_ext = _crear_imagen_jpg(os.path.join(carpeta_album, "Exterior", "ext_nitida.jpg"), nitida=True)
            _crear_imagen_jpg(os.path.join(carpeta_album, "Fiesta", "fiesta_01.jpg"), nitida=True)
            os.makedirs(os.path.join(carpeta_album, "Torta y velas"), exist_ok=True)  # vacía

            # Simular video > 500 MB (600 MB sparse file)
            video_grande = os.path.join(carpeta_album, "Plataforma 360", "video_600mb.mp4")
            os.makedirs(os.path.dirname(video_grande), exist_ok=True)
            tam_600_mb = 600 * 1024 * 1024
            with open(video_grande, "wb") as f:
                f.seek(tam_600_mb - 1)
                f.write(b"\0")

            llamadas_ffmpeg = []

            def mock_ffmpeg(cmd, src, dst):
                llamadas_ffmpeg.append((cmd, src, dst))
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                with open(dst, "wb") as f_out:
                    f_out.write(b"VIDEO_H264_COMPRIMIDO_MENOR_500MB")
                return True

            sim = WfolioSimuladoEndpoint()
            res = subir_a_wfolio(
                ruta_carpetas=carpeta_album,
                fiesta_nombre="Valentina",
                tipo_fiesta="15 años",
                fecha_evento="14/03/2027",
                endpoint_simulado=sim,
                ruta_db=os.path.join(tmp, "portada.sqlite"),
                ejecutador_ffmpeg=mock_ffmpeg,
            )

            self.assertTrue(res["exito"])
            self.assertEqual(res["nombre_proyecto"], "Valentina · 15 años · 14/03/2027")
            self.assertTrue(res["privado"])
            self.assertFalse(res["seleccion_cliente"])
            self.assertFalse(res["venta_fotos"])
            self.assertTrue(res["reconocimiento_caras"])
            self.assertNotIn("Torta y velas", res["carpetas_creadas"])
            self.assertEqual(res["portada"]["foto"], nitida_ext)
            self.assertNotEqual(res["portada"]["foto"], borrosa_ext)

            # Verificar que comprimió el video de 600 MB antes de subir
            self.assertEqual(len(llamadas_ffmpeg), 1)
            self.assertIn("libx264", llamadas_ffmpeg[0][0])
            self.assertEqual(len(res["videos_comprimidos"]), 1)
            ruta_comprimida = res["videos_comprimidos"][0]["comprimido"]
            self.assertLess(os.path.getsize(ruta_comprimida), LIMITE_VIDEO_WFOLIO_BYTES)
            # Confirmar que se subió el archivo comprimido, no el original de 600 MB
            subidas_360 = [i for i in sim.intentos if i[0] == "Plataforma 360"]
            self.assertEqual(len(subidas_360), 1)
            self.assertEqual(subidas_360[0][2], ruta_comprimida)

            # 2. Más de 2000 fotos (2500) -> apaga reconocimiento de caras y lo avisa
            carpeta_2500 = os.path.join(tmp, "album_2500")
            dir_fiesta = os.path.join(carpeta_2500, "Fiesta")
            os.makedirs(dir_fiesta, exist_ok=True)
            for idx in range(2500):
                with open(os.path.join(dir_fiesta, f"f_{idx:04d}.jpg"), "wb") as f:
                    f.write(b"\xff\xd8\xff\xd9")

            sim_2500 = WfolioSimuladoEndpoint()
            res_2500 = subir_a_wfolio(
                ruta_carpetas=carpeta_2500,
                fiesta_nombre="MegaFiesta",
                endpoint_simulado=sim_2500,
                ruta_db=os.path.join(tmp, "mega.sqlite"),
                evaluador_nota=lambda _r: 5.0,
            )

            self.assertEqual(res_2500["total_fotos"], 2500)
            self.assertFalse(res_2500["reconocimiento_caras"])
            self.assertIn(MENSAJE_LIMITE_CARAS_2000, res_2500["avisos"])
            self.assertIn(MENSAJE_LIMITE_CARAS_2000, res_2500["mensaje"])

    def test_exportador_comprimir_video_para_wfolio_directo(self):
        with tempfile.TemporaryDirectory() as tmp:
            video = os.path.join(tmp, "gran_video.mov")
            with open(video, "wb") as f:
                f.write(b"DUMMY")
            res = comprimir_video_para_wfolio(
                ruta_video=video,
                tamano_actual_bytes=600 * 1024 * 1024,
                dry_run=True,
            )
            self.assertTrue(res["exito"])
            self.assertTrue(res["comprimido"])
            self.assertTrue(res["wfolio_compatible"])
            self.assertIn("libx264", res["cmd"])
            self.assertLess(res["tamano_bytes"], LIMITE_VIDEO_WFOLIO_BYTES)


if __name__ == "__main__":
    unittest.main()
