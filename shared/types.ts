// Every money amount is stored in US dollars. Bolívares are derived with a BCV rate.

export type Moneda = 'USD' | 'VES'

export type UnidadCompra = 'kg' | 'g' | 'L' | 'ml' | 'und'
export type UnidadBase = 'g' | 'ml' | 'und'

/** Fields every synced record carries. `updatedAt` decides which copy wins a merge. */
export interface Registro {
  id: string
  updatedAt: number
  deleted?: boolean
}

export interface Insumo extends Registro {
  nombre: string
  tipo: 'ingrediente' | 'empaque'
  /** Package size as bought, e.g. 1 (kg) or 30 (und). */
  cantidad: number
  unidad: UnidadCompra
  /** Package price as typed, in `moneda`. */
  precio: number
  moneda: Moneda
  /** BCV rate used when the price was typed in bolívares. */
  tasa?: number
  /** Package price in dollars. */
  precioUSD: number
}

export interface ItemReceta {
  insumoId: string
  cantidad: number
  unidad: UnidadCompra
}

export interface Receta extends Registro {
  nombre: string
  /** How many portions or units the recipe yields; 1 means "one whole bizcocho". */
  rinde: number
  items: ItemReceta[]
  minutosHorno: number
  minutosTrabajo: number
  /** Waste/buffer over the subtotal, 0–1. */
  merma: number
  /** Desired margin on the sale price, 0–0.95. */
  margen: number
  /** The price the baker actually charges per portion, in USD. Optional. */
  precioVenta?: number
  nota?: string
}

export type MetodoPago = 'efectivo-usd' | 'efectivo-bs' | 'pago-movil' | 'transferencia' | 'punto' | 'zelle' | 'otro'

export type CategoriaGasto = 'insumos' | 'empaque' | 'servicios' | 'equipos' | 'transporte' | 'otros'

export interface Movimiento extends Registro {
  tipo: 'venta' | 'gasto'
  /** Local calendar date, YYYY-MM-DD. */
  fecha: string
  descripcion: string
  recetaId?: string
  cantidad?: number
  monto: number
  moneda: Moneda
  /** BCV rate on the day of the movement. */
  tasa: number
  montoUSD: number
  metodo?: MetodoPago
  categoria?: CategoriaGasto
  cliente?: string
}

export interface Ajustes {
  updatedAt: number
  nombreNegocio: string
  costoHornoHora: number
  costoTrabajoHora: number
  margenPorDefecto: number
  mermaPorDefecto: number
}

export interface Datos {
  insumos: Record<string, Insumo>
  recetas: Record<string, Receta>
  movimientos: Record<string, Movimiento>
  ajustes: Ajustes
}

export interface Tasa {
  valor: number
  /** ISO timestamp of when BCV published it, when known. */
  fecha: string | null
  fuente: string
  manual?: boolean
}
