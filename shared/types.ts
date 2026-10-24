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

/** A product is sold whole or by the portion. */
export type Formato = 'entero' | 'porcion'

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
  /** Her own whole-product price in USD; the suggested one is used when absent. */
  precioEntero?: number
  /** Her own per-portion price in USD (only when it yields more than one portion). */
  precioPorcion?: number
  /** Legacy single price: per portion when rinde > 1, else for the whole. Read through `preciosPropios`. */
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
  formato?: Formato
  /** Set when this payment belongs to an order (a deposit or the balance). */
  encargoId?: string
}

export interface ItemEncargo {
  recetaId?: string
  descripcion: string
  formato: Formato
  cantidad: number
  /** Unit price in USD. */
  precioUSD: number
}

export type EstadoEncargo = 'pendiente' | 'listo' | 'entregado' | 'cancelado'

/** An order to deliver on a date. Its payments are `Movimiento`s carrying its id. */
export interface Encargo extends Registro {
  cliente: string
  telefono?: string
  items: ItemEncargo[]
  /** Delivery date, YYYY-MM-DD. */
  entrega: string
  /** Delivery time, HH:MM. */
  hora?: string
  estado: EstadoEncargo
  nota?: string
}

export interface Ajustes {
  updatedAt: number
  nombreNegocio: string
  costoHornoHora: number
  costoTrabajoHora: number
  margenPorDefecto: number
  mermaPorDefecto: number
  /** Monthly sales goal in USD; 0 or absent means none. */
  metaMensual?: number
  /** Where clients pay. Lives only in her private store, never in the code. */
  pago?: DatosPago
}

export interface DatosPago {
  titular?: string
  /** e.g. "0102 - Banco de Venezuela". */
  banco?: string
  telefono?: string
  cedula?: string
  /** QR image as a data URL, resized on the device before saving. */
  qr?: string
}

export interface Datos {
  insumos: Record<string, Insumo>
  recetas: Record<string, Receta>
  movimientos: Record<string, Movimiento>
  encargos: Record<string, Encargo>
  ajustes: Ajustes
}

export interface Tasa {
  valor: number
  /** ISO timestamp of when BCV published it, when known. */
  fecha: string | null
  fuente: string
  manual?: boolean
}
