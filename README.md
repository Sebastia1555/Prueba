# Bolsa · Cotizaciones en tiempo real

Aplicación web para seguir cotizaciones de acciones en **tiempo real**. Busca valores, arma tu watchlist y
consulta el detalle con gráfico en vivo. Los datos llegan por WebSocket desde la API gratuita de
[Finnhub](https://finnhub.io); si no configuras una clave, la app arranca en **modo demo** con datos
simulados realistas para que sea usable al instante.

## Funcionalidades

- **Mercado**: watchlist de valores con precio, variación diaria ($/%) y mini-gráfico, actualizándose en vivo.
- **Búsqueda**: encuentra acciones por ticker o nombre y añádelas a tu lista con un clic.
- **Detalle**: precio grande, gráfico de la sesión que se construye en vivo con los ticks recibidos, y datos
  del día (apertura, máximo, mínimo, cierre anterior).
- **Tiempo real**: WebSocket de Finnhub para ticks al instante + refresco REST periódico como respaldo.
- **Modo demo**: sin clave de API, la app simula un mercado realista para poder probarla de inmediato.

La watchlist y la clave de API se guardan en `localStorage`, por lo que persisten entre sesiones en el mismo
navegador. La clave nunca sale de tu dispositivo.

## Datos en tiempo real (Finnhub)

1. Regístrate gratis en [finnhub.io/register](https://finnhub.io/register).
2. Copia tu **API key** del panel.
3. Pégala en **Ajustes → Datos en tiempo real** y pulsa «Conectar».

El plan gratuito cubre acciones y ETFs de EE. UU. (AAPL, TSLA, SPY…). Los ticks llegan durante el horario de
mercado; fuera de sesión se muestra la última cotización disponible.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción (incluye chequeo de tipos)
npm run lint     # oxlint
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · Recharts · React Router. PWA instalable.
