import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cambiosDesde, datosVacios, esDatosValidos, mezclar } from '../shared/merge.ts'
import type { Datos, Insumo } from '../shared/types.ts'

const ins = (id: string, nombre: string, updatedAt: number, deleted?: boolean): Insumo => ({
  id, nombre, updatedAt, deleted, tipo: 'ingrediente', cantidad: 1, unidad: 'kg', precio: 1, moneda: 'USD', precioUSD: 1,
})

test('mezclar se queda con la copia más reciente de cada registro', () => {
  const telefono: Datos = { ...datosVacios(), insumos: { a: ins('a', 'Harina tel', 5), b: ins('b', 'Azúcar', 1) } }
  const compu: Datos = { ...datosVacios(), insumos: { a: ins('a', 'Harina pc', 3), c: ins('c', 'Huevos', 2) } }
  const m = mezclar(telefono, compu)
  assert.equal(m.insumos.a.nombre, 'Harina tel')
  assert.deepEqual(Object.keys(m.insumos).sort(), ['a', 'b', 'c'])
  assert.deepEqual(mezclar(compu, telefono), m)
})

test('un borrado más nuevo gana a una edición vieja, y viceversa', () => {
  const borrado = { ...datosVacios(), insumos: { a: ins('a', 'Harina', 9, true) } }
  const editado = { ...datosVacios(), insumos: { a: ins('a', 'Harina 2', 4) } }
  assert.equal(mezclar(editado, borrado).insumos.a.deleted, true)
  const revivido = { ...datosVacios(), insumos: { a: ins('a', 'Harina 3', 12) } }
  assert.equal(mezclar(borrado, revivido).insumos.a.deleted, undefined)
})

test('ajustes: gana el más reciente y se completan los campos faltantes', () => {
  const a = { ...datosVacios(), ajustes: { ...datosVacios().ajustes, nombreNegocio: 'Viejo', updatedAt: 1 } }
  const b = { ajustes: { nombreNegocio: 'Nuevo', updatedAt: 2 } } as unknown as Partial<Datos>
  const m = mezclar(a, b)
  assert.equal(m.ajustes.nombreNegocio, 'Nuevo')
  assert.equal(typeof m.ajustes.costoHornoHora, 'number')
})

test('cambiosDesde envía solo lo nuevo', () => {
  const d: Datos = { ...datosVacios(), insumos: { a: ins('a', 'A', 5), b: ins('b', 'B', 10) } }
  assert.deepEqual(Object.keys(cambiosDesde(d, 6).insumos ?? {}), ['b'])
  assert.deepEqual(cambiosDesde(d, 10), {})
})

test('esDatosValidos rechaza basura', () => {
  assert.equal(esDatosValidos(null), false)
  assert.equal(esDatosValidos([]), false)
  assert.equal(esDatosValidos({ insumos: [] }), false)
  assert.equal(esDatosValidos({ insumos: { a: { id: 'a' } } }), false)
  assert.equal(esDatosValidos({ insumos: { a: ins('a', 'A', 1) } }), true)
  assert.equal(esDatosValidos({}), true)
})

test('los encargos también se mezclan por registro', () => {
  const enc = (nombre: string, updatedAt: number) => ({ id: 'e', cliente: nombre, items: [], entrega: '2026-10-30', estado: 'pendiente' as const, updatedAt })
  const m = mezclar({ ...datosVacios(), encargos: { e: enc('Ana', 2) } }, { encargos: { e: enc('Ana María', 5) } })
  assert.equal(m.encargos.e.cliente, 'Ana María')
  assert.equal(esDatosValidos({ encargos: { e: enc('x', 1) } }), true)
})
