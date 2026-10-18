import assert from 'node:assert/strict'
import { test } from 'node:test'
import { aUSD, costoItem, desglose, leerNumero, redondearArriba, resumenMes } from '../shared/calc.ts'
import { AJUSTES_INICIALES } from '../shared/merge.ts'
import type { Insumo, Movimiento, Receta } from '../shared/types.ts'

const cerca = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`)

const harina: Insumo = { id: 'h', nombre: 'Harina', tipo: 'ingrediente', cantidad: 1, unidad: 'kg', precio: 2, moneda: 'USD', precioUSD: 2, updatedAt: 1 }
const huevos: Insumo = { id: 'e', nombre: 'Huevos', tipo: 'ingrediente', cantidad: 30, unidad: 'und', precio: 6, moneda: 'USD', precioUSD: 6, updatedAt: 1 }
const caja: Insumo = { id: 'c', nombre: 'Caja', tipo: 'empaque', cantidad: 1, unidad: 'und', precio: 1, moneda: 'USD', precioUSD: 1, updatedAt: 1 }

test('leerNumero entiende el formato venezolano y el inglés', () => {
  assert.equal(leerNumero('1.234,56'), 1234.56)
  assert.equal(leerNumero('1234,5'), 1234.5)
  assert.equal(leerNumero('1234.5'), 1234.5)
  assert.equal(leerNumero('1,234.56'), 1234.56)
  assert.equal(leerNumero('1.234.567'), 1234567)
  assert.equal(leerNumero('Bs. 250,75'), 250.75)
  assert.equal(leerNumero('$ 3'), 3)
  assert.equal(leerNumero('0,5'), 0.5)
  assert.ok(Number.isNaN(leerNumero('abc')))
  assert.ok(Number.isNaN(leerNumero('1,2,3')))
  assert.ok(Number.isNaN(leerNumero('')))
})

test('costo por item convierte unidades y rechaza las incompatibles', () => {
  cerca(costoItem(harina, 250, 'g'), 0.5)
  cerca(costoItem(harina, 0.5, 'kg'), 1)
  cerca(costoItem(huevos, 4, 'und'), 0.8)
  assert.equal(costoItem(harina, 2, 'und'), 0)
  assert.equal(costoItem(harina, NaN, 'g'), 0)
  assert.equal(costoItem({ ...harina, deleted: true }, 250, 'g'), 0)
})

test('aUSD pasa bolívares con la tasa', () => {
  assert.equal(aUSD(500, 'VES', 250), 2)
  assert.equal(aUSD(5, 'USD', 250), 5)
  assert.equal(aUSD(500, 'VES', 0), 0)
})

test('desglose: precio por margen sobre el precio, no sobre el costo', () => {
  const r: Receta = {
    id: 'r', nombre: 'Vainilla', rinde: 1,
    items: [{ insumoId: 'h', cantidad: 250, unidad: 'g' }, { insumoId: 'e', cantidad: 4, unidad: 'und' }, { insumoId: 'c', cantidad: 1, unidad: 'und' }],
    minutosHorno: 60, minutosTrabajo: 30, merma: 0.1, margen: 0.4, updatedAt: 1,
  }
  const ajustes = { ...AJUSTES_INICIALES, costoHornoHora: 1, costoTrabajoHora: 2 }
  const d = desglose(r, { h: harina, e: huevos, c: caja }, ajustes)
  cerca(d.ingredientes, 1.3)
  cerca(d.empaque, 1)
  cerca(d.horno, 1)
  cerca(d.trabajo, 1)
  cerca(d.merma, 0.43)
  cerca(d.costo, 4.73)
  cerca(d.precioExacto, 4.73 / 0.6)
  assert.equal(d.precioSugerido, 8) // 7,883 → next 0,25
  cerca(d.margenReal, (8 - 4.73) / 8)

  const porciones = desglose({ ...r, rinde: 10, precioVenta: 0.4 }, { h: harina, e: huevos, c: caja }, ajustes)
  cerca(porciones.costoPorcion, 0.473)
  assert.equal(porciones.precio, 0.4)
  assert.ok(porciones.gananciaPorcion < 0)

  const sinInsumo = desglose(r, { e: huevos, c: caja }, ajustes)
  assert.equal(sinInsumo.faltantes, 1)
})

test('redondearArriba', () => {
  assert.equal(redondearArriba(7.01, 0.25), 7.25)
  assert.equal(redondearArriba(7, 0.25), 7)
  assert.equal(redondearArriba(12.1, 0.5), 12.5)
  assert.equal(redondearArriba(0), 0)
})

test('resumenMes suma ventas y gastos del mes, sin borrados', () => {
  const base = { moneda: 'USD' as const, tasa: 200, descripcion: '', updatedAt: 1 }
  const movs: Movimiento[] = [
    { ...base, id: '1', tipo: 'venta', fecha: '2026-10-02', monto: 10, montoUSD: 10, recetaId: 'r', cantidad: 2 },
    { ...base, id: '2', tipo: 'venta', fecha: '2026-10-05', monto: 5, montoUSD: 5, recetaId: 'r', cantidad: 1 },
    { ...base, id: '3', tipo: 'gasto', fecha: '2026-10-03', monto: 4, montoUSD: 4 },
    { ...base, id: '4', tipo: 'venta', fecha: '2026-09-30', monto: 99, montoUSD: 99 },
    { ...base, id: '5', tipo: 'gasto', fecha: '2026-10-04', monto: 50, montoUSD: 50, deleted: true },
  ]
  const r = resumenMes(movs, '2026-10')
  assert.equal(r.ingresos, 15)
  assert.equal(r.gastos, 4)
  assert.equal(r.ganancia, 11)
  assert.equal(r.ventas, 2)
  assert.equal(r.unidades, 3)
  assert.deepEqual(r.porReceta, [{ recetaId: 'r', unidades: 3, monto: 15 }])
})
