/** Venezuelan numbers like 0414-123.45.67 become 584141234567; other numbers keep their digits. */
export function telefonoInternacional(tel: string): string {
  const d = tel.replace(/\D/g, '')
  if (d.startsWith('58')) return d
  if (d.startsWith('0') && d.length === 11) return `58${d.slice(1)}`
  if (d.length === 10 && d.startsWith('4')) return `58${d}`
  return d
}

/** A wa.me link that opens WhatsApp with `texto` ready, to `telefono` when given. */
export function enlaceWhatsApp(texto: string, telefono?: string): string {
  const num = telefono ? telefonoInternacional(telefono) : ''
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
}

/** Shares through the phone's share sheet when there is one; returns false otherwise. */
export async function compartir(texto: string, titulo: string): Promise<boolean> {
  if (!navigator.share) return false
  try {
    await navigator.share({ title: titulo, text: texto })
    return true
  } catch {
    return true // the user closed the sheet; nothing else to do
  }
}

export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}
