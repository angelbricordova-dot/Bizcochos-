import type { DatosPago } from '../../shared/types'
import { fmtBs, fmtUSD } from './format'

export const BANCOS = [
  '0102 - Banco de Venezuela',
  '0134 - Banesco',
  '0105 - Mercantil',
  '0108 - Provincial',
  '0191 - BNC',
  '0172 - Bancamiga',
  '0114 - Bancaribe',
  '0175 - Banco Bicentenario',
  '0163 - Banco del Tesoro',
  '0115 - Exterior',
  '0151 - BFC',
  '0174 - Banplus',
  '0138 - Banco Plaza',
  '0104 - Venezolano de Crédito',
  '0128 - Banco Caroní',
  '0171 - Activo',
  '0169 - Mi Banco',
]

export function tieneDatosPago(p?: DatosPago): p is DatosPago {
  return Boolean(p && (p.telefono?.trim() || p.cedula?.trim() || p.qr))
}

/** The Pago Móvil block to paste in a message, with the amount when given. */
export function textoPago(p: DatosPago, montoUSD?: number, tasa?: number): string {
  const lineas = ['Pago Móvil:']
  if (p.banco?.trim()) lineas.push(`Banco: ${p.banco.trim()}`)
  if (p.telefono?.trim()) lineas.push(`Teléfono: ${p.telefono.trim()}`)
  if (p.cedula?.trim()) lineas.push(`Cédula: ${p.cedula.trim()}`)
  if (p.titular?.trim()) lineas.push(`A nombre de: ${p.titular.trim()}`)
  if (montoUSD && montoUSD > 0) lineas.push(tasa && tasa > 0 ? `Monto: ${fmtBs(montoUSD * tasa)} (${fmtUSD(montoUSD)})` : `Monto: ${fmtUSD(montoUSD)}`)
  return lineas.join('\n')
}

/** Shrinks a photo of the QR so it syncs quickly; keeps it sharp enough to scan. */
export async function reducirImagen(archivo: File, lado = 640): Promise<string> {
  const url = URL.createObjectURL(archivo)
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => mal(new Error('imagen'))
      i.src = url
    })
    const escala = Math.min(1, lado / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * escala)
    c.height = Math.round(img.height * escala)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.imageSmoothingEnabled = escala < 1
    ctx.drawImage(img, 0, 0, c.width, c.height)
    const png = c.toDataURL('image/png')
    return png.length < 400_000 ? png : c.toDataURL('image/jpeg', 0.9)
  } finally {
    URL.revokeObjectURL(url)
  }
}
