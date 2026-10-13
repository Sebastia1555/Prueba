// Datos de ejemplo para probar la app: una madre cuidada por tres hermanos y
// una cuidadora. Todas las fechas son relativas a hoy.

import type {
  AppData,
  Appointment,
  BusyBlock,
  DiaryEntry,
  DocumentMeta,
  DoseLog,
  Expense,
  Medication,
  Member,
  Shift,
} from '../types'
import { addDays, dateTimeMs, startOfWeek, todayISO, weekday } from './dates'
import { emptyData } from './store'
import { newId } from './labels'
import { dosesForDay } from './medication'

/** PDF mínimo de una página con texto (para documentos de ejemplo). */
function samplePdf(title: string, lines: string[]): Blob {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  const body = [
    'BT',
    '/F1 20 Tf 56 770 Td',
    `(${esc(title)}) Tj`,
    '/F1 12 Tf 0 -34 Td 16 TL',
    ...lines.map((l) => `(${esc(l)}) '`),
    'ET',
  ].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ]
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((obj, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  // WinAnsi: cada carácter es un byte (vale para los acentos del español).
  const bytes = new Uint8Array(out.length)
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff
  return new Blob([bytes], { type: 'application/pdf' })
}

export function buildSampleData(): { data: AppData; files: Record<string, Blob> } {
  const now = Date.now()
  const today = todayISO()
  const d = (n: number) => addDays(today, n)
  // Día laborable más cercano (las citas no suelen ser en fin de semana).
  const wd = (n: number) => {
    const date = d(n)
    const w = weekday(date)
    return w === 6 ? addDays(date, 2) : w === 7 ? addDays(date, 1) : date
  }
  const data = emptyData()
  data.sample = true
  const files: Record<string, Blob> = {}

  data.patient = {
    ...data.patient,
    name: 'Carmen Ruiz Martín',
    birthDate: '1941-03-14',
    address: 'C/ Mayor 12, 3º B, 28013 Madrid',
    idNumber: '01234567-L',
    healthCardNumber: 'RUMC410314000000',
    socialSecurityNumber: '28/12345678/90',
    bloodType: 'A+',
    allergies: 'Penicilina (urticaria). Ibuprofeno: le sienta mal al estómago.',
    conditions: 'Hipertensión. Diabetes tipo 2. Artrosis de rodilla. Deterioro cognitivo leve.',
    mobility: 'Camina con andador. Necesita ayuda para la ducha y para levantarse de la cama.',
    diet: 'Sin sal y baja en azúcares. Le cuesta tragar las pastillas grandes.',
    gpName: 'Dra. Elena Sanz',
    gpPhone: '912 345 678',
    healthCenter: 'Centro de Salud Las Águilas',
    insurance: '',
    dependencyGrade: 'Grado I (revisión solicitada)',
    notes: 'Lleva audífono en el oído izquierdo. Las llaves de repuesto las tiene la vecina del 3º A.',
    emergencyContacts: [
      { id: newId(), name: 'Ana Ruiz', relation: 'Hija', phone: '600 111 222' },
      { id: newId(), name: 'Pedro Ruiz', relation: 'Hijo', phone: '600 333 444' },
      { id: newId(), name: 'Mari Luz (vecina 3º A)', relation: 'Vecina', phone: '600 555 666' },
    ],
  }

  const member = (name: string, relation: string, role: Member['role'], color: string, phone: string): Member => ({
    id: newId(),
    name,
    relation,
    role,
    color,
    phone,
    email: '',
    createdAt: now,
  })
  const ana = member('Ana', 'Hija', 'admin', '#0066cc', '600 111 222')
  const pedro = member('Pedro', 'Hijo', 'familiar', '#c2410c', '600 333 444')
  const lucia = member('Lucía', 'Hija', 'familiar', '#7c3aed', '600 777 888')
  const rosa = member('Rosa', 'Cuidadora', 'cuidador', '#0f766e', '600 999 000')
  data.members = [ana, pedro, lucia, rosa]

  data.slots = [
    { id: newId(), label: 'Mañana', start: '09:00', end: '14:00', weekdays: [1, 2, 3, 4, 5, 6, 7] },
    { id: newId(), label: 'Tarde', start: '14:00', end: '20:00', weekdays: [1, 2, 3, 4, 5, 6, 7] },
    { id: newId(), label: 'Noche', start: '20:00', end: '09:00', weekdays: [1, 2, 3, 4, 5, 6, 7] },
  ]
  const [manana, tarde, noche] = data.slots

  // Disponibilidad de cada hermano.
  const block = (b: Omit<BusyBlock, 'id'>): BusyBlock => ({ id: newId(), ...b })
  data.busyBlocks = [
    block({
      memberId: pedro.id,
      title: 'Trabajo',
      repeat: 'weekly',
      weekdays: [1, 2, 3, 4, 5],
      startDate: d(-60),
      endDate: '',
      allDay: false,
      startTime: '09:00',
      endTime: '18:00',
      private: false,
    }),
    block({
      memberId: pedro.id,
      title: 'Tenis de los niños',
      repeat: 'weekly',
      weekdays: [2],
      startDate: d(-60),
      endDate: '',
      allDay: false,
      startTime: '17:00',
      endTime: '19:00',
      private: true,
    }),
    block({
      memberId: lucia.id,
      title: 'Trabajo',
      repeat: 'weekly',
      weekdays: [1, 2, 3, 4, 5],
      startDate: d(-60),
      endDate: '',
      allDay: false,
      startTime: '07:00',
      endTime: '14:00',
      private: false,
    }),
    block({
      memberId: ana.id,
      title: 'Viaje a Valencia',
      repeat: 'none',
      weekdays: [],
      startDate: d(12),
      endDate: d(14),
      allDay: true,
      startTime: '',
      endTime: '',
      private: false,
    }),
  ]

  // Reparto semanal habitual: [mañana, tarde, noche] de lunes a domingo.
  const pattern: Record<number, [Member | null, Member, Member]> = {
    1: [rosa, ana, pedro],
    2: [rosa, ana, pedro],
    3: [rosa, lucia, ana],
    4: [rosa, lucia, ana],
    5: [rosa, lucia, pedro],
    6: [lucia, pedro, lucia],
    7: [ana, ana, pedro],
  }
  const series = new Map<string, string>()
  const seriesFor = (memberId: string, wd: number, slotId: string) => {
    const key = `${memberId}|${wd}|${slotId}`
    if (!series.has(key)) series.set(key, newId())
    return series.get(key)!
  }
  const anaTrip = [d(12), d(13), d(14)]
  const gaps = new Set([`${d(2)}|${tarde.id}`, `${d(4)}|${noche.id}`, `${d(5)}|${tarde.id}`])
  const shifts: Shift[] = []
  const firstDay = addDays(startOfWeek(today), -7)
  for (let i = 0; i < 42; i++) {
    const date = addDays(firstDay, i)
    const wd = weekday(date)
    const row = pattern[wd]
    ;[manana, tarde, noche].forEach((slot, idx) => {
      const who = row[idx]
      if (!who) return
      if (who.id === ana.id && anaTrip.includes(date)) return
      if (gaps.has(`${date}|${slot.id}`)) return
      shifts.push({
        id: newId(),
        date,
        slotId: slot.id,
        memberId: who.id,
        note: '',
        seriesId: seriesFor(who.id, wd, slot.id),
        coverRequested: false,
      })
    })
  }
  // Pedro pide que alguien le cubra una noche de la semana que viene.
  const pedroNight = shifts.find((s) => s.memberId === pedro.id && s.slotId === noche.id && s.date >= d(3))
  if (pedroNight) {
    pedroNight.coverRequested = true
    pedroNight.note = 'Tengo cena de empresa, ¿alguien me la cambia?'
  }
  data.shifts = shifts

  // Medicación.
  const med = (m: Partial<Medication> & Pick<Medication, 'name'>): Medication => ({
    id: newId(),
    strength: '',
    form: 'comprimido',
    purpose: '',
    instructions: '',
    doses: [],
    frequency: 'daily',
    weekdays: [],
    intervalDays: 1,
    asNeeded: false,
    startDate: d(-120),
    endDate: '',
    unitsPerPackage: 28,
    stockUnits: 28,
    stockCountedAt: now,
    alertDays: 7,
    purchaseClaimedBy: null,
    prescriptionExpires: '',
    prescriber: 'Dra. Elena Sanz',
    active: true,
    createdAt: now,
    ...m,
  })
  data.medications = [
    med({
      name: 'Omeprazol',
      strength: '20 mg',
      form: 'cápsula',
      purpose: 'Protector de estómago',
      instructions: 'En ayunas, 30 minutos antes del desayuno',
      doses: [{ time: '08:30', amount: 1 }],
      unitsPerPackage: 56,
      stockUnits: 40,
      prescriptionExpires: d(150),
    }),
    med({
      name: 'Enalapril',
      strength: '10 mg',
      purpose: 'Tensión arterial',
      instructions: 'Con el desayuno',
      doses: [{ time: '09:00', amount: 1 }],
      stockUnits: 23,
      prescriptionExpires: d(40),
    }),
    med({
      name: 'Metformina',
      strength: '850 mg',
      purpose: 'Diabetes',
      instructions: 'Con el desayuno y con la cena',
      doses: [
        { time: '09:00', amount: 1 },
        { time: '21:00', amount: 1 },
      ],
      unitsPerPackage: 50,
      stockUnits: 9,
      prescriptionExpires: d(8),
    }),
    med({
      name: 'Adiro',
      strength: '100 mg',
      purpose: 'Para la circulación',
      instructions: 'Con la comida',
      doses: [{ time: '14:00', amount: 1 }],
      unitsPerPackage: 30,
      stockUnits: 5,
      purchaseClaimedBy: pedro.id,
      prescriptionExpires: d(90),
    }),
    med({
      name: 'Atorvastatina',
      strength: '20 mg',
      purpose: 'Colesterol',
      instructions: 'Con la cena',
      doses: [{ time: '21:00', amount: 1 }],
      stockUnits: 60,
      prescriptionExpires: d(120),
    }),
    med({
      name: 'Lorazepam',
      strength: '1 mg',
      purpose: 'Para dormir',
      instructions: 'Solo media pastilla, al acostarse',
      doses: [{ time: '22:30', amount: 0.5 }],
      unitsPerPackage: 30,
      stockUnits: 14,
      prescriptionExpires: d(60),
    }),
    med({
      name: 'Hidroferol',
      strength: '0,266 mg',
      form: 'ampolla',
      purpose: 'Vitamina D',
      instructions: 'Ampolla bebible, mezclada con zumo',
      doses: [{ time: '09:00', amount: 1 }],
      frequency: 'interval',
      intervalDays: 15,
      startDate: d(-3),
      unitsPerPackage: 5,
      stockUnits: 4,
    }),
    med({
      name: 'Paracetamol',
      strength: '1 g',
      purpose: 'Dolor de rodilla',
      instructions: 'Máximo 3 al día, separando 8 horas',
      asNeeded: true,
      unitsPerPackage: 40,
      stockUnits: 18,
    }),
  ]

  // Tomas ya registradas: ayer completas y hoy las que ya han pasado.
  const logs: DoseLog[] = []
  const logDay = (date: string, by: (time: string) => Member) => {
    for (const dose of dosesForDay(data.medications, [], date)) {
      const at = dateTimeMs(date, dose.time) + 5 * 60_000
      if (at > now) continue
      logs.push({
        id: newId(),
        medicationId: dose.med.id,
        date,
        time: dose.time,
        status: 'given',
        memberId: by(dose.time).id,
        at,
        amount: dose.amount,
        note: '',
      })
    }
  }
  const byShift = (date: string) => (time: string) => {
    const slot = time < '14:00' && time >= '09:00' ? manana : time >= '14:00' && time < '20:00' ? tarde : noche
    const sh = shifts.find((s) => s.slotId === slot.id && s.date === (time < '09:00' ? addDays(date, -1) : date))
    return data.members.find((m) => m.id === sh?.memberId) ?? ana
  }
  logDay(d(-2), byShift(d(-2)))
  logDay(d(-1), byShift(d(-1)))
  const morning = dosesForDay(data.medications, [], today).filter((x) => x.time <= '09:00')
  for (const dose of morning) {
    const at = dateTimeMs(today, dose.time) + 10 * 60_000
    if (at > now) continue
    logs.push({
      id: newId(),
      medicationId: dose.med.id,
      date: today,
      time: dose.time,
      status: 'given',
      memberId: byShift(today)(dose.time).id,
      at,
      amount: dose.amount,
      note: '',
    })
  }
  const paracetamol = data.medications.find((m) => m.name === 'Paracetamol')!
  logs.push({
    id: newId(),
    medicationId: paracetamol.id,
    date: d(-2),
    time: '16:00',
    status: 'given',
    memberId: ana.id,
    at: dateTimeMs(d(-2), '16:00'),
    amount: 1,
    note: 'Dolor de rodilla',
  })
  data.doseLogs = logs

  // Citas.
  const appt = (a: Partial<Appointment> & Pick<Appointment, 'date' | 'time' | 'specialty'>): Appointment => ({
    id: newId(),
    durationMin: 90,
    doctor: '',
    place: '',
    address: '',
    reason: '',
    companionId: null,
    transport: '',
    preparation: '',
    questions: '',
    summary: '',
    followUp: '',
    status: 'scheduled',
    createdAt: now,
    ...a,
  })
  const cardio = appt({
    date: wd(-20),
    time: '10:30',
    specialty: 'Cardiología',
    doctor: 'Dr. Martín Gil',
    place: 'Hospital Universitario La Paz',
    address: 'Paseo de la Castellana 261, Madrid',
    reason: 'Revisión de tensión arterial',
    companionId: ana.id,
    transport: 'Taxi',
    questions: '¿Hay que cambiar la dosis de Enalapril?\n¿Puede seguir caminando 30 minutos al día?',
    summary: 'Tensión bien controlada. Mantener Enalapril 10 mg. Ecocardiograma de control en 6 meses.',
    followUp: 'Pedir cita para ecocardiograma en abril.',
    status: 'done',
  })
  const analiticaPasada = appt({
    date: wd(-35),
    time: '08:15',
    durationMin: 60,
    specialty: 'Analítica',
    place: 'Centro de Salud Las Águilas',
    reason: 'Control de diabetes',
    companionId: pedro.id,
    preparation: 'En ayunas',
    summary: 'Hemoglobina glicosilada 7,1 %. La doctora lo revisará en la próxima consulta.',
    status: 'done',
  })
  data.appointments = [
    cardio,
    analiticaPasada,
    appt({
      date: wd(2),
      time: '08:30',
      durationMin: 60,
      specialty: 'Analítica',
      place: 'Centro de Salud Las Águilas',
      address: 'C/ Los Yébenes 54, Madrid',
      reason: 'Analítica de control trimestral',
      companionId: ana.id,
      transport: 'Coche de Ana',
      preparation: 'En ayunas desde las 22:00. Llevar la tarjeta sanitaria y el volante.',
    }),
    appt({
      date: wd(9),
      time: '11:00',
      specialty: 'Oftalmología',
      doctor: 'Dra. Paula Ortega',
      place: 'Hospital Universitario La Paz',
      address: 'Paseo de la Castellana 261, Madrid',
      reason: 'Revisión de cataratas',
      questions: '¿Hace falta operar la catarata del ojo derecho?\n¿Puede seguir usando las gotas lubricantes?',
      preparation: 'Le dilatarán la pupila: no podrá ver bien durante unas horas.',
    }),
    appt({
      date: wd(23),
      time: '10:00',
      durationMin: 45,
      specialty: 'Médico de cabecera',
      doctor: 'Dra. Elena Sanz',
      place: 'Centro de Salud Las Águilas',
      reason: 'Revisar resultados de la analítica y renovar recetas',
    }),
  ]

  // Documentos (PDF de ejemplo guardados en el dispositivo).
  const doc = (meta: Omit<DocumentMeta, 'id' | 'fileName' | 'mimeType' | 'size' | 'addedAt'>, lines: string[]) => {
    const id = newId()
    const blob = samplePdf(meta.title, lines)
    files[id] = blob
    const fileName = `${meta.title.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-')}.pdf`
    return { id, fileName, mimeType: 'application/pdf', size: blob.size, addedAt: now, ...meta } as DocumentMeta
  }
  data.documents = [
    doc(
      {
        title: 'Informe de Cardiología',
        category: 'informe',
        date: cardio.date,
        appointmentId: cardio.id,
        notes: 'Informe entregado al salir de consulta.',
        addedBy: ana.id,
      },
      [
        'Paciente: Carmen Ruiz Martín',
        'Servicio de Cardiología - Hospital Universitario La Paz',
        '',
        'Tensión arterial: 132/78 mmHg. Frecuencia cardiaca: 72 lpm.',
        'Juicio clínico: hipertensión arterial bien controlada.',
        'Tratamiento: mantener Enalapril 10 mg cada 24 h.',
        'Plan: ecocardiograma de control en 6 meses.',
        '',
        '(Documento de ejemplo generado por la app)',
      ],
    ),
    doc(
      {
        title: 'Resultados de analítica',
        category: 'analitica',
        date: analiticaPasada.date,
        appointmentId: analiticaPasada.id,
        notes: '',
        addedBy: pedro.id,
      },
      [
        'Paciente: Carmen Ruiz Martín',
        'Glucosa: 128 mg/dL',
        'Hemoglobina glicosilada (HbA1c): 7,1 %',
        'Colesterol total: 186 mg/dL',
        'Creatinina: 0,9 mg/dL',
        '',
        '(Documento de ejemplo generado por la app)',
      ],
    ),
    doc(
      {
        title: 'Hoja de tratamiento activo',
        category: 'receta',
        date: d(-40),
        appointmentId: null,
        notes: 'Plan de medicación impreso en el centro de salud.',
        addedBy: ana.id,
      },
      [
        'Omeprazol 20 mg - 1 cápsula en ayunas',
        'Enalapril 10 mg - 1 comprimido en el desayuno',
        'Metformina 850 mg - 1 comprimido desayuno y cena',
        'Adiro 100 mg - 1 comprimido en la comida',
        'Atorvastatina 20 mg - 1 comprimido en la cena',
        'Lorazepam 1 mg - medio comprimido al acostarse',
        '',
        '(Documento de ejemplo generado por la app)',
      ],
    ),
    doc(
      {
        title: 'Resolución grado de dependencia',
        category: 'administrativo',
        date: d(-200),
        appointmentId: null,
        notes: 'Grado I. Se ha pedido revisión.',
        addedBy: lucia.id,
      },
      ['Resolución de reconocimiento de la situación de dependencia', 'Grado reconocido: Grado I', '', '(Documento de ejemplo generado por la app)'],
    ),
  ]

  // Diario.
  const entry = (at: number, m: Member, text: string, tags: DiaryEntry['tags'], important = false): DiaryEntry => ({
    id: newId(),
    at,
    memberId: m.id,
    text,
    tags,
    important,
  })
  data.diary = [
    entry(dateTimeMs(d(-3), '19:40'), pedro, 'Ha tropezado con la alfombra del pasillo, sin llegar a caerse. Habría que quitarla.', ['incidencia'], true),
    entry(dateTimeMs(d(-2), '16:10'), ana, 'Se queja de la rodilla derecha. Le he dado un paracetamol a las 16:00 y ha mejorado.', ['salud']),
    entry(dateTimeMs(d(-1), '21:30'), lucia, 'Ha cenado poco y estaba algo desorientada al atardecer. Se ha tranquilizado viendo la tele.', ['comida', 'animo']),
    entry(Math.min(now, dateTimeMs(today, '10:15')), rosa, 'Ha desayunado bien. Paseo de 20 minutos con el andador por el parque.', ['comida']),
  ]

  // Gastos.
  const expense = (e: Omit<Expense, 'id' | 'createdAt' | 'notes'> & { notes?: string }): Expense => ({
    id: newId(),
    createdAt: now,
    notes: '',
    ...e,
  })
  const siblings = [ana.id, pedro.id, lucia.id]
  data.expenses = [
    expense({ date: d(-25), concept: 'Sueldo de Rosa (septiembre)', category: 'cuidadora', amountCents: 105000, paidById: ana.id, splitAmong: siblings }),
    expense({ date: d(-20), concept: 'Taxi a Cardiología (ida y vuelta)', category: 'transporte', amountCents: 2840, paidById: ana.id, splitAmong: siblings }),
    expense({ date: d(-12), concept: 'Farmacia: Metformina, Enalapril y Omeprazol', category: 'farmacia', amountCents: 3845, paidById: pedro.id, splitAmong: siblings }),
    expense({ date: d(-6), concept: 'Cojín antiescaras', category: 'ortopedia', amountCents: 5990, paidById: lucia.id, splitAmong: siblings }),
  ]
  data.settlements = [{ id: newId(), date: d(-18), fromId: pedro.id, toId: ana.id, amountCents: 30000, note: 'Bizum' }]

  return { data, files }
}
