# -*- coding: utf-8 -*-
"""Módulo de almacenamiento local SQLite para AK Editor Inteligente.

Guarda archivos, metadatos, análisis, cortes, revisiones y preferencias
fuera de la carpeta de los archivos originales.
"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from typing import Any, Dict, Generator, List, Optional


def obtener_ruta_base_datos(evento: str, directorio_base: Optional[str] = None) -> str:
    """Obtiene la ruta absoluta al archivo SQLite del evento."""
    if directorio_base is None:
        documentos = os.path.expanduser(os.path.join("~", "Documents"))
        directorio_base = os.path.join(documentos, "AK Editor")

    carpeta_evento = os.path.join(directorio_base, evento)
    os.makedirs(carpeta_evento, exist_ok=True)
    return os.path.join(carpeta_evento, "proyecto.sqlite")


class Almacen:
    """Manejador de la base de datos SQLite del proyecto."""

    def __init__(self, ruta_db: str):
        self.ruta_db = ruta_db
        carpeta = os.path.dirname(ruta_db)
        if carpeta:
            os.makedirs(carpeta, exist_ok=True)
        self.inicializar()

    @contextmanager
    def conexion(self) -> Generator[sqlite3.Connection, None, None]:
        con = sqlite3.connect(self.ruta_db)
        con.row_factory = sqlite3.Row
        try:
            yield con
        finally:
            con.close()

    def inicializar(self) -> None:
        """Crea las tablas necesarias si no existen."""
        with self.conexion() as con:
            cur = con.cursor()

            # Tabla de archivos
            cur.execute("""
                CREATE TABLE IF NOT EXISTS archivos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ruta TEXT UNIQUE NOT NULL,
                    nombre TEXT NOT NULL,
                    bloque TEXT DEFAULT 'previa',
                    duracion REAL DEFAULT 0.0,
                    resolucion TEXT DEFAULT '',
                    fps REAL DEFAULT 30.0,
                    fecha_grabacion TEXT DEFAULT '',
                    camara TEXT DEFAULT 'principal',
                    estado_analisis TEXT DEFAULT 'pendiente',
                    sha256 TEXT DEFAULT '',
                    metadatos_json TEXT DEFAULT '{}',
                    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Tabla de cortes generados
            cur.execute("""
                CREATE TABLE IF NOT EXISTS cortes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    archivo_id INTEGER,
                    bloque TEXT NOT NULL,
                    entrada REAL NOT NULL,
                    salida REAL NOT NULL,
                    duracion REAL NOT NULL,
                    tipo TEXT DEFAULT 'corte_directo',
                    transicion TEXT DEFAULT 'disolvencia',
                    regla_aplicada TEXT DEFAULT '',
                    camara TEXT DEFAULT 'principal',
                    pista_video INTEGER DEFAULT 1,
                    pista_audio INTEGER DEFAULT 1,
                    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(archivo_id) REFERENCES archivos(id)
                )
            """)

            # Tabla de revisiones / alertas
            cur.execute("""
                CREATE TABLE IF NOT EXISTS revision (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tipo_aviso TEXT NOT NULL,
                    archivo_id INTEGER,
                    segundo_inicio REAL DEFAULT 0.0,
                    segundo_fin REAL DEFAULT 0.0,
                    severidad TEXT DEFAULT 'aviso',
                    descripcion TEXT NOT NULL,
                    corregido INTEGER DEFAULT 0,
                    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(archivo_id) REFERENCES archivos(id)
                )
            """)

            # Tabla de preferencias del usuario
            cur.execute("""
                CREATE TABLE IF NOT EXISTS preferencias (
                    clave TEXT PRIMARY KEY,
                    valor TEXT NOT NULL
                )
            """)

            con.commit()

    # --- Métodos de Archivos ---

    def guardar_archivo(self, datos: Dict[str, Any]) -> int:
        """Inserta o actualiza un archivo en la base de datos."""
        with self.conexion() as con:
            cur = con.cursor()
            cur.execute("""
                INSERT INTO archivos (
                    ruta, nombre, bloque, duracion, resolucion, fps,
                    fecha_grabacion, camara, estado_analisis, sha256, metadatos_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(ruta) DO UPDATE SET
                    bloque=excluded.bloque,
                    duracion=excluded.duracion,
                    resolucion=excluded.resolucion,
                    fps=excluded.fps,
                    fecha_grabacion=excluded.fecha_grabacion,
                    camara=excluded.camara,
                    estado_analisis=CASE WHEN archivos.estado_analisis = 'completado' THEN 'completado' ELSE excluded.estado_analisis END,
                    sha256=excluded.sha256,
                    metadatos_json=excluded.metadatos_json
            """, (
                datos["ruta"],
                datos.get("nombre", os.path.basename(datos["ruta"])),
                datos.get("bloque", "previa"),
                datos.get("duracion", 0.0),
                datos.get("resolucion", ""),
                datos.get("fps", 30.0),
                datos.get("fecha_grabacion", ""),
                datos.get("camara", "principal"),
                datos.get("estado_analisis", "pendiente"),
                datos.get("sha256", ""),
                json.dumps(datos.get("metadatos_json", {})) if isinstance(datos.get("metadatos_json"), dict) else datos.get("metadatos_json", "{}"),
            ))
            con.commit()
            return cur.lastrowid

    def obtener_archivos(self, bloque: Optional[str] = None) -> List[Dict[str, Any]]:
        """Devuelve todos los archivos registrados, opcionalmente filtrados por bloque."""
        with self.conexion() as con:
            cur = con.cursor()
            if bloque:
                cur.execute("SELECT * FROM archivos WHERE bloque = ? ORDER BY id ASC", (bloque,))
            else:
                cur.execute("SELECT * FROM archivos ORDER BY id ASC")
            filas = cur.fetchall()
            return [dict(f) for f in filas]

    def obtener_archivo_por_id(self, archivo_id: int) -> Optional[Dict[str, Any]]:
        """Devuelve un archivo específico por su ID."""
        with self.conexion() as con:
            cur = con.cursor()
            cur.execute("SELECT * FROM archivos WHERE id = ?", (archivo_id,))
            fila = cur.fetchone()
            return dict(fila) if fila else None

    def actualizar_estado_analisis(self, archivo_id: int, estado: str) -> None:
        """Actualiza el estado de análisis de un archivo."""
        with self.conexion() as con:
            cur = con.cursor()
            cur.execute("UPDATE archivos SET estado_analisis = ? WHERE id = ?", (estado, archivo_id))
            con.commit()

    # --- Métodos de Cortes ---

    def limpiar_cortes(self, bloque: Optional[str] = None) -> None:
        """Borra cortes existentes."""
        with self.conexion() as con:
            cur = con.cursor()
            if bloque:
                cur.execute("DELETE FROM cortes WHERE bloque = ?", (bloque,))
            else:
                cur.execute("DELETE FROM cortes")
            con.commit()

    def guardar_cortes(self, cortes: List[Dict[str, Any]]) -> None:
        """Inserta una lista de cortes generados."""
        with self.conexion() as con:
            cur = con.cursor()
            for c in cortes:
                cur.execute("""
                    INSERT INTO cortes (
                        archivo_id, bloque, entrada, salida, duracion,
                        tipo, transicion, regla_aplicada, camara, pista_video, pista_audio
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    c.get("archivo_id"),
                    c["bloque"],
                    c["entrada"],
                    c["salida"],
                    c["duracion"],
                    c.get("tipo", "corte_directo"),
                    c.get("transicion", "disolvencia"),
                    c.get("regla_aplicada", ""),
                    c.get("camara", "principal"),
                    c.get("pista_video", 1),
                    c.get("pista_audio", 1),
                ))
            con.commit()

    def obtener_cortes(self, bloque: Optional[str] = None) -> List[Dict[str, Any]]:
        """Devuelve todos los cortes ordenados por entrada y pista."""
        with self.conexion() as con:
            cur = con.cursor()
            if bloque:
                cur.execute("""
                    SELECT c.*, a.ruta as archivo_ruta, a.nombre as archivo_nombre
                    FROM cortes c
                    LEFT JOIN archivos a ON c.archivo_id = a.id
                    WHERE c.bloque = ?
                    ORDER BY c.id ASC
                """, (bloque,))
            else:
                cur.execute("""
                    SELECT c.*, a.ruta as archivo_ruta, a.nombre as archivo_nombre
                    FROM cortes c
                    LEFT JOIN archivos a ON c.archivo_id = a.id
                    ORDER BY c.id ASC
                """)
            filas = cur.fetchall()
            return [dict(f) for f in filas]

    # --- Métodos de Revisión ---

    def agregar_aviso_revision(self, aviso: Dict[str, Any]) -> int:
        """Registra un aviso para la pantalla de revisión."""
        with self.conexion() as con:
            cur = con.cursor()
            cur.execute("""
                INSERT INTO revision (
                    tipo_aviso, archivo_id, segundo_inicio, segundo_fin,
                    severidad, descripcion, corregido
                ) VALUES (?, ?, ?, ?, ?, ?, 0)
            """, (
                aviso["tipo_aviso"],
                aviso.get("archivo_id"),
                aviso.get("segundo_inicio", 0.0),
                aviso.get("segundo_fin", 0.0),
                aviso.get("severidad", "aviso"),
                aviso["descripcion"],
            ))
            con.commit()
            return cur.lastrowid

    def obtener_avisos_revision(self) -> List[Dict[str, Any]]:
        """Devuelve la lista completa de avisos de revisión."""
        with self.conexion() as con:
            cur = con.cursor()
            cur.execute("""
                SELECT r.*, a.nombre as archivo_nombre, a.ruta as archivo_ruta
                FROM revision r
                LEFT JOIN archivos a ON r.archivo_id = a.id
                ORDER BY r.id ASC
            """)
            filas = cur.fetchall()
            return [dict(f) for f in filas]

    def marcar_aviso_corregido(self, aviso_id: int) -> None:
        """Marca un aviso como revisado/corregido por el dueño."""
        with self.conexion() as con:
            cur = con.cursor()
            cur.execute("UPDATE revision SET corregido = 1 WHERE id = ?", (aviso_id,))
            con.commit()

    # --- Métodos de Preferencias y Aprendizaje ---

    def guardar_preferencia(self, clave: str, valor: Any) -> None:
        """Guarda una preferencia del usuario (duraciones, correcciones, etc.)."""
        texto_valor = json.dumps(valor) if not isinstance(valor, str) else valor
        with self.conexion() as con:
            cur = con.cursor()
            cur.execute("""
                INSERT INTO preferencias (clave, valor) VALUES (?, ?)
                ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor
            """, (clave, texto_valor))
            con.commit()

    def obtener_preferencia(self, clave: str, default: Any = None) -> Any:
        """Obtiene una preferencia guardada."""
        with self.conexion() as con:
            cur = con.cursor()
            cur.execute("SELECT valor FROM preferencias WHERE clave = ?", (clave,))
            fila = cur.fetchone()
            if not fila:
                return default
            val = fila["valor"]
            try:
                return json.loads(val)
            except Exception:
                return val
