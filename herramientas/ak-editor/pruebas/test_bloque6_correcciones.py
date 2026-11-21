# -*- coding: utf-8 -*-
import datetime
import json
import os
import tempfile

import app as ak_app
import fotos
import video_de_vida


def test_volver_al_original_restaura_respaldo_xmp():
    with tempfile.TemporaryDirectory() as tmp:
        foto = os.path.join(tmp, "DSC_0001.jpg")
        with open(foto, "wb") as f:
            f.write(b"fakejpg")

        xmp = os.path.join(tmp, "DSC_0001.xmp")
        xmp_inicial = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<x:xmpmeta xmlns:x="adobe:ns:meta/">'
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
            '<rdf:Description rdf:about="" '
            'xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" '
            'crs:Exposure2012="+0.50" />'
            '</rdf:RDF></x:xmpmeta>'
        )
        with open(xmp, "w", encoding="utf-8") as f:
            f.write(xmp_inicial)

        fotos.actualizar_o_crear_xmp(
            foto,
            rating=5,
            parametros_develop={"Exposure2012": "+1.25", "Temperature": "5500"},
        )
        assert os.path.exists(xmp + ".ak_backup")
        with open(xmp, encoding="utf-8") as f:
            editado = f.read()
        assert "5500" in editado

        assert fotos.volver_al_original(foto) is True
        with open(xmp, encoding="utf-8") as f:
            restaurado = f.read()
        assert "+0.50" in restaurado
        assert "5500" not in restaurado


def test_sanitizar_nombre_evento_y_bind_local():
    limpio = ak_app._sanitizar_nombre_evento("../secreto/fiesta:15")
    assert ".." not in limpio
    assert "/" not in limpio
    assert ":" not in limpio
    assert limpio == "secreto_fiesta_15"
    assert ak_app._sanitizar_nombre_evento("") == "Evento_AK"
    with open(os.path.join(os.path.dirname(ak_app.__file__), "app.py"), encoding="utf-8") as f:
        contenido = f.read()
    assert 'HTTPServer(("127.0.0.1", puerto)' in contenido


def test_ordenar_fotos_boda_respeta_carpetas_el_ella():
    fotos_lista = [
        {"ruta": "/a/el/1.jpg", "nombre": "1.jpg", "fecha_dt": datetime.datetime(2020, 1, 1), "es_duplicada": False, "rol_boda": "el"},
        {"ruta": "/a/ella/2.jpg", "nombre": "2.jpg", "fecha_dt": datetime.datetime(2020, 1, 2), "es_duplicada": False, "rol_boda": "ella"},
        {"ruta": "/a/juntos/3.jpg", "nombre": "3.jpg", "fecha_dt": datetime.datetime(2023, 1, 1), "es_duplicada": False, "rol_boda": None},
    ]
    res = video_de_vida.ordenar_fotos_vida(fotos_lista, modo="boda")
    assert len(res["capitulos"]["Él"]) == 1
    assert len(res["capitulos"]["Ella"]) == 1
    assert res["capitulos"]["Él"][0]["nombre"] == "1.jpg"
    assert res["capitulos"]["Ella"][0]["nombre"] == "2.jpg"
    serializado = json.dumps(res, default=str)
    assert "1.jpg" in serializado
