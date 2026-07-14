# Buffett Daily

Recomendador diario de compra *value* sobre el S&P 500, con filosofía Warren Buffett / Benjamin Graham:
negocios excelentes a precio razonable y con **margen de seguridad**. La app dice cada día qué comprar y por
qué —o dice explícitamente que **hoy no hay compra**, porque la disciplina es no comprar calidad cara ni
basura barata.

> **Estado: Fase 1 (MVP).** Interfaz de datos mockeada + motor de scoring (3 capas) + Home con la
> recomendación diaria y el mensaje de "no comprar hoy". Las siguientes fases añaden registro de operaciones,
> cartera, track record y ficha de detalle.

## El cerebro: motor de scoring value

Un valor solo es **comprable** si pasa el filtro de calidad **y** tiene margen de seguridad suficiente
(≥ 25%). El código vive aislado y testeable en `src/engine/`.

1. **Calidad del negocio** (`valuationEngine.ts` → `assessQuality`) — filtros duros + score 0-100:
   ROE 10a > 12%, Deuda/EBITDA < 3 (o Deuda/Patrimonio < 1), FCF positivo ≥ 8 de 10 años, BPA estable/creciente,
   márgenes operativos positivos. Score ponderado: ROIC 30% · consistencia y crecimiento del BPA 20% ·
   salud del balance 20% · márgenes 15% · conversión de FCF 15%.
2. **Valoración y margen de seguridad** (`assessValuation`) — DCF a dos etapas sobre *owner earnings*
   (crecimiento conservador, descuento ~9,5%), número de Graham como cross-check, P/E vs media histórica,
   *earnings yield* (EBIT/EV) frente al bono a 10 años.
3. **Timing de la caída** (`assessTiming`) — caída desde máximos de 52s, precio vs media de 200 sesiones, RSI,
   y penalización de *value trap* si la caída coincide con deterioro del negocio.

**Ranking final** (`WEIGHTS`): Calidad 45% + Valoración 40% + Timing 15% (*value-first*: el timing solo
prioriza entre buenos candidatos). La Home muestra 1 recomendación principal + hasta 3 alternativas, cada una
con convicción, tesis, precio, valor intrínseco, margen de seguridad y caída desde máximos; más una
*watchlist* de negocios excelentes que aún no están baratos.

## Interfaz de datos

La app **consume** una interfaz de datos (`src/data/provider.ts`), no implementa la ingesta externa:
`getQuote`, `getFundamentals`, `getPriceHistory`, `getSP500Constituents`, `getBenchmark`. En la Fase 1 está
respaldada por datos mock deterministas (`src/data/mockData.ts`); cada función puede cablearse a una API real
(Finnhub u otra) en fases posteriores sin tocar la UI ni el motor.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción (incluye chequeo de tipos)
npm run lint     # oxlint
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · React Router. Diseño con lenguaje visual Apple (acento azul
único, tipografía apretada, cromo mínimo). PWA instalable. Idioma: español.

## Aviso legal

Buffett Daily es una herramienta de análisis y registro personal; **no constituye asesoramiento financiero**.
Las decisiones de inversión y sus riesgos son responsabilidad exclusiva del usuario.
