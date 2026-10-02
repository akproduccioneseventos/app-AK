/**
 * @fileOverview Recetas oficiales de la barra de tragos de AK Producciones (Orden 106 Bloque 10).
 * Medidas para vaso de 300 ml con hielo.
 */

export interface IngredienteReceta {
  insumoId: string;
  nombre: string;
  cantidad: number;
  unidad: 'ml' | 'g' | 'unidad';
}

export interface RecetaTragoAK {
  id: string;
  nombre: string;
  categoria: 'con-alcohol' | 'sin-alcohol' | 'licuados';
  descripcion: string;
  ingredientes: IngredienteReceta[];
}

export const RECETAS_OFICIALES_BARRA: RecetaTragoAK[] = [
  {
    id: 'daiquiri-durazno',
    nombre: 'Daiquiri de durazno',
    categoria: 'con-alcohol',
    descripcion: 'Ron blanco, durazno natural, jugo de limón y almíbar.',
    ingredientes: [
      { insumoId: 'ins-ron-blanco', nombre: 'Ron blanco', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-durazno', nombre: 'Durazno', cantidad: 80, unidad: 'g' },
      { insumoId: 'ins-limon', nombre: 'Jugo de limón', cantidad: 20, unidad: 'ml' },
      { insumoId: 'ins-almibar', nombre: 'Almíbar', cantidad: 15, unidad: 'ml' },
    ],
  },
  {
    id: 'caipirinha',
    nombre: 'Caipirinha',
    categoria: 'con-alcohol',
    descripcion: 'Cachaça tradicional con lima machacada y azúcar.',
    ingredientes: [
      { insumoId: 'ins-cachaca', nombre: 'Cachaça', cantidad: 60, unidad: 'ml' },
      { insumoId: 'ins-lima', nombre: 'Lima', cantidad: 1, unidad: 'unidad' },
      { insumoId: 'ins-azucar', nombre: 'Azúcar', cantidad: 10, unidad: 'g' },
    ],
  },
  {
    id: 'arizona',
    nombre: 'Arizona',
    categoria: 'con-alcohol',
    descripcion: 'Vodka con té helado y un toque refrescante de limón.',
    ingredientes: [
      { insumoId: 'ins-vodka', nombre: 'Vodka', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-te-helado', nombre: 'Té helado', cantidad: 180, unidad: 'ml' },
      { insumoId: 'ins-limon', nombre: 'Jugo de limón', cantidad: 15, unidad: 'ml' },
    ],
  },
  {
    id: 'daiquiri-anana',
    nombre: 'Daiquiri de ananá',
    categoria: 'con-alcohol',
    descripcion: 'Ron blanco con pulpa de ananá, jugo de limón y almíbar.',
    ingredientes: [
      { insumoId: 'ins-ron-blanco', nombre: 'Ron blanco', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-anana', nombre: 'Ananá', cantidad: 80, unidad: 'g' },
      { insumoId: 'ins-limon', nombre: 'Jugo de limón', cantidad: 20, unidad: 'ml' },
      { insumoId: 'ins-almibar', nombre: 'Almíbar', cantidad: 15, unidad: 'ml' },
    ],
  },
  {
    id: 'daiquiri-frutilla',
    nombre: 'Daiquiri de frutilla',
    categoria: 'con-alcohol',
    descripcion: 'El clásico preferido: ron blanco, frutillas frescas y almíbar.',
    ingredientes: [
      { insumoId: 'ins-ron-blanco', nombre: 'Ron blanco', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-frutilla', nombre: 'Frutilla', cantidad: 80, unidad: 'g' },
      { insumoId: 'ins-limon', nombre: 'Jugo de limón', cantidad: 20, unidad: 'ml' },
      { insumoId: 'ins-almibar', nombre: 'Almíbar', cantidad: 15, unidad: 'ml' },
    ],
  },
  {
    id: 'atomic-green',
    nombre: 'Atomic green',
    categoria: 'con-alcohol',
    descripcion: 'Licor de durazno, vodka y gaseosa lima-limón.',
    ingredientes: [
      { insumoId: 'ins-licor-durazno', nombre: 'Licor de durazno', cantidad: 40, unidad: 'ml' },
      { insumoId: 'ins-vodka', nombre: 'Vodka', cantidad: 30, unidad: 'ml' },
      { insumoId: 'ins-sprite', nombre: 'Sprite', cantidad: 150, unidad: 'ml' },
    ],
  },
  {
    id: 'daiquiri-primavera',
    nombre: 'Daiquiri primavera',
    categoria: 'con-alcohol',
    descripcion: 'Combinación fresca de ron blanco, mix de frutas de estación y limón.',
    ingredientes: [
      { insumoId: 'ins-ron-blanco', nombre: 'Ron blanco', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-mix-frutas', nombre: 'Mix de frutas', cantidad: 80, unidad: 'g' },
      { insumoId: 'ins-limon', nombre: 'Jugo de limón', cantidad: 20, unidad: 'ml' },
      { insumoId: 'ins-almibar', nombre: 'Almíbar', cantidad: 15, unidad: 'ml' },
    ],
  },
  {
    id: 'fernet-coca',
    nombre: 'Fernet con coca',
    categoria: 'con-alcohol',
    descripcion: 'Fernet italiano con Coca-Cola y abundante hielo.',
    ingredientes: [
      { insumoId: 'ins-fernet', nombre: 'Fernet', cantidad: 70, unidad: 'ml' },
      { insumoId: 'ins-coca', nombre: 'Coca-Cola', cantidad: 230, unidad: 'ml' },
    ],
  },
  {
    id: 'atardecer',
    nombre: 'Atardecer',
    categoria: 'con-alcohol',
    descripcion: 'Tequila con jugo de naranja y un toque dulce de granadina.',
    ingredientes: [
      { insumoId: 'ins-tequila', nombre: 'Tequila', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-naranja', nombre: 'Jugo de naranja', cantidad: 150, unidad: 'ml' },
      { insumoId: 'ins-granadina', nombre: 'Granadina', cantidad: 15, unidad: 'ml' },
    ],
  },
  {
    id: 'destornillador',
    nombre: 'Destornillador',
    categoria: 'con-alcohol',
    descripcion: 'Vodka clásico combinado con jugo de naranja natural.',
    ingredientes: [
      { insumoId: 'ins-vodka', nombre: 'Vodka', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-naranja', nombre: 'Jugo de naranja', cantidad: 150, unidad: 'ml' },
    ],
  },
  {
    id: 'ron-cola',
    nombre: 'Ron cola',
    categoria: 'con-alcohol',
    descripcion: 'Ron añejo con Coca-Cola y rodaja de limón.',
    ingredientes: [
      { insumoId: 'ins-ron', nombre: 'Ron', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-coca', nombre: 'Coca-Cola', cantidad: 200, unidad: 'ml' },
    ],
  },
  {
    id: 'gin-pomelo',
    nombre: 'Gin con pomelo',
    categoria: 'con-alcohol',
    descripcion: 'Gin premium con gaseosa de pomelo y hielo.',
    ingredientes: [
      { insumoId: 'ins-gin', nombre: 'Gin', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-pomelo', nombre: 'Gaseosa de pomelo', cantidad: 200, unidad: 'ml' },
    ],
  },
];
