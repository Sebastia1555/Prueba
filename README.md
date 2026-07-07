# Pádel Tracker

Aplicación web para llevar el seguimiento de partidos de pádel de un grupo abierto de amigos: registra el
histórico de partidos, calcula automáticamente el ELO de cada jugador y predice bajo demanda la probabilidad
de victoria de dos parejas antes de un partido.

## Funcionalidades

- **Ranking**: todos los jugadores ordenados por ELO, con nivel (1-7), % de victorias y forma reciente.
- **Historial de partidos**: filtrable por jugador, con edición y eliminación (recalculando el ELO de todos
  los jugadores desde cero cada vez).
- **Registrar partido**: formulario con alta rápida de jugadores nuevos sin perder lo ya rellenado.
- **Predicción**: probabilidad de victoria de dos parejas, con ajuste por enfrentamientos directos y datos de
  sinergia entre compañeros.
- **Perfil de jugador**: evolución del ELO a lo largo del tiempo, mejor y peor compañero de pareja.

Los datos se guardan en `localStorage`, por lo que persisten entre sesiones en el mismo navegador. Desde
Ajustes se pueden cargar datos de ejemplo o borrar todo para empezar con el grupo real.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción (incluye chequeo de tipos)
npm run lint      # oxlint
```
