# Mis Bizcochos

App web (instalable en el teléfono) para un emprendimiento de bizcochos:

- **Insumos**: lo que compras, con el precio del paquete en dólares o en bolívares. Calcula el costo por gramo, mililitro o unidad.
- **Recetas**: ingredientes, empaque, horno, tu trabajo y la merma. Te dice cuánto cuesta cada bizcocho (o porción) y en cuánto venderlo según la ganancia que quieras. La "torta" muestra a dónde va cada dólar del precio.
- **Cuentas**: registra ventas y gastos con la tasa BCV del día. Ves lo que vendiste, lo que gastaste y lo que te quedó cada mes.
- **Tasa BCV**: se actualiza sola y convierte de dólares a bolívares y al revés. Si no hay internet, puedes escribirla a mano.

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
