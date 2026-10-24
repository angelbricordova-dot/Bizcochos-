# Mis Bizcochos

App web (instalable en el teléfono) para un emprendimiento de bizcochos:

- **Inicio**: lo que te quedó en el mes en $ y Bs, la meta de ventas, cuánto te deben y las próximas entregas.
- **Encargos**: pedidos con fecha y hora de entrega, abonos y lo que falta por cobrar. Estados: por hacer, listo y entregado. El resumen se manda al cliente por WhatsApp con un toque.
- **Productos**: bizcochos, pies, cheesecakes… con ingredientes, horno y tu trabajo. Calcula el costo y el precio sugerido entero y por porción. La "torta" muestra a dónde va cada dólar del precio.
- **Cuentas**: ventas y gastos con la tasa BCV del día, para ver lo que entró y lo que salió cada mes.
- **Cobrar**: tu QR y los datos de Pago Móvil, con botones para copiar, y el monto pasado a bolívares.
- **Lista de compras**: según los encargos de los próximos días, cuánto hay que comprar de cada insumo y cuánto cuesta.
- **Precios para WhatsApp**: la lista de precios del día en $ y Bs, lista para mandar o subir a estados.
- **Reportes**: ventas contra gastos de los últimos 6 meses, lo más vendido y cómo te pagan.
- **Insumos** y **Tasa BCV**: lo que compras con su precio, y el convertidor $ ⇄ Bs.
- **Modo oscuro**: automático, claro u oscuro, en Ajustes.

Los datos de pago (cédula, teléfono, QR) se escriben en **Ajustes → Datos de pago**. Quedan en la base de datos privada, detrás de la contraseña, y nunca en este repositorio público.

Todo se guarda en dólares, y los bolívares se muestran con la tasa. Los datos viven en la nube (Upstash Redis en Vercel), así que el teléfono y la computadora ven lo mismo. Se entra con una contraseña.

## Publicarla en Vercel (una sola vez)

1. Entra a [vercel.com/new](https://vercel.com/new) e importa este repositorio de GitHub. Vercel detecta Vite solo; no cambies nada y dale **Deploy**.
2. En el proyecto: **Storage → Create Database → Upstash for Redis** (el plan gratis alcanza). Al crearla, conéctala a este proyecto. Eso agrega solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. En **Settings → Environment Variables** agrega `APP_PASSWORD` con la contraseña que vas a usar para entrar. Opcional: `SESSION_SECRET` con un texto largo al azar.
4. Ve a **Deployments**, abre el último y dale **Redeploy** para que tome las variables.
5. Abre la dirección que te da Vercel y entra con tu contraseña.

Si cambias `APP_PASSWORD`, todos los dispositivos tienen que volver a entrar.

### Instalarla en el teléfono

- **Android (Chrome)**: menú ⋮ → *Agregar a la pantalla principal*.
- **iPhone (Safari)**: botón Compartir → *Agregar a inicio*.

## De dónde sale la tasa

La función `api/tasa.ts` consulta la tasa oficial del BCV en [DolarApi](https://ve.dolarapi.com) y, si falla, en [PyDolarVe](https://pydolarve.org). Guarda la última tasa buena por si ambas fallan. Vercel la guarda en caché 15 minutos.

## Para programar

```bash
npm install
npm run dev        # http://localhost:5173 — contraseña local: bizcocho
npm test           # pruebas de cálculos y sincronización
npm run build
```

En local, sin variables de Upstash, los datos se guardan en memoria (se borran al reiniciar). Para usar otra contraseña local, crea `.env` a partir de `.env.example`.

Estructura:

- `src/`: la app (React).
- `api/`: funciones de Vercel (`sesion`, `datos`, `tasa`).
- `shared/`: cálculos de costos y precios, y la mezcla de datos entre dispositivos, usada por la app y por el servidor.
- `public/`: manifest, service worker e íconos.
