export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}

export function error(mensaje: string, status: number): Response {
  return json({ error: mensaje }, status)
}

export function ipDe(request: Request): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'desconocida'
  )
}

export async function leerCuerpo(request: Request, maxBytes: number): Promise<unknown> {
  const texto = await request.text()
  if (texto.length > maxBytes) throw new Error('demasiado-grande')
  return JSON.parse(texto)
}
