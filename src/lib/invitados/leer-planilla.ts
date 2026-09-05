import type { CategoriaInvitado } from '@/types/invitado';
import type { DietaryRestriction } from '@/types/fiesta';

/**
 * Leer la lista de invitados de una planilla pegada o subida.
 *
 * **Por que vive aca y no adentro de la pantalla.** Estaba escrita dentro del
 * componente y la unica prueba que la miraba tenia que abrir una pantalla interna.
 * En el entorno de pruebas esas pantallas no ven las fiestas de prueba, asi que esa
 * prueba tardaba 95 segundos y no comprobaba nada. Aca se comprueba sola, en
 * milesimas, y de verdad.
 *
 * **Lo que hace, en criollo:** entiende comas, punto y coma o tabulaciones; reconoce
 * los nombres de columna sin importar mayusculas ni acentos ("Nombre", "NOMBRE",
 * "nombre y apellido", "Invitado"); marca las filas sin nombre y las repetidas, y
 * **no guarda nada**: devuelve lo que entendio para que la pantalla lo muestre antes
 * de confirmar.
 */
export interface FilaDePlanilla {
  filaNum: number;
  nombre: string;
  categoria: CategoriaInvitado;
  tableNumber?: string;
  companionNames?: string[];
  dietaryRestriction?: DietaryRestriction;
  contacto?: string;
  esRepetido?: boolean;
  error?: string;
}

export interface ResumenDePlanilla {
  filas: FilaDePlanilla[];
  /** Numeros de fila a los que les falta el nombre. */
  filasSinNombre: number[];
  repetidos: number;
  validos: number;
}

export function leerPlanillaDeInvitados(
  texto: string,
  nombresYaEnLaLista: string[] = []
): ResumenDePlanilla {
    const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lineas.length === 0) {
      return { filas: [], filasSinNombre: [], repetidos: 0, validos: 0 };
    }

    // Detectar delimitador
    const primera = lineas[0];
    const delimitador = primera.includes(';') ? ';' : primera.includes('\t') ? '\t' : ',';

    const parseLine = (line: string) => {
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimitador && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      return parts.map(p => p.replace(/^"|"$/g, '').trim());
    };

    const headerParts = parseLine(primera);
    const normalizeHeader = (h: string) =>
      h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    let colNombre = -1;
    let colCategoria = -1;
    let colMesa = -1;
    let colAcompanantes = -1;
    let colRestriccion = -1;
    let colContacto = -1;

    headerParts.forEach((h, idx) => {
      const norm = normalizeHeader(h);
      if (norm.includes('nombre') || norm.includes('invitado') || norm === 'name' || norm.includes('persona')) {
        colNombre = idx;
      } else if (norm.includes('categoria') || norm.includes('tipo') || norm === 'category') {
        colCategoria = idx;
      } else if (norm.includes('mesa') || norm.includes('table')) {
        colMesa = idx;
      } else if (norm.includes('acompan') || norm.includes('companion')) {
        colAcompanantes = idx;
      } else if (norm.includes('restric') || norm.includes('dieta') || norm.includes('alergia') || norm.includes('dietary')) {
        colRestriccion = idx;
      } else if (norm.includes('contacto') || norm.includes('tel') || norm.includes('cel') || norm.includes('phone')) {
        colContacto = idx;
      }
    });

    let dataStartIndex = 0;
    if (colNombre !== -1) {
      dataStartIndex = 1;
    } else {
      colNombre = 0;
      colMesa = 1;
      colCategoria = 2;
    }

    const filas: Array<{
      filaNum: number;
      nombre: string;
      categoria: CategoriaInvitado;
      tableNumber?: string;
      companionNames?: string[];
      dietaryRestriction?: DietaryRestriction;
      contacto?: string;
      esRepetido?: boolean;
      error?: string;
    }> = [];

    const filasSinNombre: number[] = [];
    let repetidosCount = 0;
    let validosCount = 0;
    const nombresYaProcesados = new Set<string>();

    for (let i = dataStartIndex; i < lineas.length; i++) {
      const numFila = i + 1;
      const cols = parseLine(lineas[i]);
      const nombre = (cols[colNombre] ?? '').trim();
      // Ojo: una fila puede traer MENOS columnas que el encabezado -pasa siempre con
      // las planillas de verdad- y ahi `cols[...]` viene vacio. Sin este resguardo la
      // importacion se rompia entera con una planilla sin encabezado.
      const celda = (indice: number) => (indice !== -1 ? cols[indice] ?? '' : '');
      // Se saca la enie y los acentos: "Nino", "Niño" y "NIÑO" son lo mismo. Sin esto
      // un invitado marcado "Niño" entraba como ADULTO y la cuenta de la comida salia
      // mal: se cocina y se cobra por adulto. Se detecto el 5 de septiembre de 2026.
      const rawCat = celda(colCategoria)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const categoria: CategoriaInvitado = (rawCat.includes('nin') || rawCat.includes('adol') || rawCat.includes('chico'))
        ? 'Niño/Adolescente'
        : 'Adulto';
      const mesa = celda(colMesa) || undefined;
      const rawAcomp = celda(colAcompanantes);
      const companionNames = rawAcomp ? rawAcomp.split(/[,;/+]/).map(s => s.trim()).filter(Boolean) : undefined;
      const rawDiet = celda(colRestriccion).toLowerCase();
      let dietaryRestriction: DietaryRestriction = 'Ninguna';
      if (rawDiet.includes('celiac')) dietaryRestriction = 'Celiaco';
      else if (rawDiet.includes('vegano') || rawDiet.includes('vegana')) dietaryRestriction = 'Vegano';
      else if (rawDiet.includes('vegetar')) dietaryRestriction = 'Vegetariano';
      else if (rawDiet.includes('gluten')) dietaryRestriction = 'Sin Gluten';
      else if (rawDiet.includes('lactos')) dietaryRestriction = 'Sin Lactosa';
      else if (rawDiet.includes('marisc')) dietaryRestriction = 'Alergia Mariscos';
      else if (rawDiet.includes('frutos')) dietaryRestriction = 'Alergia Frutos Secos';

      const contacto = celda(colContacto) || undefined;

      let error: string | undefined = undefined;
      if (!nombre) {
        error = `Fila ${numFila}: falta el nombre del invitado.`;
        filasSinNombre.push(numFila);
      }

      const nombreKey = nombre.toLowerCase();
      const esRepetido = !!nombre && (
        nombresYaEnLaLista.some((n) => n.toLowerCase() === nombreKey) ||
        nombresYaProcesados.has(nombreKey)
      );

      if (nombre) {
        nombresYaProcesados.add(nombreKey);
        if (esRepetido) repetidosCount++;
        validosCount++;
      }

      filas.push({
        filaNum: numFila,
        nombre,
        categoria,
        tableNumber: mesa,
        companionNames,
        dietaryRestriction,
        contacto,
        esRepetido,
        error,
      });
    }

    return {
      filas,
      filasSinNombre,
      repetidos: repetidosCount,
      validos: validosCount,
    };
}
