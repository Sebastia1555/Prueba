// Contenido de la web corporativa. Textos elaborados a partir de la información
// pública de Sebastián Caldentey, S.A. (taller de piedra de Santanyí, Mallorca).
// Propuesta / demostración — datos de contacto orientativos.

export const empresa = {
  nombre: 'Sebastián Caldentey',
  claim: 'Tradición en piedra natural',
  fundacion: '1946',
  localidad: 'Santanyí, Mallorca',
}

export const stats = [
  { valor: '+75', etiqueta: 'años de oficio' },
  { valor: '3ª', etiqueta: 'generación de artesanos' },
  { valor: '100%', etiqueta: 'cantera propia' },
  { valor: '+500', etiqueta: 'proyectos entregados' },
]

export type Producto = {
  titulo: string
  descripcion: string
  icono: string
}

export const productos: Producto[] = [
  {
    titulo: 'Recercados y jambas',
    descripcion:
      'Marcos de puertas y ventanas tallados en piedra de Santanyí, lisos o moldurados, que enmarcan y protegen cada hueco de la fachada.',
    icono: 'frame',
  },
  {
    titulo: 'Arcadas y dinteles',
    descripcion:
      'Arcos de medio punto, rebajados y de descarga, junto con dinteles y claves resistentes para porches, patios y galerías.',
    icono: 'arch',
  },
  {
    titulo: 'Columnas y capiteles',
    descripcion:
      'Fustes, basas y capiteles torneados a mano y a máquina para porches, pérgolas y espacios de representación.',
    icono: 'column',
  },
  {
    titulo: 'Balaustradas',
    descripcion:
      'Balaustres, pasamanos y remates para terrazas, escaleras y jardines, con un aire mediterráneo atemporal.',
    icono: 'balustrade',
  },
  {
    titulo: 'Revestimientos de fachada',
    descripcion:
      'Placas y despieces de mampostería en piedra de Santanyí que aportan elegancia, durabilidad y aislamiento natural.',
    icono: 'wall',
  },
  {
    titulo: 'Encimeras y mobiliario',
    descripcion:
      'Encimeras, fregaderos, chimeneas, bancos y piezas singulares de mobiliario exterior labradas a medida.',
    icono: 'counter',
  },
]

export type Servicio = {
  titulo: string
  descripcion: string
}

export const servicios: Servicio[] = [
  {
    titulo: 'Suministro a obra',
    descripcion:
      'Abastecemos a constructoras y promotoras con piezas normalizadas o a medida, con plazos y logística coordinados con el ritmo de la obra.',
  },
  {
    titulo: 'Fabricación a medida',
    descripcion:
      'Interpretamos planos de arquitectos y estudios de diseño y ejecutamos despieces y piezas únicas según proyecto.',
  },
  {
    titulo: 'Rehabilitación y patrimonio',
    descripcion:
      'Restauramos y reproducimos elementos de piedra en edificios históricos respetando técnicas y proporciones originales.',
  },
  {
    titulo: 'Asesoramiento técnico',
    descripcion:
      'Acompañamos al prescriptor desde la elección del acabado hasta la puesta en obra, resolviendo detalles constructivos.',
  },
]

export type Paso = {
  numero: string
  titulo: string
  descripcion: string
}

export const proceso: Paso[] = [
  {
    numero: '01',
    titulo: 'Extracción en cantera propia',
    descripcion:
      'Seleccionamos el bloque directamente en nuestra cantera de Santanyí, garantizando trazabilidad y homogeneidad de tono.',
  },
  {
    numero: '02',
    titulo: 'Fabricación en taller',
    descripcion:
      'Corte, moldura y talla combinando control numérico con el trabajo manual de nuestros artesanos.',
  },
  {
    numero: '03',
    titulo: 'Acabados',
    descripcion:
      'Abujardado, apomazado, envejecido o pulido: cada pieza recibe el acabado que pide el proyecto.',
  },
  {
    numero: '04',
    titulo: 'Entrega y puesta en obra',
    descripcion:
      'Embalaje, transporte y coordinación con la obra para que la piedra llegue lista para colocar.',
  },
]

export type Ventaja = {
  titulo: string
  descripcion: string
  icono: string
}

export const ventajas: Ventaja[] = [
  {
    titulo: 'Cantera propia',
    descripcion:
      'Controlamos todo el ciclo, de la extracción a la entrega, sin intermediarios y con la mejor piedra de Santanyí siempre disponible.',
    icono: 'quarry',
  },
  {
    titulo: 'Tradición artesana',
    descripcion:
      'Tres generaciones tallando piedra desde los años cuarenta: un saber hacer que no se improvisa.',
    icono: 'hand',
  },
  {
    titulo: 'Tecnología actual',
    descripcion:
      'Maquinaria de control numérico que garantiza precisión, repetibilidad y plazos ajustados en grandes series.',
    icono: 'gear',
  },
  {
    titulo: 'Piezas a medida',
    descripcion:
      'Fabricamos según plano cualquier elemento arquitectónico, por singular o exigente que sea el diseño.',
    icono: 'ruler',
  },
]

export type Proyecto = {
  titulo: string
  tipo: string
}

export const proyectos: Proyecto[] = [
  { titulo: 'Villa mediterránea', tipo: 'Vivienda unifamiliar · Fachada y porches' },
  { titulo: 'Promoción residencial', tipo: 'Obra nueva · Recercados y balaustradas' },
  { titulo: 'Hotel con encanto', tipo: 'Rehabilitación · Revestimientos y suelos' },
  { titulo: 'Bodega', tipo: 'Uso industrial · Arcadas y mampostería' },
  { titulo: 'Iglesia parroquial', tipo: 'Patrimonio · Restauración de sillería' },
  { titulo: 'Jardín señorial', tipo: 'Exterior · Fuentes y balaustradas' },
]

export const contacto = {
  telefono: '+34 971 000 000',
  email: 'info@sebastiancaldentey.com',
  direccion: 'Carrer Campos, 1 · 07650 Santanyí, Illes Balears',
  horario: 'Lunes a viernes · 8:00 – 17:00',
}
