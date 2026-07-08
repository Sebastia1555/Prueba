# Sebastián Caldentey · Web corporativa

Propuesta de sitio web corporativo para **Sebastián Caldentey**, taller de piedra de Santanyí
(Mallorca) especializado en la extracción, fabricación y distribución de piedra natural para
constructoras, promotoras, arquitectos y estudios de diseño.

> Proyecto de demostración. Los textos están elaborados a partir de información pública sobre la
> empresa y su actividad; los datos de contacto son orientativos.

## Secciones

- **Inicio (hero)**: propuesta de valor y cifras clave (años de oficio, generaciones, cantera propia).
- **Empresa**: historia y tradición artesana de la piedra de Santanyí.
- **Productos**: recercados y jambas, arcadas, columnas, balaustradas, revestimientos y encimeras.
- **Servicios**: soluciones para profesionales (suministro a obra, fabricación a medida,
  rehabilitación y patrimonio, asesoramiento técnico).
- **Proceso**: de la cantera propia a la puesta en obra.
- **Por qué elegirnos**: cantera propia, tradición, tecnología y piezas a medida.
- **Proyectos**: galería de tipologías de obra.
- **Contacto**: formulario de solicitud de presupuesto y datos de la empresa.

## Tecnología

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) como bundler
- [Tailwind CSS v4](https://tailwindcss.com/) para el diseño
- Web de una sola página con navegación por anclas, responsive y con textura de piedra generada
  íntegramente con CSS (sin imágenes externas más allá de las tipografías).

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción (incluye chequeo de tipos)
npm run preview  # sirve el build de producción
npm run lint     # oxlint
```

El contenido editable (productos, servicios, proceso, ventajas, proyectos y datos de contacto)
está centralizado en [`src/content.ts`](src/content.ts).
