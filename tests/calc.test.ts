import assert from 'node:assert/strict'
import { test } from 'node:test'
import { aUSD, costoItem, cuentaEncargo, desglose, leerNumero, listaCompras, pagosPorEncargo, porCobrar, precioAmable, redondearArriba, resumenMes, serieMeses } from '../shared/calc.ts'
import { AJUSTES_INICIALES } from '../shared/merge.ts'
import type { Encargo, Insumo, Movimiento, Receta } from '../shared/types.ts'

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

const receta: Receta = {
  id: 'r', nombre: 'Vainilla', rinde: 1,
  items: [{ insumoId: 'h', cantidad: 250, unidad: 'g' }, { insumoId: 'e', cantidad: 4, unidad: 'und' }, { insumoId: 'c', cantidad: 1, unidad: 'und' }],
  minutosHorno: 60, minutosTrabajo: 30, merma: 0.1, margen: 0.4, updatedAt: 1,
}
const ajustes = { ...AJUSTES_INICIALES, costoHornoHora: 1, costoTrabajoHora: 2 }
const insumos = { h: harina, e: huevos, c: caja }

test('desglose: precio por margen sobre el precio, no sobre el costo', () => {
  const d = desglose(receta, insumos, ajustes)
  cerca(d.ingredientes, 1.3)
  cerca(d.empaque, 1)
  cerca(d.horno, 1)
  cerca(d.trabajo, 1)
  cerca(d.merma, 0.43)
  cerca(d.costo, 4.73)
  cerca(d.entero.exacto, 4.73 / 0.6)
  assert.equal(d.entero.sugerido, 8) // 7,883 → next 0,25
  cerca(d.entero.margen, (8 - 4.73) / 8)
  assert.equal(d.porcion, d.entero) // no portions when it yields one

  const sinInsumo = desglose(receta, { e: huevos, c: caja }, ajustes)
  assert.equal(sinInsumo.faltantes, 1)
})

test('desglose: precio entero y por porción, propios o sugeridos', () => {
  const r = { ...receta, rinde: 10, precioPorcion: 0.4 }
  const d = desglose(r, insumos, ajustes)
  cerca(d.porcion.costo, 0.473)
  assert.equal(d.porcion.precio, 0.4)
  assert.ok(d.porcion.ganancia < 0)
  assert.equal(d.entero.precio, 8)
  assert.equal(d.entero.propio, false)
  assert.equal(desglose({ ...r, precioEntero: 12 }, insumos, ajustes).entero.precio, 12)
})

test('el precio único viejo se lee como porción o entero según el rinde', () => {
  assert.equal(desglose({ ...receta, rinde: 8, precioVenta: 1.5 }, insumos, ajustes).porcion.precio, 1.5)
  assert.equal(desglose({ ...receta, rinde: 1, precioVenta: 9 }, insumos, ajustes).entero.precio, 9)
})

test('precioAmable redondea a pasos cómodos', () => {
  assert.equal(precioAmable(3.1), 3.25)
  assert.equal(precioAmable(12.2), 12.5)
  assert.equal(precioAmable(31.2), 32)
})

test('redondearArriba', () => {
  assert.equal(redondearArriba(7.01, 0.25), 7.25)
  assert.equal(redondearArriba(7, 0.25), 7)
  assert.equal(redondearArriba(12.1, 0.5), 12.5)
  assert.equal(redondearArriba(0), 0)
})

const base = { moneda: 'USD' as const, tasa: 200, descripcion: '', updatedAt: 1 }
const encargo: Encargo = {
  id: 'p', cliente: 'Carmen', entrega: '2026-10-10', estado: 'entregado', updatedAt: 1,
  items: [{ recetaId: 'r', descripcion: 'Vainilla', formato: 'entero', cantidad: 2, precioUSD: 10 }],
}

test('resumenMes suma ventas, gastos y encargos entregados del mes, sin borrados', () => {
  const movs: Movimiento[] = [
    { ...base, id: '1', tipo: 'venta', fecha: '2026-10-02', monto: 10, montoUSD: 10, recetaId: 'r', cantidad: 2, metodo: 'pago-movil' },
    { ...base, id: '2', tipo: 'venta', fecha: '2026-10-05', monto: 3, montoUSD: 3, recetaId: 'r', cantidad: 3, formato: 'porcion', metodo: 'efectivo-usd' },
    { ...base, id: '3', tipo: 'gasto', fecha: '2026-10-03', monto: 4, montoUSD: 4 },
    { ...base, id: '4', tipo: 'venta', fecha: '2026-09-30', monto: 99, montoUSD: 99 },
    { ...base, id: '5', tipo: 'gasto', fecha: '2026-10-04', monto: 50, montoUSD: 50, deleted: true },
    { ...base, id: '6', tipo: 'venta', fecha: '2026-10-08', monto: 20, montoUSD: 20, encargoId: 'p', metodo: 'pago-movil' },
  ]
  const r = resumenMes(movs, '2026-10', [encargo])
  assert.equal(r.ingresos, 33)
  assert.equal(r.gastos, 4)
  assert.equal(r.ganancia, 29)
  assert.equal(r.ventas, 3)
  assert.deepEqual(r.porReceta, [{ recetaId: 'r', enteros: 4, porciones: 3, monto: 33 }])
  assert.deepEqual(r.porMetodo[0], { metodo: 'pago-movil', monto: 30 })
})

test('encargos: lo pagado sale de los abonos y lo que resta nunca es negativo', () => {
  const movs: Movimiento[] = [
    { ...base, id: 'a', tipo: 'venta', fecha: '2026-10-01', monto: 8, montoUSD: 8, encargoId: 'p' },
    { ...base, id: 'b', tipo: 'venta', fecha: '2026-10-02', monto: 5, montoUSD: 5, encargoId: 'p', deleted: true },
  ]
  const c = cuentaEncargo(encargo, pagosPorEncargo(movs))
  assert.deepEqual(c, { total: 20, pagado: 8, resta: 12 })
  assert.equal(porCobrar([encargo, { ...encargo, id: 'q', estado: 'cancelado' }], movs), 12)
  const sobrepagado = cuentaEncargo(encargo, new Map([['p', 25]]))
  assert.equal(sobrepagado.resta, 0)
})

test('lista de compras suma los insumos de los encargos abiertos en el rango', () => {
  const r: Receta = { ...receta, rinde: 10 }
  const encargos: Encargo[] = [
    { ...encargo, id: 'x', estado: 'pendiente', entrega: '2026-10-25', items: [
      { recetaId: 'r', descripcion: '', formato: 'entero', cantidad: 3, precioUSD: 8 },
      { recetaId: 'r', descripcion: '', formato: 'porcion', cantidad: 5, precioUSD: 1 },
      { descripcion: 'Velas', formato: 'entero', cantidad: 1, precioUSD: 1 },
    ] },
    { ...encargo, id: 'y', estado: 'entregado', entrega: '2026-10-25' },
    { ...encargo, id: 'z', estado: 'pendiente', entrega: '2026-11-30' },
  ]
  const l = listaCompras(encargos, { r }, insumos, '2026-10-24', '2026-10-31')
  assert.equal(l.encargos, 1)
  assert.equal(l.sinReceta, 1)
  const h = l.lineas.find((x) => x.insumo.id === 'h')!
  cerca(h.necesario, 875) // 250 g × 3,5 bizcochos
  assert.equal(h.paquetes, 1)
  cerca(h.costo, 1.75)
  const e = l.lineas.find((x) => x.insumo.id === 'e')!
  cerca(e.necesario, 14)
  assert.equal(l.lineas.at(-1)!.insumo.tipo, 'empaque')
})

test('serieMeses agrupa los últimos meses en orden', () => {
  const movs: Movimiento[] = [
    { ...base, id: '1', tipo: 'venta', fecha: '2026-10-02', monto: 10, montoUSD: 10 },
    { ...base, id: '2', tipo: 'gasto', fecha: '2026-08-02', monto: 4, montoUSD: 4 },
    { ...base, id: '3', tipo: 'venta', fecha: '2026-01-02', monto: 4, montoUSD: 4 },
  ]
  const s = serieMeses(movs, '2026-10', 3)
  assert.deepEqual(s.map((x) => x.mes), ['2026-08', '2026-09', '2026-10'])
  assert.equal(s[0].ganancia, -4)
  assert.equal(s[2].ingresos, 10)
})
